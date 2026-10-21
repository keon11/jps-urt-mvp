import { z } from "zod";
import { pool } from "./db.js";
export const worklistQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
    q: z.string().max(80).default(""),
  })
  .strict();
export async function worklist(input: unknown) {
  const { limit, offset, q } = worklistQuery.parse(input);
  const search = "%" + q.replace(/[\\%_]/g, "\\$&") + "%";
  const { rows } = await pool.query(
    `WITH page AS MATERIALIZED (SELECT id,queue_priority,created_at FROM cases WHERE label ILIKE $1 OR id ILIKE $1 ORDER BY queue_priority DESC,created_at,id LIMIT $2 OFFSET $3) SELECT c.id,c.label,scenario,workflow->>'state' AS state,workflow->>'authorization' AS authorization,CASE WHEN assessment->>'triageStale'='true' THEN NULL ELSE (assessment->>'priority')::int END AS priority,assessment->>'recommendation' AS recommendation,
 jsonb_path_query_first(bundle,'$.entry[*].resource ? (@.resourceType == "Encounter")')->'class'->>'code' AS encounter_class,
 jsonb_path_query_first(bundle,'$.entry[*].resource ? (@.resourceType == "Coverage")')->'payor'->0->>'display' AS payer
 FROM page p JOIN cases c ON c.id=p.id ORDER BY p.queue_priority DESC,p.created_at,p.id`,
    [search, limit, offset],
  );
  const count = await pool.query(
    "SELECT count(*)::int AS total FROM cases WHERE label ILIKE $1 OR id ILIKE $1",
    [search],
  );
  return {
    items: rows,
    total: count.rows[0].total,
    limit,
    offset,
    nextOffset:
      offset + rows.length < count.rows[0].total ? offset + rows.length : null,
    syntheticOnly: true,
  };
}
