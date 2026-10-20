import type {Bundle} from '@medplum/fhirtypes';
import {createHash} from 'node:crypto';
export const syntheticTag={system:'urn:ur-demo:data-classification',code:'synthetic',display:'Fictional demonstration only'};
const scenarios=[
 {id:'respiratory',name:'Maya Fictional',diagnosis:'Synthetic respiratory exacerbation',spo2:87,systolic:106,nights:3,status:'OBSENC',hours:22,payer:'Fictional Meridian',doc:true},
 {id:'observation',name:'Noah Fictional',diagnosis:'Synthetic transient symptoms',spo2:98,systolic:122,nights:1,status:'IMP',hours:10,payer:'Fictional Harbor',doc:true},
 {id:'continued-stay',name:'Avery Fictional',diagnosis:'Synthetic recovery review',spo2:95,systolic:114,nights:1,status:'IMP',hours:76,payer:'Fictional Meridian',doc:true},
 {id:'documentation',name:'Leo Fictional',diagnosis:'Synthetic documentation gap',spo2:93,systolic:108,nights:2,status:'OBSENC',hours:36,payer:'Fictional Harbor',doc:false},
 {id:'authorization',name:'Isla Fictional',diagnosis:'Synthetic authorization review',spo2:91,systolic:112,nights:3,status:'IMP',hours:28,payer:'Fictional Summit',doc:true},
 {id:'advisor',name:'Rowan Fictional',diagnosis:'Synthetic hemodynamic review',spo2:94,systolic:84,nights:3,status:'OBSENC',hours:30,payer:'Fictional Summit',doc:true},
];
export const fixtureIds=scenarios.map(s=>s.id);
const uuid=(index:number)=>`30000000-0000-4000-8000-${String(index).padStart(12,'0')}`;
export function makeFixture(id:string):Bundle{
 const i=scenarios.findIndex(s=>s.id===id);if(i<0)throw new Error('Unknown synthetic fixture');
 const s=scenarios[i],patient=uuid(i*20+1),enc=uuid(i*20+2);
 const time=new Date(Date.parse('2026-10-20T12:00:00Z')-s.hours*3600000).toISOString();
 const resources:any[]=[
  {resourceType:'Patient',id:patient,identifier:[{system:'urn:ur-demo:synthetic',value:id}],name:[{family:'Fictional',given:[s.name.split(' ')[0]]}],gender:'unknown',birthDate:'1980-01-01'},
  {resourceType:'Encounter',id:enc,status:'in-progress',class:{system:'http://terminology.hl7.org/CodeSystem/v3-ActCode',code:s.status},subject:{reference:'Patient/'+patient},period:{start:time}},
  {resourceType:'Condition',id:uuid(i*20+3),clinicalStatus:{coding:[{system:'http://terminology.hl7.org/CodeSystem/condition-clinical',code:'active'}]},code:{text:s.diagnosis},subject:{reference:'Patient/'+patient},encounter:{reference:'Encounter/'+enc}},
  {resourceType:'Coverage',id:uuid(i*20+4),status:'active',beneficiary:{reference:'Patient/'+patient},payor:[{display:s.payer}],type:{text:'Illustrative managed plan'}},
  ...[['59408-5','Oxygen saturation',s.spo2,'%','%'],['8480-6','Systolic blood pressure',s.systolic,'mmHg','mm[Hg]'],['expected-nights','Illustrative expected nights',s.nights,'nights','1']].map(([code,display,value,unit,ucum],n)=>({resourceType:'Observation',id:uuid(i*20+5+n),status:'final',code:{coding:[{system:n<2?'http://loinc.org':'urn:ur-demo:illustrative',code,display}]},subject:{reference:'Patient/'+patient},encounter:{reference:'Encounter/'+enc},effectiveDateTime:'2026-10-20T12:00:00Z',valueQuantity:{value,unit,system:'http://unitsofmeasure.org',code:ucum}})),
 ];
 if(s.doc)resources.push({resourceType:'DocumentReference',id:uuid(i*20+8),status:'current',subject:{reference:'Patient/'+patient},description:'Fictional physician documentation present; all clinical content illustrative.',content:[{attachment:{contentType:'text/plain',data:Buffer.from('Fictional demonstration note. Not a clinical record.').toString('base64')}}]});
 return {resourceType:'Bundle',id,identifier:{system:'urn:ur-demo:fixture',value:id},type:'transaction',meta:{tag:[syntheticTag]},entry:resources.map(resource=>({resource:{...resource,meta:{tag:[syntheticTag]}},request:{method:'PUT',url:resource.resourceType+'/'+resource.id}}))} as Bundle;
}
export function canonical(value:any):string{
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
export const hash=(value:unknown)=>createHash('sha256').update(canonical(value)).digest('hex');
export function validateFixture(value:any):Bundle{
 const id=value?.identifier?.value;
 if(!fixtureIds.includes(id)||hash(value)!==hash(makeFixture(id)))throw Object.assign(new Error('Only the six unmodified fictional fixture bundles are accepted. Download a demo fixture and retry.'),{status:422});
 return value as Bundle;
}
