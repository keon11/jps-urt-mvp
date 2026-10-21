import { writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import pg from "pg";
import assert from "node:assert/strict";
import { config } from "../services/api/src/config.js";
import { pool } from "../services/api/src/db.js";
import { hash } from "../services/api/src/fixtures.js";
import {
  docker,
  verifyAudit,
  startApi,
  stopApi,
} from "./reliability-context.js";
import { login } from "../services/api/src/adapters.js";
import { demonstrationPassword } from "../tests/browser/local-account.js";
async function snapshot(db: pg.Pool) {
  const tables = (
    await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name",
    )
  ).rows;
  const result: Record<string, { rows: number; sha256: string }> = {};
  for (const r of tables) {
    const name = r.table_name as string;
    if (!/^[a-z_]+$/.test(name)) throw Error("Unexpected relation identifier");
    const rows = (
      await db.query(`SELECT row_to_json(t) AS r FROM "${name}" t`)
    ).rows
      .map((r) => JSON.stringify(r.r))
      .sort();
    result[name] = { rows: rows.length, sha256: hash(rows) };
  }
  return result;
}
const before = await snapshot(pool),
  audit = await verifyAudit(pool),
  dump = (process.argv.includes("--issue-3")||process.argv.includes("--issue-4"))?(process.argv.includes("--issue-4")?".runtime/issue4-final-checkpoint.dump":".runtime/issue3-final-checkpoint.dump"):".runtime/issue2-final-checkpoint.dump",
  target = "ur_issue2_final_" + Date.now();
const url = new URL(config.database);
let restored: pg.Pool | undefined, child: any;
const result: any = {
  createdAt: new Date().toISOString(),
  sourceDatabase: url.pathname.slice(1),
  restoreDatabase: target,
  dumpPath: dump,
  publiclyDistributed: false,
};
try {
  const start = performance.now();
  await docker(
    ["pg_dump", "-U", url.username, "-Fc", "-d", url.pathname.slice(1)],
    undefined,
    dump,
  );
  assert(/^ur_issue2_final_\d+$/.test(target));
  await pool.query(`CREATE DATABASE "${target}"`);
  await docker(
    ["pg_restore", "--no-owner", "--no-acl", "-U", url.username, "-d", target],
    dump,
  );
  url.pathname = "/" + target;
  restored = new pg.Pool({ connectionString: url.href });
  assert.deepEqual(await snapshot(restored), before);
  assert.deepEqual(await verifyAudit(restored), audit);
  child = await startApi(url.href, true);
  const token = (await login("reviewer", demonstrationPassword())).access_token;
  const r = await fetch("http://localhost:3010/api/encounter-worklist", {
    headers: { Authorization: "Bearer " + token },
  });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).total, 6);
  result.seconds = (performance.now() - start) / 1000;
  assert(result.seconds <= 120);
  result.tables = before;
  result.audit = audit;
  result.dumpSha256 = createHash("sha256")
    .update(await readFile(dump))
    .digest("hex");
  result.restoredApplicationReadVerified = true;
  result.passed = true;
} catch (e) {
  result.passed = false;
  result.error = (e as Error).message;
  process.exitCode = 1;
} finally {
  if (child) await stopApi(child);
  if (restored) await restored.end();
  await pool.end();
  await writeFile(
    (process.argv.includes("--issue-3")||process.argv.includes("--issue-4"))?`artifacts/${process.argv.includes("--issue-4")?"issue-4":"issue-3"}/final-restore-proof.json`:"artifacts/issue-2/final-restore-proof.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result, null, 2));
}
