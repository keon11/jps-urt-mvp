import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {PoolClient} from 'pg';
import {pool} from './db.js';
import {audit,transaction,HttpError,type Actor} from './store.js';
import {hash,fixtureIds} from './fixtures.js';
import {freshBundle} from './store.js';
import {demoNow} from './review.js';
import {policyEvidence,type PolicyDocument} from './policy-intelligence.js';
const policyId='synthetic-authorization-docs';
const has=(a:Actor,...roles:string[])=>a.roles.some(r=>roles.includes(r));
function requireRole(a:Actor,...roles:string[]){if(!has(a,...roles))throw new HttpError(403,'This role cannot perform that policy action');}
const eventSchema=z.string().uuid();
export const changeInput=z.object({documentId:z.enum(['synthetic-1','synthetic-2']),reason:z.enum(['documentation-requirement-update','suspected-policy-error']),eventId:eventSchema}).strict();
export const transitionInput=z.object({action:z.enum(['request-approval','verify-evidence','analyze-conflicts','run-tests','supervisor-approve','approve','reject','request-evidence','publish','rollback']),eventId:eventSchema,expectedVersion:z.number().int().min(0)}).strict();
export const internalInput=z.object({action:z.enum(['request-information','escalate','approve-internal-next-step']),eventId:eventSchema,expectedPolicyRevision:z.number().int().min(0),assessmentSourceHash:z.string().min(1).max(128)}).strict();
async function document(tx:PoolClient,id:string):Promise<PolicyDocument>{const r=await tx.query('SELECT document FROM policy_documents WHERE id=$1',[id]);if(!r.rows[0])throw new HttpError(404,'Policy evidence not found');return r.rows[0].document;}
async function command<T>(tx:PoolClient,key:string,actor:Actor,input:unknown,fn:()=>Promise<T>):Promise<T>{
 await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))',['governance:'+key]);
 const digest=hash(input);const old=(await tx.query('SELECT * FROM governance_commands WHERE id=$1',[key])).rows[0];
 if(old){if(old.actor!==actor.id||old.payload_hash!==digest)throw new HttpError(409,'Event identifier already used with different actor or payload');return old.result;}
 const result=await fn();await tx.query('INSERT INTO governance_commands VALUES($1,$2,$3,$4)',[key,actor.id,digest,result]);return result;
}
export function evaluateDocumentation(d:PolicyDocument,row:any){
 const requirements=d.rules.map(r=>{
  const records=row.bundle.entry.map((e:any)=>e.resource);
  const note=records.find((r:any)=>r.resourceType==='DocumentReference'&&r.status==='current');
  const receipt=row.workflow.events?.findLast((e:any)=>e.fhirReference?.startsWith('ClaimResponse/'));
  const evidence=r.code==='physician-note'?(note?[{reference:'DocumentReference/'+note.id,version:note.meta?.versionId}]:[]):receipt?[{reference:receipt.fhirReference,eventId:receipt.eventId}]:[];
  return {...r,status:evidence.length?'satisfied':'missing',evidence};
 });
 return {policyId:d.policyId,documentId:d.id,sourceHash:d.sourceHash,effectiveDate:d.effectiveDate,requirements,missing:requirements.filter(r=>r.status==='missing').map(r=>r.code),outcome:requirements.every(r=>r.status==='satisfied')?'documentation-complete':'needs-information',illustrative:true,coverageDetermination:false,disclaimer:'Internal synthetic documentation review only. Missing evidence is not a confirmed policy violation or insurer decision.'};
}
export function candidateTests(d:PolicyDocument){
 const row=(note:boolean,receipt:boolean)=>({bundle:{entry:note?[{resource:{resourceType:'DocumentReference',id:'test-note',status:'current',meta:{versionId:'1'}}}]:[]},workflow:{events:receipt?[{fhirReference:'ClaimResponse/test-receipt',eventId:'test'}]:[]}});
 const samples=[{name:'all required documents',row:row(true,true),expected:'documentation-complete'},{name:'missing physician evidence',row:row(false,true),expected:'needs-information'},{name:'missing receipt',row:row(true,false),expected:d.id==='synthetic-2'?'needs-information':'documentation-complete'}];
 const results=samples.map(s=>({...s,row:undefined,actual:evaluateDocumentation(d,s.row).outcome}));
 return {passed:results.every(s=>s.actual===s.expected),results,clinicalValidation:false,sourceHash:d.sourceHash};
}
export async function initGovernance(){
 await pool.query(`CREATE TABLE IF NOT EXISTS policy_registry(id text PRIMARY KEY,active_document text NOT NULL REFERENCES policy_documents(id),revision integer NOT NULL DEFAULT 0,suspended boolean NOT NULL DEFAULT false);
 CREATE TABLE IF NOT EXISTS policy_changes(id uuid PRIMARY KEY,policy_id text NOT NULL REFERENCES policy_registry(id),target_document text NOT NULL REFERENCES policy_documents(id),base_document text NOT NULL REFERENCES policy_documents(id),state text NOT NULL,proposer text NOT NULL,proposer_name text NOT NULL,reason text NOT NULL,supervisor jsonb,clinical jsonb,test_report jsonb,lock_version integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS governance_commands(id uuid PRIMARY KEY,actor text NOT NULL,payload_hash text NOT NULL,result jsonb NOT NULL);
 CREATE TABLE IF NOT EXISTS policy_publications(sequence bigserial PRIMARY KEY,policy_id text NOT NULL,from_document text,to_document text NOT NULL,action text NOT NULL,actor text NOT NULL,at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS internal_authorization_reviews(id uuid PRIMARY KEY,case_id text NOT NULL REFERENCES cases(id),review jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
 DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='publication_immutable') THEN CREATE TRIGGER publication_immutable BEFORE UPDATE OR DELETE ON policy_publications FOR EACH ROW EXECUTE FUNCTION immutable_audit();END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='internal_review_immutable') THEN CREATE TRIGGER internal_review_immutable BEFORE UPDATE OR DELETE ON internal_authorization_reviews FOR EACH ROW EXECUTE FUNCTION immutable_audit();END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='governance_command_immutable') THEN CREATE TRIGGER governance_command_immutable BEFORE UPDATE OR DELETE ON governance_commands FOR EACH ROW EXECUTE FUNCTION immutable_audit();END IF;END $$;`);
 await transaction(async tx=>{const r=await tx.query('INSERT INTO policy_registry(id,active_document) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING id',[policyId,'synthetic-1']);if(r.rowCount)await audit(tx,'policy:'+policyId,'synthetic-seed','synthetic-policy-baseline',{document:'synthetic-1',note:'Illustrative demonstration baseline; not clinically approved or issued by a payer.'});});
}
export async function center(actor:Actor){
 const evidence=await policyEvidence();const registry=(await pool.query('SELECT * FROM policy_registry WHERE id=$1',[policyId])).rows[0];
 const changes=(await pool.query('SELECT * FROM policy_changes WHERE $1 OR proposer=$2 ORDER BY created_at DESC LIMIT 100',[has(actor,'admin','advisor'),actor.id])).rows;
 const publications=(await pool.query('SELECT * FROM policy_publications ORDER BY sequence DESC LIMIT 30')).rows;
 return {...evidence,registry,changes,publications,roles:{clerk:has(actor,'reviewer','admin'),supervisor:has(actor,'admin'),clinicalAuthority:has(actor,'advisor'),publisher:has(actor,'admin')},authorityNote:'Existing local reviewer → clerk; admin → supervisor/publisher; advisor → clinical authority. Demo identities are not independent clinical validation.'};
}
export async function propose(input:unknown,actor:Actor){
 requireRole(actor,'reviewer','admin');const data=changeInput.parse(input);
 return transaction(tx=>command(tx,data.eventId,actor,{operation:'propose',...data},async()=>{
  const registry=(await tx.query('SELECT * FROM policy_registry WHERE id=$1 FOR UPDATE',[policyId])).rows[0];
  if(data.documentId===registry.active_document)throw new HttpError(409,'This document is already active');
  const target=await document(tx,data.documentId);if(!target.synthetic||!target.rules.length)throw new HttpError(409,'Only explicit synthetic candidates can enter this demonstration lifecycle');
  const id=randomUUID();const row=(await tx.query("INSERT INTO policy_changes(id,policy_id,target_document,base_document,state,proposer,proposer_name,reason) VALUES($1,$2,$3,$4,'draft',$5,$6,$7) RETURNING *",[id,policyId,data.documentId,registry.active_document,actor.id,actor.name,data.reason])).rows[0];
  await audit(tx,'policy:'+policyId,actor.name,'policy-change-proposed',{changeId:id,sourceHash:target.sourceHash,reason:data.reason});return row;
 }));
}
export async function transition(id:string,input:unknown,actor:Actor){
 z.string().uuid().parse(id);
 const data=transitionInput.parse(input);
 if(data.action==='request-approval')requireRole(actor,'reviewer','admin');else if(data.action==='approve')requireRole(actor,'advisor');else if(['reject','request-evidence'].includes(data.action))requireRole(actor,'admin','advisor');else requireRole(actor,'admin');
 return transaction(tx=>command(tx,data.eventId,actor,{operation:'transition',id,...data},async()=>{
  const c=(await tx.query('SELECT * FROM policy_changes WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!c)throw new HttpError(404,'Change request not found');
  if(c.lock_version!==data.expectedVersion)throw new HttpError(409,'Change request is stale; reload before acting');
  const registry=(await tx.query('SELECT * FROM policy_registry WHERE id=$1 FOR UPDATE',[policyId])).rows[0];const d=await document(tx,c.target_document);
  const state=(...allowed:string[])=>{if(!allowed.includes(c.state))throw new HttpError(409,'This lifecycle transition is not allowed');};
  switch(data.action){
   case 'request-approval':requireRole(actor,'reviewer','admin');if(c.proposer!==actor.id)throw new HttpError(403,'Only the proposer can request approval');state('draft');c.state='evidence-verification';break;
   case 'verify-evidence':requireRole(actor,'admin');state('evidence-verification');if(c.proposer===actor.id)throw new HttpError(403,'Independent supervisor review is required');if(!d.effectiveDate||d.uncertainties.length||d.rules.some(r=>r.citation.sourceHash!==d.sourceHash||!d.text.includes(r.citation.quote)))throw new HttpError(409,'Unverified policy evidence');c.state='conflict-analysis';break;
   case 'analyze-conflicts':requireRole(actor,'admin');state('conflict-analysis');if(registry.active_document!==c.base_document)throw new HttpError(409,'Active policy changed: rebase and reverify this request');c.state='testing';break;
   case 'run-tests':requireRole(actor,'admin');state('testing');c.test_report=candidateTests(d);if(!c.test_report.passed)throw new HttpError(409,'Candidate conformance tests failed');c.state='authorized-approval';break;
   case 'supervisor-approve':requireRole(actor,'admin');state('authorized-approval');if(c.proposer===actor.id)throw new HttpError(403,'Self-approval is not permitted');c.supervisor={id:actor.id,name:actor.name,at:new Date().toISOString()};break;
   case 'approve':requireRole(actor,'advisor');state('authorized-approval');if(!c.supervisor||actor.id===c.proposer||actor.id===c.supervisor.id)throw new HttpError(403,'Distinct clinical authority and supervisor approvals are required');c.clinical={id:actor.id,name:actor.name,at:new Date().toISOString()};c.state='approved';break;
   case 'reject':requireRole(actor,'admin','advisor');state('draft','evidence-verification','conflict-analysis','testing','authorized-approval','approved');c.state='rejected';c.supervisor=null;c.clinical=null;break;
   case 'request-evidence':requireRole(actor,'admin','advisor');state('evidence-verification','conflict-analysis','testing','authorized-approval','approved');c.state='draft';c.supervisor=null;c.clinical=null;c.test_report=null;break;
   case 'publish':requireRole(actor,'admin');state('approved');if(!c.supervisor||!c.clinical||!c.test_report?.passed||c.test_report.sourceHash!==d.sourceHash)throw new HttpError(409,'Current evidence, tests and both approvals required');if(registry.active_document!==c.base_document)throw new HttpError(409,'Publication conflict: active policy changed');if(d.effectiveDate!>demoNow().toISOString().slice(0,10))throw new HttpError(409,'Future-effective document cannot be active in this demonstration clock');
    await tx.query('UPDATE policy_registry SET active_document=$2,revision=revision+1,suspended=false WHERE id=$1',[policyId,c.target_document]);await tx.query("INSERT INTO policy_publications(policy_id,from_document,to_document,action,actor) VALUES($1,$2,$3,'publish',$4)",[policyId,registry.active_document,c.target_document,actor.name]);c.state='monitoring';break;
   case 'rollback':requireRole(actor,'admin');state('monitoring');if(registry.active_document!==c.target_document)throw new HttpError(409,'Rollback conflict: another publication is active');await tx.query('UPDATE policy_registry SET active_document=$2,revision=revision+1,suspended=false WHERE id=$1',[policyId,c.base_document]);await tx.query("INSERT INTO policy_publications(policy_id,from_document,to_document,action,actor) VALUES($1,$2,$3,'rollback',$4)",[policyId,c.target_document,c.base_document,actor.name]);c.state='rolled-back';break;
  }
  const result=(await tx.query('UPDATE policy_changes SET state=$2,supervisor=$3,clinical=$4,test_report=$5,lock_version=lock_version+1 WHERE id=$1 RETURNING *',[id,c.state,c.supervisor,c.clinical,c.test_report])).rows[0];await audit(tx,'policy:'+policyId,actor.name,'policy-'+data.action,{changeId:id,fromVersion:c.lock_version,toVersion:result.lock_version,state:result.state,sourceHash:d.sourceHash});return result;
 }));
}
export async function suspendPolicy(input:unknown,actor:Actor){
 requireRole(actor,'admin','advisor');const data=z.object({eventId:eventSchema,expectedRevision:z.number().int().min(0)}).strict().parse(input);
 return transaction(tx=>command(tx,data.eventId,actor,{operation:'suspend',...data},async()=>{const r=(await tx.query('SELECT * FROM policy_registry WHERE id=$1 FOR UPDATE',[policyId])).rows[0];if(r.revision!==data.expectedRevision||r.suspended)throw new HttpError(409,'Policy changed or is already suspended');const result=(await tx.query('UPDATE policy_registry SET suspended=true,revision=revision+1 WHERE id=$1 RETURNING *',[policyId])).rows[0];await audit(tx,'policy:'+policyId,actor.name,'policy-suspended',{revision:result.revision,reason:'Potentially unsafe rule flagged for authorized review'});return result;}));
}
async function reviewContext(tx:PoolClient,id:string){
 const row=(await tx.query('SELECT * FROM cases WHERE id=$1',[id])).rows[0];if(!row)throw new HttpError(404,'Encounter not found');const registry=(await tx.query('SELECT * FROM policy_registry WHERE id=$1',[policyId])).rows[0];const d=await document(tx,registry.active_document);
 const evaluation=evaluateDocumentation(d,row);return {row,registry,evaluation:{...evaluation,policyRevision:registry.revision,suspended:registry.suspended,...(registry.suspended?{outcome:'suspended',missing:['Active rule suspended; authorized review required']}:{}),assessmentSourceHash:row.assessment?.sourceHash||hash(row.bundle),assessmentCurrent:!!row.assessment&&!row.assessment.triageStale}};
}
export async function internalReviewContext(id:string){return transaction(async tx=>{const c=await reviewContext(tx,id);const history=(await tx.query('SELECT review FROM internal_authorization_reviews WHERE case_id=$1 ORDER BY created_at DESC LIMIT 30',[id])).rows.map(r=>r.review);return {evaluation:c.evaluation,history:history.map(h=>({...h,stale:h.evaluation.policyRevision!==c.registry.revision||h.assessmentSourceHash!==c.evaluation.assessmentSourceHash}))};});}
export async function internalReview(id:string,input:unknown,actor:Actor){
 requireRole(actor,'reviewer','admin');const data=internalInput.parse(input);
 if(!fixtureIds.includes(id))throw new HttpError(422,'Only allowlisted fictional encounters can receive internal decisions');
 const cached=(await pool.query('SELECT * FROM governance_commands WHERE id=$1',[data.eventId])).rows[0];if(cached){if(cached.actor!==actor.id||cached.payload_hash!==hash({operation:'internal-review',id,...data}))throw new HttpError(409,'Event identifier already used with different actor or payload');return cached.result;}
 // Read current FHIR versions before locking; source/workflow are rechecked inside the transaction.
 const source=(await pool.query('SELECT * FROM cases WHERE id=$1',[id])).rows[0];if(!source)throw new HttpError(404,'Encounter not found');const fresh=await freshBundle(source);
 return transaction(tx=>command(tx,data.eventId,actor,{operation:'internal-review',id,...data},async()=>{
  await tx.query('SELECT id FROM cases WHERE id=$1 FOR UPDATE',[id]);await tx.query('SELECT id FROM policy_registry WHERE id=$1 FOR UPDATE',[policyId]);const c=await reviewContext(tx,id);
  if(c.registry.revision!==data.expectedPolicyRevision)throw new HttpError(409,'Policy changed; reload requirements');
  if((c.row.assessment?.sourceHash||hash(c.row.bundle))!==data.assessmentSourceHash||hash(fresh)!==data.assessmentSourceHash)throw new HttpError(409,'Source clinical evidence changed; rerun review');
  if(data.action!=='request-information'&&(!c.row.assessment||c.row.assessment.triageStale))throw new HttpError(409,'Current assessment required');
  if(data.action==='approve-internal-next-step'&&(c.registry.suspended||c.evaluation.missing.length))throw new HttpError(409,'Missing or suspended requirements: request information or escalate');
  const review={...data,actor:actor.name,actorId:actor.id,at:new Date().toISOString(),evaluation:c.evaluation,internalOnly:true,coverageDetermination:false};
  const workflow={...c.row.workflow,internalReview:review,...(data.action==='request-information'?{state:'awaiting-information'}:data.action==='escalate'?{state:'escalated',humanDecision:null,escalation:{reason:'authorization-risk',by:actor.name,at:review.at}}:{})};
  await tx.query('INSERT INTO internal_authorization_reviews(id,case_id,review) VALUES($1,$2,$3)',[data.eventId,id,review]);await tx.query('UPDATE cases SET workflow=$2,updated_at=now() WHERE id=$1',[id,workflow]);await audit(tx,id,actor.name,'internal-authorization-'+data.action,review);return review;
 }));
}
