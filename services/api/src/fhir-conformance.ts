import type {Bundle,Resource} from '@medplum/fhirtypes';
import {z} from 'zod';import {hash} from './fixtures.js';
const resourceSchema=z.object({resourceType:z.enum(['Patient','Encounter','Condition','Coverage','Observation','DocumentReference']),id:z.string().regex(/^[A-Za-z0-9.-]{1,64}$/),meta:z.object({versionId:z.string().min(1).optional(),lastUpdated:z.string().datetime().optional(),tag:z.array(z.object({system:z.string(),code:z.string()})).refine(tags=>tags.some(t=>t.system==='urn:ur-demo:data-classification'&&t.code==='synthetic'))})}).passthrough();
export function mapSyntheticFhir(input:unknown,sourceUrl:string){
 const bundle=z.object({resourceType:z.literal('Bundle'),type:z.enum(['collection','searchset','transaction']),entry:z.array(z.object({resource:z.unknown()})).min(1).max(100)}).parse(input);
 const records=bundle.entry.map(e=>resourceSchema.parse(e.resource));
 const refs=new Set(records.map(r=>r.resourceType+'/'+r.id));if(refs.size!==records.length)throw Error('Duplicate resource reference');
 const patients=records.filter(r=>r.resourceType==='Patient'),encounters=records.filter(r=>r.resourceType==='Encounter');
 if(patients.length!==1||encounters.length!==1)throw Error('Exactly one synthetic patient and encounter required');
 const patient='Patient/'+patients[0].id,encounter=encounters[0];
 function check(value:unknown):void{if(Array.isArray(value)){value.forEach(check);return;}if(value&&typeof value==='object'){for(const [k,v]of Object.entries(value)){if(k==='reference'&&(typeof v!=='string'||!refs.has(v)))throw Error('Unresolved or external FHIR reference');check(v);}}}
 records.forEach(check);
 for(const r of records){if((r.encounter as any)?.reference&&(r.encounter as any).reference!=='Encounter/'+encounter.id)throw Error('Clinical encounter mismatch');}
 if((encounter.subject as any)?.reference!==patient)throw Error('Encounter subject mismatch');
 for(const r of records){if((r.subject as any)?.reference&&(r.subject as any).reference!==patient)throw Error('Clinical subject mismatch');if((r.beneficiary as any)?.reference&&(r.beneficiary as any).reference!==patient)throw Error('Coverage subject mismatch');}
 if((encounter.class as any)?.system!=='http://terminology.hl7.org/CodeSystem/v3-ActCode'||!['IMP','OBSENC'].includes((encounter.class as any)?.code))throw Error('Unsupported encounter class');
 if(!['in-progress','finished','cancelled'].includes(String(encounter.status)))throw Error('Unsupported encounter status');
 return {patientReference:patient,encounterReference:'Encounter/'+encounter.id,classCode:(encounter.class as any).code,status:encounter.status,sourceUrl,sourceHash:hash(input),versions:records.map(r=>({reference:r.resourceType+'/'+r.id,version:r.meta.versionId??null,lastUpdated:r.meta.lastUpdated??null})),resources:records as Resource[],syntheticOnly:true,epicValidated:false};
}
export function reconcileSynthetic(previous:ReturnType<typeof mapSyntheticFhir>,incoming:ReturnType<typeof mapSyntheticFhir>){
 if(previous.patientReference!==incoming.patientReference||previous.encounterReference!==incoming.encounterReference)throw Error('Identity mismatch');
 if(previous.sourceHash===incoming.sourceHash)return {action:'duplicate',refreshRequired:false,sourceUnchanged:true};
 for(const old of previous.versions){const next=incoming.versions.find(v=>v.reference===old.reference);if(!next)throw Error('Incomplete snapshot requires reconciliation');if(next.lastUpdated&&old.lastUpdated&&Date.parse(next.lastUpdated)<Date.parse(old.lastUpdated))throw Error('Older source rejected');if(next.version&&next.version===old.version&&hash(previous.resources.find(r=>r.resourceType+'/'+r.id===old.reference))!==hash(incoming.resources.find(r=>r.resourceType+'/'+r.id===next.reference)))throw Error('Changed content with unchanged version');}
 return {action:'review-required',refreshRequired:true,sourceUnchanged:false};
}
export const fhirConformanceSources=[{url:'https://hl7.org/fhir/R4/bundle.html',purpose:'FHIR R4 bundle/reference semantics'},{url:'https://fhir.epic.com/Documentation?docId=developerguidelines',purpose:'Epic developer registration/access prerequisites; not certification'}];
export function syntheticCollection(bundle:Bundle):Bundle{return {...bundle,type:'collection',entry:bundle.entry?.map(({resource})=>({resource}))};}
