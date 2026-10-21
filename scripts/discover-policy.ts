import robotsParser from "robots-parser";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import {
  extractPolicy,
  compareSourceEvidence,
  initPolicyEvidence,
} from "../services/api/src/policy-intelligence.js";
import { initDb, pool } from "../services/api/src/db.js";
const run = promisify(execFile);
const url =
  "https://www.cms.gov/data-research/monitoring-programs/medicare-fee-service-compliance-programs/prior-authorization-pre-claim-review-initiatives/prior-authorization-certain-hospital-outpatient-department-opd-services";
await mkdir(".runtime/policies", { recursive: true });
await mkdir("artifacts/issue-2", { recursive: true });
await initDb();
await initPolicyEvidence();
let result: any = {
  url,
  checkedAt: new Date().toISOString(),
  officialRevisionVerified: false,
  executableOfficialRules: 0,
};
try {
  const robots = (
    await run(
      "curl",
      [
        "-fsS",
        "--proto",
        "=https",
        "--max-time",
        "20",
        "https://www.cms.gov/robots.txt",
      ],
      { maxBuffer: 256000 },
    )
  ).stdout;
  const access = robotsParser("https://www.cms.gov/robots.txt", robots);
  if (access.isAllowed(url, "HospitalURPolicyDemo") !== true)
    throw Error("robots.txt does not permit requested source");
  const path = ".runtime/policies/cms-opd-original.html";
  await run("curl", [
    "-fsS",
    "--user-agent",
    "HospitalURPolicyDemo/1.0",
    "--proto",
    "=https",
    "--max-time",
    "25",
    "--max-filesize",
    "1000000",
    "-o",
    path,
    url,
  ]);
  const html = await readFile(path, "utf8");
  const d = extractPolicy(html, url);
  if (!/prior authorization/i.test(d.title))
    throw Error("Unexpected official document title");
  const previous=(await pool.query("SELECT document FROM policy_documents WHERE document->>'sourceUrl'=$1 AND source_hash<>$2 ORDER BY document->>'retrievedAt' DESC LIMIT 1",[url,d.sourceHash])).rows[0]?.document;
  await pool.query(
    "INSERT INTO policy_documents VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",
    [d.id, d.sourceHash, d, html],
  );
  result = {
    ...result,
    status: "retrieved",
    title: d.title,
    sourceHash: d.sourceHash,
    publishedDate: d.publishedDate,
    effectiveDate: d.effectiveDate,
    provenance: d.provenance,
    originalPath: path,
    policyType:d.policyType,
    planApplicability:d.planApplicability,
    comparison:previous?compareSourceEvidence(previous,d):null,
    notes:
      "One current official page verified. No official historical revision established. Two owned synthetic revisions demonstrate comparison and governance, without attributing fictional criteria to CMS.",
  };
} catch (e) {
  result = {
    ...result,
    status: "blocked",
    reason: (e as Error).message,
    notes:
      "Use clearly labeled synthetic documents; no official rule activation.",
  };
}
result.storedEvidence = (
  await pool.query(
    "SELECT document->>'sourceUrl' AS url,source_hash,document->>'retrievedAt' AS retrieved_at FROM policy_documents WHERE document->>'synthetic'='false'",
  )
).rows;
await writeFile(
  process.env.POLICY_DISCOVERY_OUTPUT || "artifacts/issue-2/policy-discovery.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result, null, 2));
await pool.end();
