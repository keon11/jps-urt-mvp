import { z } from "zod";
import pg from "pg";
import {Histogram,Gauge} from "prom-client";
import {registry} from "./reporting.js";
import {config} from "./config.js";
// Isolate queue reads from the existing clinical/write pool. This host's
// measured CPU quota is four cores; two readers leave execution headroom.
export const worklistPool=new pg.Pool({connectionString:config.database,
 max:z.coerce.number().int().min(1).max(8).parse(process.env.WORKLIST_POOL_MAX??2),
 connectionTimeoutMillis:5000});
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
const stageDuration=new Histogram({name:'ur_worklist_stage_seconds',help:'Worklist acquire/query duration; no SQL, identity or clinical labels',labelNames:['stage','outcome'],buckets:[.001,.005,.01,.025,.05,.1,.25,.5,1,2,5,30],registers:[registry]});
new Gauge({name:'ur_worklist_pool_waiting',help:'Waiting worklist connection requests',registers:[registry],collect(){this.set(worklistPool.waitingCount);}});
async function timed<T>(stage:string,operation:()=>Promise<T>):Promise<T>{
 const start=performance.now();let outcome='success';
 try{return await operation();}catch(error){outcome='error';throw error;}
 finally{stageDuration.observe({stage,outcome},(performance.now()-start)/1000);}
}
export async function worklist(input: unknown,db:{connect:()=>Promise<pg.PoolClient>}=worklistPool) {
  const parsed=worklistQuery.parse(input);
  const {limit,offset}=parsed;
  const sql=worklistStatements(parsed);
  // One checkout for both unchanged statements avoids a second pool queue.
  // Still fresh exact counts; no cached/approximate count or widened deadline.
  const client=await timed('acquire',()=>db.connect());
  try{
    const {rows}=await timed('page',()=>client.query(sql.page,sql.pageValues));
    const count=await timed('count',()=>client.query(sql.count,sql.countValues));
    return {items:rows,total:count.rows[0].total,limit,offset,nextOffset:offset+rows.length<count.rows[0].total?offset+rows.length:null,syntheticOnly:true};
  }finally{client.release();}
}
