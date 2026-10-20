import {z} from 'zod';
import {transaction,audit,getCase,HttpError,type Actor} from './store.js';
import {fhirClient} from './adapters.js';
import {demoNow,rules} from './review.js';
import {hash,syntheticTag} from './fixtures.js';
export const authInput=z.object({action:z.enum(['submit','payer-response','notify','simulate-expiry']),outcome:z.enum(['pending-information','approved','partial-approved','denied']).optional(),eventId:z.string().uuid()}).strict();
export function authTransition(status:string,action:string,outcome?:string){
 if(action==='notify')return status;
 if(action==='submit'&&['not-submitted','pending-information','denied','expired'].includes(status))return 'submitted';
 if(action==='payer-response'&&['submitted','pending-information'].includes(status)&&outcome)return outcome;
 if(action==='simulate-expiry'&&['approved','partial-approved'].includes(status))return 'expired';
 throw new HttpError(409,'This authorization transition is not allowed');
}
export function operational(row:any){
 const enc=row.bundle.entry.find((e:any)=>e.resource.resourceType==='Encounter')?.resource;
 const start=Date.parse(enc?.period?.start||demoNow().toISOString()),hours=Math.max(0,(demoNow().getTime()-start)/3600000);
 const dueAt=new Date(start+rules.notificationHours*3600000).toISOString();
 return {...row,operational:{hoursInEncounter:Math.round(hours),notificationDueAt:dueAt,notificationOverdue:!(row.workflow.notifications?.length)&&demoNow().getTime()>Date.parse(dueAt),reviewOverdue:!row.assessment&&hours>=rules.observationHours,assessmentStale:!!row.assessment?.triageStale}};
}
export async function authorizationEvent(id:string,input:unknown,actor:Actor){
 const data=authInput.parse(input);
 if(data.action==='payer-response'&&!data.outcome)throw new HttpError(422,'A simulated payer outcome is required');
 if(data.action!=='payer-response'&&data.outcome)throw new HttpError(422,'Outcome is only valid for a simulated payer response');
 return transaction(async tx=>{
  const row=(await tx.query('SELECT * FROM cases WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!row)throw new HttpError(404,'Case not found');
  const events=row.workflow.events||[],previous=events.find((e:any)=>e.eventId===data.eventId);
  if(previous){if(previous.payloadHash!==hash(data))throw new HttpError(409,'Event ID already used with another payload');return {...row,duplicate:true};}
  const status=authTransition(row.workflow.authorization,data.action,data.outcome);
  const event:any={...data,payloadHash:hash(data),at:new Date().toISOString(),demoAsOf:demoNow().toISOString(),status,simulated:true,actor:actor.name};
  const client=await fhirClient();
  const workflow={...row.workflow,authorization:status,events:[...events,event]};
  if(data.action==='submit'){
   if(!row.assessment)throw new HttpError(409,'Run a review before a simulated submission');
   const coverage=row.bundle.entry.find((e:any)=>e.resource.resourceType==='Coverage').resource;
   const claim=await client.createResource({resourceType:'Claim',meta:{tag:[syntheticTag]},status:'active',type:{coding:[{system:'http://terminology.hl7.org/CodeSystem/claim-type',code:'institutional'}]},use:'preauthorization',patient:{reference:'Patient/'+row.patient_id},created:demoNow().toISOString(),provider:{display:'Fictional Demonstration Hospital'},priority:{coding:[{system:'http://terminology.hl7.org/CodeSystem/processpriority',code:'normal'}]},insurance:[{sequence:1,focal:true,coverage:{reference:'Coverage/'+coverage.id}}]});
   event.fhirReference='Claim/'+claim.id;workflow.claimReference=event.fhirReference;workflow.submittedAt=demoNow().toISOString();
  }
  if(data.action==='payer-response'){
   const response=await client.createResource({resourceType:'ClaimResponse',meta:{tag:[syntheticTag]},status:'active',type:{coding:[{system:'http://terminology.hl7.org/CodeSystem/claim-type',code:'institutional'}]},use:'preauthorization',patient:{reference:'Patient/'+row.patient_id},created:demoNow().toISOString(),insurer:{display:'Fictional Payer Simulator'},request:{reference:workflow.claimReference},outcome:status==='pending-information'?'queued':status==='partial-approved'?'partial':'complete',disposition:`ILLUSTRATIVE SIMULATION ONLY: ${status}. No payer was contacted.`,...(status==='approved'||status==='partial-approved'?{preAuthRef:'SIM-'+data.eventId.slice(0,8)}:{})});
   event.fhirReference='ClaimResponse/'+response.id;
   if(['approved','partial-approved'].includes(status))workflow.validUntil=new Date(demoNow().getTime()+48*3600000).toISOString();
  }
  if(data.action==='notify')workflow.notifications=[...(workflow.notifications||[]),{id:data.eventId,at:demoNow().toISOString(),kind:'simulated-admission-notification',actor:actor.name,simulated:true}];
  if(data.action==='simulate-expiry')workflow.validUntil=new Date(demoNow().getTime()-1).toISOString();
  const assessment=row.assessment?{...row.assessment,triageStale:true,staleReason:'Authorization or notification context changed; rerun review to refresh queue priority.'}:null;
  const {rows}=await tx.query('UPDATE cases SET workflow=$2,assessment=$3,updated_at=now() WHERE id=$1 RETURNING *',[id,workflow,assessment]);
  await audit(tx,id,actor.name,'simulated-authorization-'+data.action,event);return rows[0];
 });
}
export const escalationReasons=['status-mismatch','continued-stay','documentation-gap','authorization-risk','clinical-uncertainty'] as const;
export const decisionReasons=['evidence-supports-recommendation','clinical-judgment-override','additional-documentation-required'] as const;
export const decisionInput=z.object({disposition:z.enum(['Inpatient','Observation','Request more information']),reason:z.enum(decisionReasons)}).strict();
export function validateDecision(row:any,data:z.infer<typeof decisionInput>){
 if(row.workflow.state!=='escalated')throw new HttpError(409,'Escalate this case before a physician advisor decision');
 if(!row.assessment||row.assessment.triageStale)throw new HttpError(409,'A current assessment is required before a human decision');
 if(data.disposition==='Request more information'){if(data.reason!=='additional-documentation-required')throw new HttpError(422,'Choose the additional-documentation reason');return;}
 if(row.assessment.recommendation==='Insufficient evidence')throw new HttpError(409,'Insufficient evidence; request more information');
 const suggested=row.assessment.recommendation.startsWith('Inpatient')?'Inpatient':'Observation';
 if(data.disposition!==suggested&&data.reason!=='clinical-judgment-override')throw new HttpError(422,'Overriding the recommendation requires an explicit clinical-judgment override reason');
 if(data.reason==='additional-documentation-required')throw new HttpError(422,'Use request more information when documentation is required');
}
export async function escalate(id:string,input:unknown,actor:Actor){
 const data=z.object({reason:z.enum(escalationReasons)}).strict().parse(input);
 return transaction(async tx=>{
  const row=(await tx.query('SELECT * FROM cases WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!row)throw new HttpError(404,'Case not found');
  if(!row.assessment||row.assessment.triageStale)throw new HttpError(409,'Run a current review before escalation');
  if(row.workflow.state==='escalated')throw new HttpError(409,'Case is already escalated');
  const workflow={...row.workflow,state:'escalated',humanDecision:null,escalation:{reason:data.reason,by:actor.name,at:new Date().toISOString()}};
  await audit(tx,id,actor.name,'physician-advisor-escalation',workflow.escalation);
  return (await tx.query('UPDATE cases SET workflow=$2,updated_at=now() WHERE id=$1 RETURNING *',[id,workflow])).rows[0];
 });
}
export async function decide(id:string,input:unknown,actor:Actor){
 const data=decisionInput.parse(input);
 return transaction(async tx=>{
  const row=(await tx.query('SELECT * FROM cases WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!row)throw new HttpError(404,'Case not found');
  validateDecision(row,data);
  const humanDecision={...data,by:actor.name,at:new Date().toISOString(),assessmentSourceHash:row.assessment.sourceHash,ruleVersion:row.assessment.ruleVersion,advisoryOnly:true};
  const workflow={...row.workflow,state:data.disposition==='Request more information'?'awaiting-information':'reviewed',humanDecision};
  await audit(tx,id,actor.name,'human-review-decision',humanDecision);
  return (await tx.query('UPDATE cases SET workflow=$2,updated_at=now() WHERE id=$1 RETURNING *',[id,workflow])).rows[0];
 });
}
