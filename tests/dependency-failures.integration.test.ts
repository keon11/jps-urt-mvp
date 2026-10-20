import {test,after} from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
import {login} from '../services/api/src/adapters.js';import {pool} from '../services/api/src/db.js';import {hash} from '../services/api/src/fixtures.js';
async function failedDependency(port:number,variable:string,url:string){
 const child=spawn(process.execPath,['--import','tsx','services/api/src/server.ts'],{env:{...process.env,PORT:String(port),[variable]:url},stdio:['ignore','pipe','pipe']});
 try{
  const base='http://localhost:'+port;let ready=false;
  for(let i=0;i<60;i++){try{const r=await fetch(base+'/health',{signal:AbortSignal.timeout(500)});if(r.ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,200));}
  assert.ok(ready,'Isolated API instance did not start');
  const token=(await login('reviewer','Synthetic-demo-only-2026!')).access_token;
  const before=(await pool.query("SELECT assessment FROM cases WHERE id='respiratory'")).rows[0];
  const beforeEvents=(await pool.query("SELECT count(*) FROM audit WHERE case_id='respiratory'")).rows[0].count;
  const r=await fetch(base+'/api/cases/respiratory/reviews',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({kind:'initial'})});
  assert.equal(r.status,502);assert.match((await r.json()).error,/No success is claimed/);
  const after=(await pool.query("SELECT assessment FROM cases WHERE id='respiratory'")).rows[0];assert.equal(hash(before.assessment),hash(after.assessment));assert.equal((await pool.query("SELECT count(*) FROM audit WHERE case_id='respiratory'")).rows[0].count,beforeEvents);
 }finally{child.kill('SIGTERM');await new Promise<void>(resolve=>{if(child.exitCode!==null||child.signalCode!==null)resolve();else child.once('exit',()=>resolve());});}
}
test('CQF outage returns an error and preserves previous assessment and audit',()=>failedDependency(3002,'CQF_URL','http://127.0.0.1:1/fhir'));
test('Medplum outage returns an error and preserves previous assessment and audit',()=>failedDependency(3003,'MEDPLUM_URL','http://127.0.0.1:1/'));
after(async()=>pool.end());
