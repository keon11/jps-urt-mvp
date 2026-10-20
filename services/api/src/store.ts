import type {PoolClient} from 'pg';
import {pool} from './db.js';
import {hash,makeFixture,validateFixture} from './fixtures.js';
import {fhirClient} from './adapters.js';
import type {Bundle,Resource} from '@medplum/fhirtypes';
export class HttpError extends Error{constructor(public status:number,message:string){super(message);}}
export type Actor={id:string;name:string;roles:string[]};
export async function audit(tx:PoolClient,caseId:string,actor:string,action:string,detail:any){
 await tx.query('SELECT pg_advisory_xact_lock(20261404054)');
 const {rows}=await tx.query('SELECT hash FROM audit ORDER BY sequence DESC LIMIT 1');
 const previous=rows[0]?.hash||'GENESIS',at=new Date().toISOString();
 const payload={caseId,actor,action,detail,at,previous};
 await tx.query('INSERT INTO audit(case_id,actor,action,detail,at,previous_hash,hash) VALUES($1,$2,$3,$4,$5,$6,$7)',[caseId,actor,action,detail,at,previous,hash(payload)]);
}
export async function transaction<T>(fn:(tx:PoolClient)=>Promise<T>):Promise<T>{
 const tx=await pool.connect();try{await tx.query('BEGIN');const result=await fn(tx);await tx.query('COMMIT');return result;}catch(e){await tx.query('ROLLBACK');throw e;}finally{tx.release();}
}
export async function getCase(id:string){const {rows}=await pool.query('SELECT * FROM cases WHERE id=$1',[id]);if(!rows[0])throw new HttpError(404,'Case not found');return rows[0];}
export async function listCases(){return (await pool.query("SELECT * FROM cases ORDER BY COALESCE((assessment->>'priority')::int,0) DESC,created_at ASC")).rows;}
export async function intake(value:unknown,key:string,actor:Actor){
 const bundle=validateFixture(value),id=bundle.identifier!.value!,digest=hash(bundle);
 return transaction(async tx=>{
  await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))',['intake:'+id]);
  const used=(await tx.query('SELECT * FROM idempotency WHERE key=$1',[key])).rows[0];
  if(used&&used.payload_hash!==digest)throw new HttpError(409,'Idempotency key already used for another bundle');
  const existing=(await tx.query('SELECT * FROM cases WHERE id=$1',[id])).rows[0];
  if(existing){await tx.query('INSERT INTO idempotency VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[key,digest,id]);return {case:existing,duplicate:true};}
  const client=await fhirClient();
  const response=await client.executeBatch(bundle);
  if(response.entry?.some(e=>!e.response?.status?.startsWith('2')))throw new HttpError(502,'FHIR transaction was not fully accepted');
  const resources:Resource[]=[];
  for(const entry of bundle.entry!){const r=entry.resource!;resources.push(await client.readResource(r.resourceType as any,r.id!) as Resource);}
  const snapshot:Bundle={resourceType:'Bundle',type:'collection',meta:bundle.meta,entry:resources.map(resource=>({resource}))};
  const patient:any=resources.find(r=>r.resourceType==='Patient'),encounter:any=resources.find(r=>r.resourceType==='Encounter');
  const workflow={state:'new',authorization:'not-submitted',notifications:[],events:[],humanDecision:null,escalation:null};
  const {rows}=await tx.query('INSERT INTO cases(id,patient_id,encounter_id,label,scenario,bundle,workflow) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[id,patient.id,encounter.id,patient.name[0].given[0]+' Fictional',id,snapshot,workflow]);
  await tx.query('INSERT INTO idempotency VALUES($1,$2,$3)',[key,digest,id]);
  await audit(tx,id,actor.name,'synthetic-intake',{sourceHash:digest,resources:resources.map(r=>({reference:r.resourceType+'/'+r.id,version:r.meta?.versionId}))});
  return {case:rows[0],duplicate:false};
 });
}
export async function freshBundle(row:any):Promise<Bundle>{
 const client=await fhirClient();
 const entry=await Promise.all(row.bundle.entry.map(async(e:any)=>({resource:await client.readResource(e.resource.resourceType,e.resource.id)})));
 return {resourceType:'Bundle',type:'collection',meta:row.bundle.meta,entry};
}
