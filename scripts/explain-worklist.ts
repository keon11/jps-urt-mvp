import { writeFile } from "node:fs/promises";
import { isolatedContext, closeOriginal } from "./reliability-context.js";
const c = await isolatedContext();
await c.db.query("SET statement_timeout='30s'");
const sql = `EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT id FROM cases WHERE label ILIKE '%%' OR id ILIKE '%%' ORDER BY CASE WHEN assessment->>'triageStale'='true' THEN 0 ELSE COALESCE((assessment->>'priority')::int,0) END DESC,created_at,id LIMIT 50 OFFSET 5000`;
const before = (await c.db.query(sql)).rows;
await c.db.query(
  `CREATE INDEX IF NOT EXISTS cases_worklist_order ON cases ((CASE WHEN assessment->>'triageStale'='true' THEN 0 ELSE COALESCE((assessment->>'priority')::int,0) END) DESC,created_at,id)`,
);
const after = (await c.db.query(sql)).rows;
await writeFile(
  "artifacts/issue-2/worklist-query-plans.json",
  JSON.stringify({ before, after }, null, 2) + "\n",
);
console.log(
  "Before execution ms:",
  before[0]["QUERY PLAN"][0]["Execution Time"],
  "After:",
  after[0]["QUERY PLAN"][0]["Execution Time"],
);
await c.db.end();
await closeOriginal();
