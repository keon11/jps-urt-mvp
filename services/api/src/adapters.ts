import { MedplumClient } from '@medplum/core';
import type { Bundle, Parameters, Resource } from '@medplum/fhirtypes';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import {config} from './config.js';
export const medplum = new MedplumClient({baseUrl:config.medplum});
let medLogin: Promise<unknown> | undefined;
export async function fhirClient() {
 medLogin ??= medplum.startClientLogin(config.medplumClient,config.medplumSecret).catch(e=>{medLogin=undefined;throw e;});
 await medLogin; return medplum;
}
export async function jsonFetch(url:string,init:RequestInit={},timeout=30000):Promise<any>{
 const r=await fetch(url,{...init,signal:AbortSignal.timeout(timeout)});
 const text=await r.text();
 if(!r.ok) throw new Error(`Upstream ${new URL(url).pathname} returned ${r.status}: ${text.slice(0,300)}`);
 return text?JSON.parse(text):{};
}
export function toCqfBundle(data:Bundle):Bundle{
 const standardMeta=new Set(['id','extension','versionId','lastUpdated','source','profile','security','tag']);
 return JSON.parse(JSON.stringify(data,(key,value)=>key==='meta'&&value?Object.fromEntries(Object.entries(value).filter(([field])=>standardMeta.has(field))):value));
}
export async function cql(expression:string,data?:Bundle,subject?:string):Promise<any>{
 const parameter:Parameters['parameter']=[{name:'expression',valueString:expression},{name:'useServerData',valueBoolean:false}];
 if(data) parameter.push({name:'data',resource:toCqfBundle(data)});
 if(subject) parameter.push({name:'subject',valueString:subject});
 const result=await jsonFetch(config.cqf+'/$cql',{method:'POST',headers:{'Content-Type':'application/fhir+json'},body:JSON.stringify({resourceType:'Parameters',parameter})},60000);
 if(result.resourceType!=='Parameters')throw new Error('CQF did not return Parameters');
 const p=result.parameter?.find((x:any)=>x.name==='return');
 if(!p)throw new Error('CQF result missing return');
 for(const key of ['valueBoolean','valueInteger','valueDecimal','valueString'])if(key in p)return p[key];
 throw new Error('Unsupported CQF result');
}
const jwks=createRemoteJWKSet(new URL(config.keycloak+'/protocol/openid-connect/certs'));
export async function verifyToken(token:string){
 const {payload}=await jwtVerify(token,jwks,{issuer:config.keycloak,audience:'ur-web'});
 const roles=(payload.realm_access as {roles?:string[]})?.roles || [];
 return {id:payload.sub!,name:String(payload.preferred_username||payload.sub),roles};
}
export async function login(username:string,password:string){
 return jsonFetch(config.keycloak+'/protocol/openid-connect/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'password',client_id:'ur-web',username,password})});
}
export async function serviceStatus(){
 const targets=[['medplum',config.medplum+'healthcheck'],['cqf',config.cqf+'/metadata'],['identity',config.keycloak+'/.well-known/openid-configuration'],['localModel',config.modelUrl+'/health']];
 return Object.fromEntries(await Promise.all(targets.map(async([name,url])=>{
  try{const r=await fetch(url,{signal:AbortSignal.timeout(4000)});return [name,r.ok?'ready':'unavailable'];}catch{return [name,'unavailable'];}
 })));
}
