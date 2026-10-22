import {createWriteStream} from "node:fs";
import {once} from "node:events";
import { performance } from "node:perf_hooks";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { cpus, totalmem } from "node:os";
import assert from "node:assert/strict";
import pg from "pg";
import {
  isolatedContext,
  startApi,
  stopApi,
  closeOriginal,
  verifyAudit,
  docker,
} from "./reliability-context.js";
import { pool } from "../services/api/src/db.js";
import { config } from "../services/api/src/config.js";
import { login } from "../services/api/src/adapters.js";
import { demonstrationPassword } from "../tests/browser/local-account.js";
const performanceRun=process.argv.find(a=>a.startsWith("--performance="))?.split("=")[1];
if(performanceRun&&!['baseline','optimized','optimized-budgeted','probe'].includes(performanceRun))throw Error("Invalid performance run label");
const hour=process.argv.includes("--hour")||!!performanceRun;
const extended=hour||process.argv.includes("--extended");
const durationSeconds=performanceRun==="probe"?120:hour?3600:extended?600:120;
const p95Target=performanceRun?.startsWith("optimized")?500:1000;
const outputDirectory=performanceRun?"artifacts/issue-5/"+performanceRun:hour?"artifacts/issue-4":extended?"artifacts/issue-3":"artifacts/issue-2";
await mkdir(outputDirectory,{recursive:true});
const rawSink=hour?createWriteStream(outputDirectory+"/soak-requests.jsonl"):undefined;
rawSink?.setMaxListeners(60);
const raw:{elapsedMs:number,session:number,status:string,durationMs:number}[]=[];
const samples:{elapsedSeconds:number,responses:number,rssBytes:number}[]=[];
const c = await isolatedContext();
let child: any;
const result: any = {
  startedAt: new Date().toISOString(),
  scope:
    "Authenticated paginated worklist API; 10,000 cloned fictional queue records in an isolated database. Not a clinical/FHIR population or a large-queue UI certification.",
  thresholds: {
    rows: 10000,
    sessions: 25,
    seconds: durationSeconds,
    ...(hour?{peakApiRssBytes:1073741824}:{}),
    p95Ms: p95Target,
    errorFraction: 0.01,
    minThroughput: 20,
    apiRecoverySeconds: 15,
    restoreSeconds: 120,
  },
  host: {
    node: process.version,
    logicalCPUs: cpus().length,
    totalMemoryBytes: totalmem(),
  },
  database: c.dbname,
};
try {
  const verifyName = "ur_issue2_verify_" + Date.now();
  assert(/^ur_issue2_verify_\d+$/.test(verifyName));
  const url = new URL(config.database),
    startRestore = performance.now();
  await pool.query(`CREATE DATABASE "${verifyName}"`);
  await docker(
    [
      "pg_restore",
      "--no-owner",
      "--no-acl",
      "-U",
      url.username,
      "-d",
      verifyName,
    ],
    c.dump,
  );
  url.pathname = "/" + verifyName;
  const verifier = new pg.Pool({ connectionString: url.href });
  const restored = {
    cases: (await verifier.query("SELECT count(*)::int AS n FROM cases"))
      .rows[0].n,
    audit: await verifyAudit(verifier),
  };
  assert.deepEqual(restored, c.before);
  result.restore = {
    target: verifyName,
    seconds: (performance.now() - startRestore) / 1000,
    originalBackupRestoreSeconds: c.backupRestoreSeconds,
    ...restored,
  };
  await verifier.end();
  assert(result.restore.seconds <= 120);
  const liveBefore = {
    cases: (await pool.query("SELECT count(*)::int AS n FROM cases")).rows[0].n,
    audit: await verifyAudit(pool),
  };
  await c.db.query(
    `INSERT INTO cases(id,patient_id,encounter_id,label,scenario,bundle,workflow,assessment,created_at,updated_at) SELECT 'bench-'||g,patient_id,encounter_id||'-bench-'||g,'Benchmark '||g||' Fictional','synthetic-benchmark',bundle,workflow,jsonb_set(assessment,'{priority}',to_jsonb(g%101)),created_at,updated_at FROM cases CROSS JOIN generate_series(1,10000) AS g WHERE id='respiratory' ON CONFLICT(id) DO NOTHING`,
  );
  child = await startApi(c.dsn, true);
  const tokens: string[] = [];
  const expiresAt:number[]=[];
  let authenticationRenewals=0;
  for (let i = 0; i < 25; i++){
    const session=await login("reviewer",demonstrationPassword());
    tokens.push(session.access_token);expiresAt.push(Date.now()+Number(session.expires_in)*1000);
  }
  const auth = (i: number) => ({ Authorization: "Bearer " + tokens[i] });
  const sample = await fetch(
    "http://localhost:3010/api/encounter-worklist?limit=50&offset=0",
    { headers: auth(0) },
  );
  assert.equal(sample.status, 200);
  const first = await sample.json();
  assert.equal(first.total, 10006);
  assert.equal(first.items.length, 50);
  const baseline = await verifyAudit(c.db);
  console.log(
    `Restored audit verified; starting 25 authenticated sessions for ${durationSeconds} seconds.`,
  );
  const durations: number[] = [];
  const errors: Record<string, number> = {};
  let count = 0,
    peakRss = 0;
  const proc = async () => {
    const text = await readFile("/proc/" + child.pid + "/stat", "utf8");
    const parts = text.slice(text.lastIndexOf(")") + 2).split(" ");
    const rss = Number(parts[21]) * 4096;
    peakRss = Math.max(peakRss, rss);
    return { ticks: Number(parts[11]) + Number(parts[12]), rss };
  };
  const beforeCpu = await proc(),
    begin = performance.now(),
    end = begin + durationSeconds*1000;
  const timer = setInterval(() => {
    proc().then(async p=>{const sample={elapsedSeconds:(performance.now()-begin)/1000,responses:count,rssBytes:p.rss};samples.push(sample);if(hour)await writeFile(outputDirectory+"/hour-status.json",JSON.stringify({state:"running",...sample})+"\n");}).catch(() => {});
    console.log(
      "load progress",
      Math.round((performance.now() - begin) / 1000) + "s",
      count,
      "responses",
    );
  }, 15000);
  await Promise.all(
    tokens.map(async (_token, i) => {
      let n = 0;
      while (performance.now() < end) {
        if(child.exitCode!==null||child.signalCode!==null){result.interruption="Isolated API exited before the declared interval";break;}
        const t = performance.now();
        let status="unknown";
        try {
          if(Date.now()>=expiresAt[i]-30000){const session=await login("reviewer",demonstrationPassword());tokens[i]=session.access_token;expiresAt[i]=Date.now()+Number(session.expires_in)*1000;authenticationRenewals++;}
          const r = await fetch(
            `http://localhost:3010/api/encounter-worklist?limit=50&offset=${(i * 31 + n++ * 50) % 9950}`,
            { headers: auth(i), signal: AbortSignal.timeout(5000) },
          );
          await r.arrayBuffer();
          status=String(r.status);
          if (r.status !== 200)
            errors[String(r.status)] = (errors[String(r.status)] || 0) + 1;
        } catch (e) {
          const key = (e as Error).name;
          status=key;
          errors[key] = (errors[key] || 0) + 1;
        }
        const durationMs=performance.now()-t;
        if(extended){const measurement={elapsedMs:t-begin,session:i,status,durationMs};if(rawSink){if(!rawSink.write(JSON.stringify(measurement)+"\n"))await once(rawSink,"drain");}else raw.push(measurement);}
        durations.push(durationMs);
        count++;
      }
    }),
  );
  clearInterval(timer);
  const seconds = (performance.now() - begin) / 1000,
    afterCpu = await proc();
  durations.sort((a, b) => a - b);
  const percentile = (p: number) =>
    durations[Math.min(durations.length - 1, Math.floor(durations.length * p))];
  const failed = Object.values(errors).reduce((a, b) => a + b, 0);
  result.load = {
    requests: count,
    seconds,
    throughputPerSecond: count / seconds,
    p50Ms: percentile(0.5),
    p95Ms: percentile(0.95),
    p99Ms: percentile(0.99),
    maxMs: durations.at(-1),
    errors,
    failedRequests: failed,
    errorFraction: failed / count,
    peakApiRssBytes: peakRss,
    apiAverageCpuPercent:
      ((afterCpu.ticks - beforeCpu.ticks) / 100 / seconds) * 100,
    authenticationRenewals,
    tokenValuesRecorded:false,
    sameRoleDistinctAuthenticationSessions: true,
  };
  const recoveryStart = performance.now();
  await stopApi(child);
  child = await startApi(c.dsn, true);
  result.apiRestartSeconds = (performance.now() - recoveryStart) / 1000;
  assert.deepEqual(await verifyAudit(c.db), baseline);
  const after = await fetch(
    "http://localhost:3010/api/encounter-worklist?limit=50",
    { headers: auth(0) },
  );
  assert.equal((await after.json()).total, 10006);
  result.liveMvpUnchanged =
    JSON.stringify(liveBefore) ===
    JSON.stringify({
      cases: (await pool.query("SELECT count(*)::int AS n FROM cases")).rows[0]
        .n,
      audit: await verifyAudit(pool),
    });
  assert(result.liveMvpUnchanged);
  result.passed =
    result.load.seconds >= durationSeconds &&
    result.load.p95Ms < p95Target &&
    result.load.errorFraction < 0.01 &&
    result.load.throughputPerSecond >= 20 &&
    result.apiRestartSeconds <= 15 &&
    result.restore.seconds <= 120 && (!hour||result.load.peakApiRssBytes<=1073741824);
  assert(result.passed, "One or more predeclared benchmark gates failed");
} catch (e) {
  result.error = (e as Error).message;
  result.passed = false;
  process.exitCode = 1;
} finally {
  if (child) await stopApi(child);
  await c.db.end();
  await closeOriginal();
  await writeFile(
    outputDirectory+"/benchmark-results.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  if(rawSink){rawSink.end();await once(rawSink,"finish");}
  if(extended){if(!hour)await writeFile(outputDirectory+"/soak-requests.jsonl",raw.map(r=>JSON.stringify(r)).join("\n")+"\n");await writeFile(outputDirectory+"/soak-samples.json",JSON.stringify(samples,null,2)+"\n");}
  if(hour)await writeFile(outputDirectory+"/hour-status.json",JSON.stringify({state:result.passed?"passed":"failed",seconds:result.load?.seconds,requests:result.load?.requests})+"\n");
  console.log(JSON.stringify(result, null, 2));
}
