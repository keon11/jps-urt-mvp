const phase6=process.argv.includes('--phase-6');const phase5=phase6||process.argv.includes('--issue-5');if(phase5)process.argv.push('--issue-4');
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { login } from "../services/api/src/adapters.js";
import { pool } from "../services/api/src/db.js";
import { hash } from "../services/api/src/fixtures.js";
import { demonstrationPassword } from "../tests/browser/local-account.js";
const traceOffset=(await readFile(".runtime/traces.jsonl","utf8").catch(()=>"" )).length;
const run = promisify(execFile),
  base = "http://localhost:3000";
const t = (await login("reviewer", demonstrationPassword())).access_token;
const headers = {
  Authorization: "Bearer " + t,
  "Content-Type": "application/json",
};
const get = async (p: string) => (await fetch(base + p, { headers })).json();
async function ready(url: string,maxMs=60000) {
  const start = performance.now();
  while (performance.now() - start < maxMs) {
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(500) })).ok)
        return (performance.now() - start) / 1000;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw Error("Service readiness exceeded predeclared "+maxMs/1000+" seconds");
}
const result: any = {
  at: new Date().toISOString(),
  scope:
    "Actual local synthetic FHIR and AI service stop/start; original source patient class remains unchanged.",
};
try {
  const before = await get("/api/cases/respiratory"),
    count = (
      await pool.query(
        "SELECT count(*)::int AS n FROM audit WHERE case_id='respiratory'",
      )
    ).rows[0].n;
  await run("docker", ["compose", "stop", "medplum"]);
  try {
    const alerts = await get("/api/operational-alerts");
    assert(alerts.alerts.some((a: any) => a.service === "medplum"));
    const r = await fetch(base + "/api/cases/respiratory/reviews", {
      method: "POST",
      headers,
      body: JSON.stringify({ kind: "initial" }),
    });
    assert.equal(r.status, 502);
    const after = await get("/api/cases/respiratory");
    assert.equal(hash(after.assessment), hash(before.assessment));
    assert.equal(
      (
        await pool.query(
          "SELECT count(*)::int AS n FROM audit WHERE case_id='respiratory'",
        )
      ).rows[0].n,
      count,
    );
    result.fhirOutage = {
      httpStatus: r.status,
      previousAssessmentPreserved: true,
      noFalseSuccessAudit: true,
      alertRaised: true,
    };
  } finally {
    await run("docker", ["compose", "start", "medplum"]);
    result.fhirRecoverySeconds = await ready(
      "http://localhost:8103/healthcheck",
    );
  }
  if((process.argv.includes("--issue-3")||process.argv.includes("--issue-4"))){
    const beforeRule=await get('/api/cases/respiratory');
    const priorCount=(await pool.query("SELECT count(*)::int AS n FROM audit WHERE case_id='respiratory'")).rows[0].n;
    await run('docker',['compose','stop','cqf']);
    try{
      const alerts=await get('/api/operational-alerts');assert(alerts.alerts.some((a:any)=>a.service==='cqf'));
      const r=await fetch(base+'/api/cases/respiratory/reviews',{method:'POST',headers,body:JSON.stringify({kind:'initial'})});assert.equal(r.status,502);
      const afterRule=await get('/api/cases/respiratory');assert.equal(hash(afterRule.assessment),hash(beforeRule.assessment));
      assert.equal((await pool.query("SELECT count(*)::int AS n FROM audit WHERE case_id='respiratory'")).rows[0].n,priorCount);
      result.ruleEngineOutage={httpStatus:r.status,previousAssessmentPreserved:true,noFalseSuccessAudit:true,alertRaised:true};
    }finally{await run('docker',['compose','start','cqf']);result.ruleEngineRecoverySeconds=await ready('http://localhost:8080/fhir/metadata',120000);}
  }
  await run("docker", ["compose", "stop", "local-model"]);
  try {
    const alerts = await get("/api/operational-alerts");
    assert(alerts.alerts.some((a: any) => a.service === "localModel"));
    const start = performance.now(),
      r = await fetch(base + "/api/cases/respiratory/reviews", {
        method: "POST",
        headers,
        body: JSON.stringify({ kind: "initial" }),
      });
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.assessment.ai.mode, "rules-fallback");
    result.aiOutage = {
      mode: d.assessment.ai.mode,
      seconds: (performance.now() - start) / 1000,
      alertRaised: true,
    };
  } finally {
    await run("docker", ["compose", "start", "local-model"]);
    result.aiRecoverySeconds = await ready("http://localhost:11434/health");
  }
  const start = performance.now(),
    r = await fetch(base + "/api/cases/respiratory/reviews", {
      method: "POST",
      headers,
      body: JSON.stringify({ kind: "initial" }),
    });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.assessment.ai.mode, "local-model");
  result.recoveredClinicalReview = {
    mode: d.assessment.ai.mode,
    seconds: (performance.now() - start) / 1000,
  };
  assert(result.fhirRecoverySeconds <= 60 && result.aiRecoverySeconds <= 60);
  const after = await get("/api/cases/respiratory");
  assert.deepEqual(
    after.bundle.entry.find((e: any) => e.resource.resourceType === "Encounter")
      .resource.class,
    before.bundle.entry.find(
      (e: any) => e.resource.resourceType === "Encounter",
    ).resource.class,
  );
  const metrics = await (await fetch(base + "/metrics")).text();
  assert(metrics.includes("ur_http_request_duration_seconds_count"));
  result.requestMetricsObserved = true;
  await new Promise((r) => setTimeout(r, 200));
  const spans = (await readFile(".runtime/traces.jsonl", "utf8")).slice(traceOffset)
    .trim()
    .split("\n")
    .map((s) => JSON.parse(s));
  const roots = spans.filter((s) => s.name === "http.request"),
    children = spans.filter(
      (s) =>
        s.name === "upstream.request" &&
        roots.some(
          (r) => r.spanId === s.parentSpanId && r.traceId === s.traceId,
        ),
    );
  assert(
    roots.length && children.length,
    "Actual parent/child request traces required",
  );
  const samples = [
    roots.find((r) => children.some((c) => c.parentSpanId === r.spanId)),
    ...children.slice(-3),
  ];
  for (const s of spans) {
    assert(
      Object.keys(s.attributes).every((k) =>
        [
          "http.request.method",
          "http.route",
          "http.response.status_code",
          "request.id",
        ].includes(k),
      ),
    );
  }
  result.tracing = {
    currentDrillOnly:true,
    rootSpans: roots.length,
    correlatedUpstreamSpans: children.length,
    samples,
    sourceContentExported: false,
  };
  result.passed = true;
} catch (e) {
  result.passed = false;
  result.error = (e as Error).message;
  process.exitCode = 1;
} finally {
  await run("docker", ["compose", "start", "medplum", "local-model", ...((process.argv.includes("--issue-3")||process.argv.includes("--issue-4"))?["cqf"]:[])]).catch(
    () => {},
  );
  await pool.end();
  await writeFile(
    (process.argv.includes("--issue-3")||process.argv.includes("--issue-4"))?`artifacts/${process.argv.includes("--issue-4")?(phase6?"phase-6":phase5?"issue-5":"issue-4"):"issue-3"}/fault-recovery.json`:"artifacts/issue-2/fault-recovery.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result, null, 2));
}
