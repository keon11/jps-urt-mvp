import {test} from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {login,fhirClient} from '../services/api/src/adapters.js';
let reviewer:string,advisor:string;
const base='http://localhost:3000';
async function call(id:string,path:string,body:unknown,token=reviewer,status=200){const r=await fetch(base+'/api/cases/'+id+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
async function get(id:string){return(await fetch(base+'/api/cases/'+id,{headers:{Authorization:'Bearer '+reviewer}})).json();}
test('live authorization simulator tracks lifecycle, duplicate events, notifications and FHIR receipts',async()=>{
 reviewer=(await login('reviewer','Synthetic-demo-only-2026!')).access_token;advisor=(await login('advisor','Synthetic-demo-only-2026!')).access_token;
 await call('authorization','/reviews',{kind:'initial'});
 const current=await get('authorization');
 // A repeated run resumes from the stored terminal state by testing a fresh permitted cycle.
 if(['approved','partial-approved'].includes(current.workflow.authorization))await call('authorization','/authorization',{action:'simulate-expiry',eventId:randomUUID()});
 const submission={action:'submit',eventId:randomUUID()};
 const submitted=await call('authorization','/authorization',submission);assert.equal(submitted.workflow.authorization,'submitted');
 const duplicate=await call('authorization','/authorization',submission);assert.equal(duplicate.duplicate,true);
 await call('authorization','/authorization',{...submission,action:'notify'},reviewer,409);
 await call('authorization','/authorization',{action:'payer-response',outcome:'denied',eventId:randomUUID()});
 await call('authorization','/authorization',{action:'submit',eventId:randomUUID()});
 await call('authorization','/authorization',{action:'payer-response',outcome:'pending-information',eventId:randomUUID()});
 await call('authorization','/authorization',{action:'submit',eventId:randomUUID()});
 await call('authorization','/authorization',{action:'payer-response',outcome:'partial-approved',eventId:randomUUID()});
 await call('authorization','/authorization',{action:'simulate-expiry',eventId:randomUUID()});
 await call('authorization','/authorization',{action:'submit',eventId:randomUUID()});
 const approved=await call('authorization','/authorization',{action:'payer-response',outcome:'approved',eventId:randomUUID()});assert.equal(approved.workflow.authorization,'approved');assert.equal(approved.assessment.triageStale,true);
 const notified=await call('authorization','/authorization',{action:'notify',eventId:randomUUID()});assert.ok(notified.workflow.notifications.length>0);
 assert.equal((await get('authorization')).operational.notificationOverdue,false);
 const client=await fhirClient(),refs=approved.workflow.events.filter((e:any)=>e.fhirReference).map((e:any)=>e.fhirReference);
 for(const ref of refs){const [type,id]=ref.split('/');assert.ok((await client.readResource(type,id)).id);}
 await call('authorization','/authorization',{action:'notify',eventId:randomUUID()},advisor,403);
});
test('physician escalation enforces roles, override reasons, and source status preservation',async()=>{
 await call('advisor','/reviews',{kind:'initial'});
 await call('advisor','/escalations',{reason:'status-mismatch'});
 await call('advisor','/decisions',{disposition:'Observation',reason:'clinical-judgment-override'},reviewer,403);
 await call('advisor','/decisions',{disposition:'Observation',reason:'evidence-supports-recommendation'},advisor,422);
 const result=await call('advisor','/decisions',{disposition:'Observation',reason:'clinical-judgment-override'},advisor);assert.equal(result.workflow.state,'reviewed');assert.equal(result.workflow.humanDecision.by,'advisor');assert.equal(result.workflow.humanDecision.assessmentSourceHash,result.assessment.sourceHash);
 const client=await fhirClient(),enc=await client.readResource('Encounter',result.encounter_id);assert.equal(enc.class.code,'OBSENC');
 const audit=await(await fetch(base+'/api/cases/advisor/audit',{headers:{Authorization:'Bearer '+advisor}})).json();assert.ok(audit.some((e:any)=>e.action==='human-review-decision'));
});
