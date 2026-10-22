import {readFile,writeFile} from 'node:fs/promises';
import {performance,monitorEventLoopDelay} from 'node:perf_hooks';
import {cpus,totalmem} from 'node:os';
import {isolatedContext,closeOriginal} from './reliability-context.js';
import {login,verifyToken} from '../services/api/src/adapters.js';
import {demonstrationPassword} from '../tests/browser/local-account.js';
const c=await isolatedContext(), source=await readFile('services/api/src/worklist.ts','utf8');
const sql=source.match(/pool.query\(\s*`([\s\S]+?)`/)![1];
const plans=[];
for(const offset of [0,5000,9900]){
 const r=await c.db.query('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) '+sql,['%',50,offset]);
 plans.push({offset,plan:r.rows[0]['QUERY PLAN']});
}
const count=await c.db.query("EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT count(*)::int AS total FROM cases WHERE label ILIKE $1 OR id ILIKE $1",['%']);
const unfilteredCount=await c.db.query('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT count(*)::int AS total FROM cases');
const unfilteredPage=await c.db.query('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) '+sql.replace('WHERE label ILIKE $1 OR id ILIKE $1','WHERE $1::text IS NOT NULL'),['%',50,5000]);
const payload=await c.db.query(sql,['%',50,5000]);
const token=(await login('reviewer',demonstrationPassword())).access_token;await verifyToken(token);
const auth=[];const db=[];const loop=monitorEventLoopDelay({resolution:10});loop.enable();
for(let i=0;i<100;i++){let t=performance.now();await verifyToken(token);auth.push(performance.now()-t);t=performance.now();await c.db.query('SELECT 1');db.push(performance.now()-t);}
await new Promise(r=>setTimeout(r,30));loop.disable();
const stats=await c.db.query('SELECT blks_read,blks_hit FROM pg_stat_database WHERE datname=current_database()');
const indexes=await c.db.query("SELECT indexname,indexdef FROM pg_indexes WHERE tablename='cases'");
const percentile=(xs:number[],p:number)=>xs.sort((a,b)=>a-b)[Math.floor(xs.length*p)];
const result={at:new Date().toISOString(),scope:'Synthetic isolated queue, existing Postgres EXPLAIN ANALYZE/BUFFERS and Node perf_hooks; not clinical inference',host:{node:process.version,cpus:cpus().length,totalmem:totalmem()},plans,countPlan:count.rows[0],unfilteredCountPlan:unfilteredCount.rows[0],unfilteredPagePlan:unfilteredPage.rows[0],payloadBytes:Buffer.byteLength(JSON.stringify(payload.rows)),indexes:indexes.rows,cacheStats:stats.rows,authWarmP95Ms:percentile(auth,.95),databaseRoundtripP95Ms:percentile(db,.95),eventLoop:{p95Ms:loop.percentile(95)/1e6,maxMs:loop.max/1e6},tokensRecorded:false};
await writeFile('artifacts/issue-5/profile-before.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({payloadBytes:result.payloadBytes,authWarmP95Ms:result.authWarmP95Ms,databaseRoundtripP95Ms:result.databaseRoundtripP95Ms,countPlan:result.countPlan,unfilteredCountPlan:result.unfilteredCountPlan}));
await c.db.end();await closeOriginal();
