import {test,after} from 'node:test';import assert from 'node:assert/strict';
import {login} from '../services/api/src/adapters.js';import {pool} from '../services/api/src/db.js';import {demonstrationPassword} from './browser/local-account.js';
const base='http://localhost:3000/api';let reviewer:string,admin:string,advisor:string;let first:any,second:any;
async function call(path:string,token:string,body?:unknown,status=200){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data;}
const state=(token=admin)=>call('/policy-center',token);
async function move(c:any,action:string,token=admin,status=200,eventId=crypto.randomUUID()){return call('/policy-changes/'+c.id+'/actions',token,{action,eventId,expectedVersion:c.lock_version},status);}
async function approved(c:any){c=await move(c,'request-approval',reviewer);for(const action of ['verify-evidence','analyze-conflicts','run-tests','supervisor-approve'])c=await move(c,action);return move(c,'approve',advisor);}
test('governance roles, independent approvals and pending-rule isolation use real authenticated identities',async()=>{
 reviewer=(await login('reviewer',demonstrationPassword('reviewer'))).access_token;admin=(await login('admin',demonstrationPassword('admin'))).access_token;advisor=(await login('advisor',demonstrationPassword('advisor'))).access_token;
 const initial=await state();if(initial.registry.active_document!=='synthetic-1'){const existing=initial.changes.find((c:any)=>c.state==='monitoring'&&c.target_document===initial.registry.active_document);assert(existing,'Restorable publication required');await move(existing,'rollback');}
 const before=await call('/cases/respiratory/authorization-review',admin);
 const body={documentId:'synthetic-2',reason:'documentation-requirement-update',eventId:crypto.randomUUID()};first=await call('/policy-changes',reviewer,body);assert.equal(first.state,'draft');assert.equal((await call('/policy-changes',reviewer,body)).id,first.id);
 await call('/policy-changes',advisor,{...body,eventId:crypto.randomUUID()},403);await move(first,'approve',reviewer,403);await move(first,'publish',advisor,403);
 const after=await call('/cases/respiratory/authorization-review',admin);assert.equal(after.evaluation.documentId,before.evaluation.documentId);assert.equal(after.evaluation.policyRevision,before.evaluation.policyRevision);
 const self=await call('/policy-changes',admin,{...body,eventId:crypto.randomUUID()});const submitted=await move(self,'request-approval',admin);await move(submitted,'verify-evidence',admin,403);await move(submitted,'reject');
 first=await approved(first);assert.equal(first.state,'approved');assert.equal(first.test_report.passed,true);assert.notEqual(first.supervisor.id,first.clinical.id);
 second=await approved(await call('/policy-changes',reviewer,{...body,eventId:crypto.randomUUID()}));
});
test('publication detects stale competing changes, enforces effective version, and supports suspension and immutable rollback',async()=>{
 const stale={...first,lock_version:first.lock_version-1};await move(stale,'publish',admin,409);
 const eventId=crypto.randomUUID();const published=await move(first,'publish',admin,200,eventId);assert.equal((await move(first,'publish',admin,200,eventId)).id,published.id);first=published;
 assert.equal((await state()).registry.active_document,'synthetic-2');await move(second,'publish',admin,409);
 const context=await call('/cases/respiratory/authorization-review',reviewer);assert(context.evaluation.missing.includes('authorization-receipt'));
 await call('/cases/respiratory/authorization-review',reviewer,{action:'approve-internal-next-step',eventId:crypto.randomUUID(),expectedPolicyRevision:context.evaluation.policyRevision,assessmentSourceHash:context.evaluation.assessmentSourceHash},409);
 const s=await state();await call('/policy-suspension',reviewer,{eventId:crypto.randomUUID(),expectedRevision:s.registry.revision},403);await call('/policy-suspension',advisor,{eventId:crypto.randomUUID(),expectedRevision:s.registry.revision});assert.equal((await call('/cases/respiratory/authorization-review',reviewer)).evaluation.outcome,'suspended');
 first=await move(first,'rollback');assert.equal(first.state,'rolled-back');assert.equal((await state()).registry.active_document,'synthetic-1');assert.equal((await state()).registry.suspended,false);
 await assert.rejects(()=>pool.query("UPDATE policy_publications SET action='changed'"),/append-only/);await move(second,'reject');
});
test('internal authorization review is idempotent, evidence-linked, role restricted and never an insurer determination',async()=>{
 const context=await call('/cases/respiratory/authorization-review',reviewer);const before=await call('/cases/respiratory',reviewer);
 const body={action:'approve-internal-next-step',eventId:crypto.randomUUID(),expectedPolicyRevision:context.evaluation.policyRevision,assessmentSourceHash:context.evaluation.assessmentSourceHash};
 await call('/cases/respiratory/authorization-review',advisor,body,403);await call('/cases/respiratory/authorization-review',reviewer,{...body,eventId:crypto.randomUUID(),assessmentSourceHash:'stale-source'},409);
 const r=await call('/cases/respiratory/authorization-review',reviewer,body);assert.equal(r.internalOnly,true);assert.equal(r.coverageDetermination,false);assert.equal((await call('/cases/respiratory/authorization-review',reviewer,body)).eventId,r.eventId);
 await call('/cases/respiratory/authorization-review',reviewer,{...body,action:'request-information'},409);
 const n=await pool.query('SELECT count(*) FROM internal_authorization_reviews WHERE id=$1',[body.eventId]);assert.equal(n.rows[0].count,'1');const after=await call('/cases/respiratory',reviewer);assert.equal(after.workflow.authorization,before.workflow.authorization);assert.deepEqual(after.bundle,before.bundle);
 const missing=await call('/cases/documentation/authorization-review',reviewer);await call('/cases/documentation/authorization-review',reviewer,{action:'request-information',eventId:crypto.randomUUID(),expectedPolicyRevision:missing.evaluation.policyRevision,assessmentSourceHash:missing.evaluation.assessmentSourceHash});assert.equal((await call('/cases/documentation',reviewer)).workflow.state,'awaiting-information');
});
after(()=>pool.end());
test('missing assessment permits an information request and unchanged-source reassessment preserves that pending request',async()=>{
 await call('/cases/continued-stay/synthetic-vitals',reviewer,{spo2:95,systolic:114,expectedNights:1});
 const context=await call('/cases/continued-stay/authorization-review',reviewer);assert.equal(context.evaluation.assessmentCurrent,false);
 await call('/cases/continued-stay/authorization-review',reviewer,{action:'request-information',eventId:crypto.randomUUID(),expectedPolicyRevision:context.evaluation.policyRevision,assessmentSourceHash:context.evaluation.assessmentSourceHash});
 await call('/cases/continued-stay/reviews',reviewer,{kind:'initial'});assert.equal((await call('/cases/continued-stay',reviewer)).workflow.state,'awaiting-information');
});
