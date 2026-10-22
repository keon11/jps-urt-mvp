import {readFile,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
import {isolatedContext,closeOriginal} from './reliability-context.js';
import {worklistStatements} from '../services/api/src/worklist.js';
const c=await isolatedContext();
const before=await readFile('.runtime/phase5-baseline/services/api/src/worklist.ts','utf8');
const original=before.match(/pool.query\(\s*`([\s\S]+?)`/)![1];const checks=[];
for(const q of ['', 'Benchmark 1', 'Fictional', 'respiratory', '%', '_', '\\', "' OR true --"]){
 for(const offset of [0,5000,10005,10006]){
  const search='%'+q.replace(/[\\%_]/g,'\\$&')+'%',sql=worklistStatements({q,offset,limit:50});
  const a=await c.db.query(original,[search,50,offset]),b=await c.db.query(sql.page,sql.pageValues);
  const ac=await c.db.query('SELECT count(*)::int AS total FROM cases WHERE label ILIKE $1 OR id ILIKE $1',[search]),bc=await c.db.query(sql.count,sql.countValues);
  assert.deepEqual(b.rows,a.rows);assert.deepEqual(bc.rows,ac.rows);checks.push({q,offset,items:b.rows.length,total:bc.rows[0].total,passed:true});
 }
}
await writeFile('artifacts/issue-5/queue-equivalence.json',JSON.stringify({passed:true,scope:'Actual original vs optimized SQL on identical synthetic DB; empty, filtered, escaped wildcard and injection-literal searches, deep/end pages',checks},null,2)+'\n');
console.log('PASS:',checks.length,'exact page/count SQL comparisons.');await c.db.end();await closeOriginal();
