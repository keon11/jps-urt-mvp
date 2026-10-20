import {test,after} from 'node:test';import assert from 'node:assert/strict';
import {login,fhirClient} from '../services/api/src/adapters.js';
import {pool} from '../services/api/src/db.js';
const base='http://localhost:3000';let token:string;
async function request(id:string,action:string,body:unknown){
 const r=await fetch(base+'/api/cases/'+id+'/'+action,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data;
}
test('real CQF and local inference produce traceable initial recommendations',async()=>{
 token=(await login('reviewer','Synthetic-demo-only-2026!')).access_token;
 const row=await request('respiratory','reviews',{kind:'initial'}),a=row.assessment;
 assert.equal(a.engine,'HAPI/CQF CQL');assert.equal(a.recommendation,'Inpatient review suggested');assert.ok(a.priority>=70);
 assert.equal(a.ai.mode,'local-model',JSON.stringify(a.ai));assert.ok(a.ai.output.evidence.every((e:string)=>a.sources.some((s:any)=>s.reference===e)));assert.ok(a.sources.every((s:any)=>s.version));
 const client=await fhirClient();assert.equal((await client.readResource('Provenance',a.provenance.split('/')[1])).resourceType,'Provenance');
});
test('continued-stay review responds to new clinical versions and invalidates old assessment',async()=>{
 const initial=await request('continued-stay','reviews',{kind:'initial'});
 assert.equal(initial.assessment.continuedStay,'Reassess continued-stay need');
 await request('continued-stay','synthetic-vitals',{spo2:85,systolic:88,expectedNights:3});
 const cleared=(await pool.query("SELECT assessment FROM cases WHERE id='continued-stay'")).rows[0];assert.equal(cleared.assessment,null);
 const current=await request('continued-stay','reviews',{kind:'continued-stay'});
 assert.equal(current.assessment.continuedStay,'Continued-stay review suggested');assert.notEqual(current.assessment.sourceHash,initial.assessment.sourceHash);
 const events=(await pool.query("SELECT action FROM audit WHERE case_id='continued-stay'")).rows;assert.ok(events.some(x=>x.action==='continued-stay-review'));
 // Restore fixture observations and verify the stable result for future demo walkthroughs.
 await request('continued-stay','synthetic-vitals',{spo2:95,systolic:114,expectedNights:1});
 const restored=await request('continued-stay','reviews',{kind:'continued-stay'});assert.equal(restored.assessment.continuedStay,'Reassess continued-stay need');
});
test('stable initial review suggests observation; missing documentation raises risk',async()=>{
 const stable=await request('observation','reviews',{kind:'initial'});assert.equal(stable.assessment.recommendation,'Observation review suggested');
 const gap=await request('documentation','reviews',{kind:'initial'});assert.equal(gap.assessment.denialRisk.label,'Elevated illustrative risk');
});
after(async()=>pool.end());
