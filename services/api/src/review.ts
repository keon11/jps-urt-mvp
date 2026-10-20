import type {Bundle,Observation} from '@medplum/fhirtypes';
import {z} from 'zod';
import {cql,fhirClient,jsonFetch} from './adapters.js';
import {config} from './config.js';
import {getCase,freshBundle,transaction,audit,HttpError,type Actor} from './store.js';
import {hash} from './fixtures.js';
export const rules={version:'illustrative-1.0.0',label:'Illustrative, unvalidated clinical and payer criteria',spo2Low:90,systolicLow:90,expectedNights:2,observationHours:24,notificationHours:24,staleHours:24};
export const demoNow=()=>new Date(process.env.DEMO_NOW||'2026-10-20T12:00:00Z');
export function facts(bundle:Bundle){
 const resources=bundle.entry?.map(e=>e.resource!).filter(Boolean)||[];
 const obs=(code:string)=>resources.filter(r=>r.resourceType==='Observation'&&r.code?.coding?.some(c=>c.code===code)).map(r=>r as Observation).filter(r=>r.status==='final').sort((a,b)=>String(b.effectiveDateTime).localeCompare(String(a.effectiveDateTime)))[0];
 const spo2=obs('59408-5'),bp=obs('8480-6'),nights=obs('expected-nights');
 const encounter:any=resources.find(r=>r.resourceType==='Encounter');
 const hours=encounter?.period?.start?(demoNow().getTime()-Date.parse(encounter.period.start))/3600000:undefined;
 const missing:string[]=[];
 for(const [label,o] of [['oxygen saturation',spo2],['systolic pressure',bp],['expected nights',nights]] as const){
  if(!o||!Number.isFinite(o.valueQuantity?.value))missing.push(label);
  else {const age=(demoNow().getTime()-Date.parse(o.effectiveDateTime||''))/3600000;if(!Number.isFinite(age)||age>rules.staleHours||age<0)missing.push(label+' current timestamp');}
 }
 if(spo2&&(spo2.valueQuantity?.code!=='%'||spo2.valueQuantity?.system!=='http://unitsofmeasure.org'||spo2.valueQuantity.value!<0||spo2.valueQuantity.value!>100))missing.push('valid oxygen saturation units/range');
 if(bp&&(bp.valueQuantity?.code!=='mm[Hg]'||bp.valueQuantity?.system!=='http://unitsofmeasure.org'||bp.valueQuantity.value!<30||bp.valueQuantity.value!>250))missing.push('valid systolic pressure units/range');
 if(!encounter||!Number.isFinite(hours)||hours!<0)missing.push('valid encounter start');
 return {resources,spo2:spo2?.valueQuantity?.value,bp:bp?.valueQuantity?.value,nights:nights?.valueQuantity?.value,hours:hours||0,currentStatus:encounter?.class?.code==='IMP'?'Inpatient':'Observation',documented:resources.some(r=>r.resourceType==='DocumentReference'&&r.status==='current'),missing,evidence:[spo2,bp,nights].filter(Boolean).map(o=>`Observation/${o!.id}`)};
}
export type Signal={code:string;label:string;evidence:string[]};
export function clinicalResult(f:ReturnType<typeof facts>,unstable:boolean,needsStay:boolean,authorization:string){
 const signals:Signal[]=[];
 const recommendation=f.missing.length?'Insufficient evidence':needsStay?'Inpatient review suggested':'Observation review suggested';
 if(unstable)signals.push({code:'clinical-instability',label:'Illustrative vital-sign threshold crossed',evidence:f.evidence.slice(0,2)});
 if(!f.missing.length&&((needsStay&&f.currentStatus==='Observation')||(!needsStay&&f.currentStatus==='Inpatient')))signals.push({code:'status-mismatch',label:'Current encounter status differs from illustrative review recommendation',evidence:f.evidence});
 if(f.currentStatus==='Observation'&&f.hours>=rules.observationHours)signals.push({code:'observation-outlier',label:'Observation duration exceeds illustrative 24-hour review threshold',evidence:[]});
 if(!f.documented)signals.push({code:'missing-documentation',label:'Supporting synthetic physician document is missing',evidence:[]});
 if(authorization!=='approved')signals.push({code:'authorization',label:'Authorization needs human follow-up: '+authorization,evidence:[]});
 if(f.missing.length)signals.push({code:'missing-data',label:'Missing or stale clinical evidence: '+f.missing.join(', '),evidence:[]});
 const priority=Math.min(100,20+(unstable?35:0)+(signals.some(s=>s.code==='status-mismatch')?15:0)+(signals.some(s=>s.code==='observation-outlier')?10:0)+(!f.documented?10:0)+(authorization==='denied'?20:authorization==='approved'?0:10)+(f.missing.length?15:0));
 return {recommendation,continuedStay:f.missing.length?'Insufficient evidence':needsStay?'Continued-stay review suggested':'Reassess continued-stay need',baselinePriority:priority,signals,denialRisk:{label:!f.documented||authorization==='denied'||authorization==='expired'?'Elevated illustrative risk':signals.some(s=>s.code==='status-mismatch')?'Review needed':'Monitor',probability:null,explanation:'Illustrative risk signals only; not a validated prediction or probability.'},missing:f.missing};
}
export async function localTriage(input:{baselinePriority:number;signals:Signal[];evidence:string[]},endpoint=config.modelUrl){
 const candidates=input.signals.length?input.signals:[{code:'routine',label:'Routine review of supplied synthetic evidence',evidence:input.evidence}];
 const schema={type:'object',additionalProperties:false,required:['urgency','rationaleCode','evidence'],properties:{urgency:{type:'string',enum:['urgent','high','routine']},rationaleCode:{type:'string',enum:candidates.map(s=>s.code)},evidence:{type:'array',minItems:1,maxItems:1,items:{type:'string',enum:input.evidence}}}};
 try{
  if(!input.evidence.length)throw new Error('No evidence for model triage');
  const prompt='Classify this fictional utilization-review case for human queue triage. Do not make coverage or clinical determinations. Choose urgency urgent for severe vital-sign signals, high for status mismatch or delayed review, routine otherwise. Choose one rationaleCode from the supplied signals and cite supplied evidence references. All criteria are illustrative. Input: '+JSON.stringify(input);
  const result=await jsonFetch(endpoint+'/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:config.model,messages:[{role:'system',content:'You classify synthetic case priority using supplied facts only. Return the required JSON.'},{role:'user',content:prompt}],temperature:0,max_tokens:120,response_format:{type:'json_schema',json_schema:{name:'triage',strict:true,schema}}})},90000);
  const output=z.object({urgency:z.enum(['urgent','high','routine']),rationaleCode:z.string(),evidence:z.array(z.string()).min(1).max(1)}).strict().parse(JSON.parse(result.choices[0].message.content));
  const reason=candidates.find(s=>s.code===output.rationaleCode);
  if(!reason||output.evidence.some(e=>!input.evidence.includes(e)))throw new Error('Unverifiable model evidence');
  return {mode:'local-model',model:config.model,output,summary:`Local model selected ${output.urgency} urgency: ${reason.label}. Human review required.`,promptHash:hash(prompt),adjustment:output.urgency==='urgent'?10:output.urgency==='high'?5:0,limitations:'Small local model demonstrates the integration pipeline; no clinical calibration or performance claims.'};
 }catch(e){return {mode:'rules-fallback',model:config.model,summary:'Local AI unavailable or invalid; queue uses illustrative rules only.',adjustment:0,error:(e as Error).message,limitations:'No model-driven result was accepted.'};}
}
export async function assess(id:string,actor:Actor,kind='initial'){
 const row=await getCase(id),bundle=await freshBundle(row),f=facts(bundle);
 const expressions={unstable:`${f.spo2??100} < ${rules.spo2Low} or ${f.bp??120} < ${rules.systolicLow}`,needsStay:`(${f.spo2??100} < ${rules.spo2Low} or ${f.bp??120} < ${rules.systolicLow}) or ${f.nights??0} >= ${rules.expectedNights}`};
 let unstable=false,needsStay=false;
 if(!f.missing.length){
  const results=await Promise.all([cql(expressions.unstable,bundle,row.patient_id),cql(expressions.needsStay,bundle,row.patient_id)]);
  if(results.some(x=>typeof x!=='boolean'))throw new HttpError(502,'CQF returned an invalid result');
  [unstable,needsStay]=results;
 }
 const clinical=clinicalResult(f,unstable,needsStay,row.workflow.authorization);
 const ai=await localTriage({baselinePriority:clinical.baselinePriority,signals:clinical.signals,evidence:f.evidence});
 const assessment={...clinical,ai,priority:Math.min(100,clinical.baselinePriority+ai.adjustment),kind,ruleVersion:rules.version,criteriaLabel:rules.label,engine:f.missing.length?'not-evaluated-missing-evidence':'HAPI/CQF CQL',expressions,sourceHash:hash(bundle),sources:f.resources.map(r=>({reference:r.resourceType+'/'+r.id,version:r.meta?.versionId})),evaluatedAt:new Date().toISOString(),demoAsOf:demoNow().toISOString()};
 const client=await fhirClient();
 const provenance=await client.createResource({resourceType:'Provenance',target:assessment.sources.map(s=>({reference:s.reference+'/_history/'+s.version})),recorded:assessment.evaluatedAt,activity:{text:`${kind} review, ${rules.version}; synthetic illustrative decision support`},agent:[{who:{display:'Clarity UR synthetic review service'}}]});
 return transaction(async tx=>{
  const locked=(await tx.query('SELECT * FROM cases WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(new Date(locked.updated_at).getTime()!==new Date(row.updated_at).getTime()||hash(locked.workflow)!==hash(row.workflow)||hash(locked.bundle)!==hash(row.bundle))throw new HttpError(409,'Case changed during assessment; rerun against the latest case');
  const humanDecision=locked.workflow.humanDecision?.assessmentSourceHash===assessment.sourceHash?locked.workflow.humanDecision:null;
  const workflow={...locked.workflow,humanDecision,state:locked.workflow.state==='escalated'?'escalated':humanDecision?.disposition==='Request more information'?'awaiting-information':humanDecision?'reviewed':'assessed'};
  const {rows}=await tx.query('UPDATE cases SET bundle=$2,assessment=$3,workflow=$4,updated_at=now() WHERE id=$1 RETURNING *',[id,bundle,{...assessment,provenance:'Provenance/'+provenance.id},workflow]);
  await audit(tx,id,actor.name,kind==='continued-stay'?'continued-stay-review':'initial-review',assessment);
  return rows[0];
 });
}
export const updateVitalsSchema=z.object({spo2:z.number().min(50).max(100),systolic:z.number().min(40).max(240),expectedNights:z.number().int().min(0).max(30)}).strict();
export async function updateVitals(id:string,input:unknown,actor:Actor){
 const data=updateVitalsSchema.parse(input),row=await getCase(id);
 return transaction(async tx=>{
  await tx.query('SELECT id FROM cases WHERE id=$1 FOR UPDATE',[id]);
  const current=(await tx.query('SELECT * FROM cases WHERE id=$1',[id])).rows[0];
  const client=await fhirClient(),bundle=await freshBundle(current);
  const updates:Record<string,number>={'59408-5':data.spo2,'8480-6':data.systolic,'expected-nights':data.expectedNights};
  for(const entry of bundle.entry!){const r=entry.resource;if(r?.resourceType==='Observation'){const code=r.code.coding?.[0]?.code;if(code&&code in updates){r.valueQuantity!.value=updates[code];r.effectiveDateTime=demoNow().toISOString();entry.resource=await client.updateResource(r);}}}
  const workflow={...current.workflow,state:current.workflow.state==='escalated'?'escalated':'awaiting-review',humanDecision:null};
  await tx.query('UPDATE cases SET bundle=$2,assessment=NULL,workflow=$3,updated_at=now() WHERE id=$1',[id,bundle,workflow]);
  await audit(tx,id,actor.name,'synthetic-vitals-updated',{...data,note:'Previous assessment invalidated; rerun continued-stay review.'});return {ok:true};
 });
}
