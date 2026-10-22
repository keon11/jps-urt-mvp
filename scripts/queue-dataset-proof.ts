import{createHash}from'node:crypto';import{writeFile,readFile}from'node:fs/promises';
import{isolatedContext,closeOriginal}from'./reliability-context.js';
const phase6=process.argv.includes('--phase-6'),base=phase6?'artifacts/phase-6/':'artifacts/issue-5/';const label=process.argv[2];if(!(phase6?['start','end']:['baseline','maintained','optimized','optimized-budgeted']).includes(label))throw Error('Invalid dataset proof label');
const c=await isolatedContext();
const {rows}=await c.db.query("SELECT id,encode(sha256(convert_to(row_to_json(c)::text,'UTF8')),'hex') AS sha256 FROM cases c ORDER BY id");
if(rows.length!==10006)throw Error('Comparable queue must contain exactly 10006 rows');
const sha256=createHash('sha256').update(JSON.stringify(rows)).digest('hex');
if(label!==(phase6?'start':'baseline')){const before=JSON.parse(await readFile(base+'dataset-'+(phase6?'start':'baseline')+'.json','utf8'));if(before.sha256!==sha256)throw Error('Synthetic queue case content changed between performance stages');}
await writeFile(base+'dataset-'+label+'.json',JSON.stringify({at:new Date().toISOString(),rows:rows.length,sha256,allCaseFieldsIncluded:true,scope:'SHA-256 of ordered id/per-row full case SHA-256; actual source data stays private; no workflow mutation',matchesBaseline:label===(phase6?'start':'baseline')?null:true},null,2)+'\n');console.log('PASS: complete synthetic queue content proof:',label,rows.length);await c.db.end();await closeOriginal();
