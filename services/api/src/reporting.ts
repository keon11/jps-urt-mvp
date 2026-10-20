import {Gauge,Registry,collectDefaultMetrics} from 'prom-client';
import {pool} from './db.js';
import {listCases} from './store.js';
import {operational} from './workflow.js';
import {demoNow} from './review.js';
export async function report(){
 const cases=(await listCases()).map(operational);
 const tally=(values:string[])=>values.reduce<Record<string,number>>((result,key)=>{result[key]=(result[key]||0)+1;return result;},{});
 const current=cases.filter(c=>c.assessment&&!c.assessment.triageStale);
 const status=(c:any)=>c.bundle.entry.find((e:any)=>e.resource.resourceType==='Encounter').resource.class.code==='IMP'?'Inpatient':'Observation';
 return {demoAsOf:demoNow().toISOString(),total:cases.length,currentAssessments:current.length,staleAssessments:cases.filter(c=>c.assessment?.triageStale).length,priority:current.filter(c=>c.assessment.priority>=70).length,reviewOverdue:cases.filter(c=>c.operational.reviewOverdue).length,notificationOverdue:cases.filter(c=>c.operational.notificationOverdue).length,escalated:cases.filter(c=>c.workflow.state==='escalated').length,reviewed:cases.filter(c=>c.workflow.state==='reviewed').length,statusMix:tally(cases.map(status)),workflow:tally(cases.map(c=>c.workflow.state)),authorizations:tally(cases.map(c=>c.workflow.authorization)),ageBands:{'Under 24 hours':cases.filter(c=>c.operational.hoursInEncounter<24).length,'24–48 hours':cases.filter(c=>c.operational.hoursInEncounter>=24&&c.operational.hoursInEncounter<48).length,'Over 48 hours':cases.filter(c=>c.operational.hoursInEncounter>=48).length},signals:tally(current.flatMap(c=>c.assessment.signals.map((s:any)=>s.label))),aiModes:tally(current.map(c=>c.assessment.ai.mode)),humanDecisions:cases.filter(c=>c.workflow.humanDecision).map(c=>({case:c.id,...c.workflow.humanDecision})),recentActivity:(await pool.query('SELECT sequence,case_id,action,actor,at FROM audit ORDER BY sequence DESC LIMIT 12')).rows,disclaimer:'All data fictional. Scores, rules and deadlines are illustrative and unvalidated. Counts reflect current case state, not clinical model performance.'};
}
export const registry=new Registry();
collectDefaultMetrics({register:registry,prefix:'ur_'});
const gauge=new Gauge({name:'ur_cases',help:'Synthetic utilization review case counts',labelNames:['category'],registers:[registry]});
export async function metrics(){const r=await report();for(const key of ['total','currentAssessments','staleAssessments','priority','reviewOverdue','notificationOverdue','escalated','reviewed'] as const)gauge.set({category:key},r[key]);return registry.metrics();}
