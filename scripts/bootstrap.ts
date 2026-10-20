import {fhirClient,cql,login,verifyToken,jsonFetch} from '../services/api/src/adapters.js';
import {config} from '../services/api/src/config.js';
import {mkdir,writeFile} from 'node:fs/promises';
const checks:Record<string,unknown>={};
for (const url of [config.medplum+'healthcheck',config.cqf+'/metadata',config.keycloak+'/.well-known/openid-configuration']) {
 const deadline=Date.now()+240000;
 for(;;){
  try{ const r=await fetch(url,{signal:AbortSignal.timeout(4000)}); if(r.ok)break;}catch{}
  if(Date.now()>deadline)throw new Error('Readiness timeout: '+url);
  await new Promise(resolve=>setTimeout(resolve,2000));
 }
}
const client=await fhirClient();
const p=await client.createResource({resourceType:'Patient',identifier:[{system:'urn:ur-demo:synthetic',value:'foundation-probe'}],name:[{family:'Fictional',given:['Foundation']} ]});
const read=await client.readResource('Patient',p.id!);
if(read.id!==p.id)throw new Error('FHIR persistence probe failed');
checks.medplum={persisted:true,version:read.meta?.versionId};
checks.cqf=await cql('5 * 5');
const syntheticBundle={resourceType:'Bundle',type:'collection',entry:[{resource:{resourceType:'Patient',id:p.id} }]} as const;
checks.cqfFhirData=await cql('88 < 90',syntheticBundle as any,p.id);
if(checks.cqfFhirData!==true)throw new Error('CQF supplied-data check failed');
if(checks.cqf!==25)throw new Error('CQL probe failed');
const token=await login('reviewer','Synthetic-demo-only-2026!');
const user=await verifyToken(token.access_token);
if(!user.roles.includes('reviewer'))throw new Error('Keycloak reviewer role missing');
checks.keycloak={verified:true,roles:user.roles.filter(x=>['reviewer','advisor','admin'].includes(x))};
const model=await jsonFetch(config.modelUrl+'/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:config.model,messages:[{role:'user',content:'Return JSON with status equal to ready.'}],temperature:0,max_tokens:30,response_format:{type:'json_object'}})},60000);
const ack=JSON.parse(model.choices[0].message.content);
if(ack.status!=='ready')throw new Error('Local model check failed');
checks.localModel={ready:true,model:config.model};
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/foundation-results.json',JSON.stringify({at:new Date().toISOString(),checks},null,2));
console.log(JSON.stringify(checks,null,2));
