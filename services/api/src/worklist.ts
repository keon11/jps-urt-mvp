import { z } from "zod";
import { pool } from "./db.js";
export const worklistQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
    q: z.string().max(80).default(""),
  })
  .strict();
export function worklistStatements(input: {limit:number;offset:number;q:string}) {
  const {limit,offset,q}=input;
  const filtered=q.length>0;
  const search="%"+q.replace(/[\\%_]/g,"\\$&")+"%";
  // Empty search needs no text predicate. Preserve the existing covering queue
  // index and exact current counts instead of adding a stale application cache.
  const where=filtered?"WHERE label ILIKE $1 OR id ILIKE $1":"";
  const page=`WITH page AS MATERIALIZED (SELECT id,queue_priority,created_at FROM cases ${where} ORDER BY queue_priority DESC,created_at,id LIMIT ${filtered?'$2':'$1'} OFFSET ${filtered?'$3':'$2'}) SELECT c.id,c.label,scenario,workflow->>'state' AS state,workflow->>'authorization' AS authorization,CASE WHEN assessment->>'triageStale'='true' THEN NULL ELSE (assessment->>'priority')::int END AS priority,assessment->>'recommendation' AS recommendation,
 jsonb_path_query_first(bundle,'$.entry[*].resource ? (@.resourceType == "Encounter")')->'class'->>'code' AS encounter_class,
 jsonb_path_query_first(bundle,'$.entry[*].resource ? (@.resourceType == "Coverage")')->'payor'->0->>'display' AS payer
 FROM page p JOIN cases c ON c.id=p.id ORDER BY p.queue_priority DESC,p.created_at,p.id`;
  return {page,pageValues:filtered?[search,limit,offset]:[limit,offset],count:`SELECT count(*)::int AS total FROM cases ${where}`,countValues:filtered?[search]:[]};
}
export async function worklist(input: unknown) {
  const parsed=worklistQuery.parse(input);
  const {limit,offset}=parsed;
  const sql=worklistStatements(parsed);
  const {rows}=await pool.query(sql.page,sql.pageValues);
  const count=await pool.query(sql.count,sql.countValues);
  return {items:rows,total:count.rows[0].total,limit,offset,nextOffset:offset+rows.length<count.rows[0].total?offset+rows.length:null,syntheticOnly:true};
}
