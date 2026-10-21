import{execFile}from'node:child_process';import{promisify}from'node:util';
import {EpicFhirR4Adapter,smartConfiguration,reconcileFhirResource} from '../services/api/src/epic-fhir-adapter.js';
import {readFile,writeFile} from 'node:fs/promises';import {fhirClient,jsonFetch} from '../services/api/src/adapters.js';import {config} from '../services/api/src/config.js';import {hash} from '../services/api/src/fixtures.js';
const corpus=JSON.parse(await readFile('fixtures/synthea/cohort-v1.json','utf8')),client=await fhirClient();const results:any[]=[];
for(const location of corpus.locations)await client.updateResource(location);
for(const p of corpus.patients){const entries=p.bundle.entry;const selected= ['Patient','Encounter','Observation','Condition'].map(type=>entries.filter((e:any)=>e.resource.resourceType===type).at(-1)?.resource).filter(Boolean);const checks:any[]=[];
 for(const original of selected){const resource=structuredClone(original);delete resource.meta?.profile;let stored:any;try{stored=await client.updateResource(resource);const read=await client.readResource(resource.resourceType,resource.id);checks.push({type:resource.resourceType,id:resource.id,medplumReadVerified:read.id===resource.id,version:read.meta?.versionId??null,sourceHash:hash(original)});}catch(e){checks.push({type:resource.resourceType,medplumReadVerified:false,error:(e as Error).message.slice(0,200)});}
 if(results.length<2||process.argv.includes("--all-hapi")){try{const response=await fetch(config.cqf+'/'+resource.resourceType+'/$validate',{method:'POST',headers:{'Content-Type':'application/fhir+json',Accept:'application/fhir+json'},body:JSON.stringify(resource),signal:AbortSignal.timeout(45000)});const outcome=await response.json();checks.at(-1).hapi={status:response.status,resourceType:outcome.resourceType,issues:outcome.issue?.map((i:any)=>({severity:i.severity,code:i.code,diagnostics:i.diagnostics?.slice(0,240)}))??[]};}catch(e){checks.at(-1).hapi={error:(e as Error).message.slice(0,200)};}}
 }
 results.push({id:p.id,label:p.label,counts:p.counts,checks});}
const transport=new EpicFhirR4Adapter({baseUrl:config.medplum+'fhir/R4/',syntheticTest:true,tokenProvider:async()=>({accessToken:client.getAccessToken()!,expiresAt:Date.now()+60000,scopes:['system/Patient.read']})});
const localSearch=await transport.search('Patient?_tag=urn:ur-demo:data-classification|synthetic&_count=2',30);
let discovery:any;try{const {stdout}=await promisify(execFile)('curl',['--fail','--silent','--show-error','--proto','=https','--max-time','25','--max-filesize','1000000','-H','Accept: application/json','https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/.well-known/smart-configuration']);discovery={available:true,...smartConfiguration(JSON.parse(stdout),'https://fhir.epic.com')};}catch(e){discovery={available:false,credentialExchangePerformed:false,blocker:(e as Error).message.slice(0,250)};}
let fullCohortImport:any=null;
if(process.argv.includes('--all-hapi')){
 let imported=0;const references=new Set<string>();
 const allResources=corpus.patients.flatMap((p:any)=>p.bundle.entry.map((e:any)=>e.resource));
 const allIds=new Set(allResources.map((r:any)=>r.resourceType+'/'+r.id));
 if(allIds.size!==allResources.length||allResources.some((r:any)=>r.id.startsWith('30000000-0000-4000-8000-')))throw Error('Cohort identity collision or reserved MVP fixture identifier');
 for(const p of corpus.patients){
  const resources=p.bundle.entry.map((e:any)=>e.resource);
  for(let offset=0;offset<resources.length;offset+=100){
   const entries=resources.slice(offset,offset+100).map((original:any)=>{const resource=structuredClone(original);resource.meta={...resource.meta,source:'urn:ur-demo:synthea-sha256:'+p.provenance.originalSha256};return {resource,request:{method:'PUT' as const,url:resource.resourceType+'/'+resource.id}};});
   const result=await client.executeBatch({resourceType:'Bundle',type:'batch',entry:entries});
   if(result.entry?.length!==entries.length||(result.entry??[]).some(e=>!/^20[01]/.test(e.response?.status??'')))throw Error('Full synthetic cohort batch import failed');
   imported+=entries.length;for(const e of entries)references.add(e.resource.resourceType+'/'+e.resource.id);
  }
 }
 const unresolvedClinical:string[]=[];
 function check(v:any):void{if(Array.isArray(v)){v.forEach(check);return;}if(v&&typeof v==='object'){for(const[k,x]of Object.entries(v)){if(k==='reference'&&typeof x==='string'&&/^(Patient|Encounter|Observation|Condition)\//.test(x)&&!references.has(x))unresolvedClinical.push(x);else check(x);}}}
 corpus.patients.forEach((p:any)=>p.bundle.entry.forEach((e:any)=>check(e.resource)));
 if(unresolvedClinical.length)throw Error('Derived corpus has unresolved internal clinical references');
 fullCohortImport={actualLocalMedplum:true,sourceHashStoredInFhirMetaSource:true,resources:imported,uniqueClinicalReferences:references.size,unresolvedInternalClinicalReferences:unresolvedClinical,scope:'All derived Patient/Encounter/Observation/Condition records imported in bounded batches. External projected chart context is not asserted complete.'};
}
let localVersionReconciliation:any=null;
if(process.argv.includes('--all-hapi')){
 const id=corpus.patients[0].id,before=await client.readResource('Patient',id);
 await client.updateResource({...before,active:before.active!==true});
 try{
  const observed=await transport.read('Patient/'+id);
  let staleRejected=false;try{reconcileFhirResource(observed,before);}catch{staleRejected=true;}
  if(observed.meta?.versionId===before.meta?.versionId||reconcileFhirResource(before,observed)!=='review-required'||!staleRejected)throw Error('Actual local version/reconciliation proof failed');
  localVersionReconciliation={actualLocalMedplum:true,patient:id,oldVersion:before.meta?.versionId,newVersion:observed.meta?.versionId,duplicateDetected:reconcileFhirResource(observed,observed)==='duplicate',updatedSourceRequiresReview:true,staleRejected:true,epicValidated:false};
 }finally{
  const current=await client.readResource('Patient',id);if(before.active===undefined)delete current.active;else current.active=before.active;await client.updateResource(current);
 }
}
const hapiChecks=results.flatMap(p=>p.checks.filter((c:any)=>c.hapi).map((c:any)=>c.hapi));
const hapiBaseValidationPassed=hapiChecks.length===(process.argv.includes('--all-hapi')?64:8)&&hapiChecks.every((h:any)=>h.status===200&&h.resourceType==='OperationOutcome'&&!h.issues.some((i:any)=>['error','fatal'].includes(i.severity)));
const result={fullCohortImport,localVersionReconciliation,hapiBaseValidationPassed,hapiResources:hapiChecks.length,localAdapterPagination:{patients:localSearch.entry?.length,passed:(localSearch.entry?.length??0)>=16,authority:'Existing local Medplum service client, not an Epic SMART grant'},smartDiscovery:discovery,at:new Date().toISOString(),classification:'SYNTHETIC ONLY',originals:'private Synthea exports; derived fixture is documented',patients:results.length,resources:results.reduce((n,r)=>n+r.checks.length,0),localMedplumPassed:results.every(p=>p.checks.every((c:any)=>c.medplumReadVerified)),results,epicAuthenticated:false,jpsConnected:false,hapiScope:process.argv.includes('--all-hapi')?'All 16 patients, four resource types each; base structure only, profile declarations removed; no US Core certification.':'First two patients, four resource types each; base resource structure only, profiles removed from validation copy. No US Core certification.'};
await writeFile('artifacts/issue-4/synthea-local-proof.json',JSON.stringify(result,null,2)+'\n');console.log('Medplum reads:',result.resources,'passed:',result.localMedplumPassed);if(!result.localMedplumPassed||!hapiBaseValidationPassed||!result.localAdapterPagination.passed)process.exitCode=1;
