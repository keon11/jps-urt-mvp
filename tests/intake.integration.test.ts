import {test,after} from 'node:test';import assert from 'node:assert/strict';
import {login} from '../services/api/src/adapters.js';
import {makeFixture} from '../services/api/src/fixtures.js';
import {pool} from '../services/api/src/db.js';
const base='http://localhost:3000';
let reviewer:string,advisor:string;
async function request(path:string,method='GET',body?:unknown,token?:string,key?:string){
 return fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(key?{'Idempotency-Key':key}:{})},...(body?{body:JSON.stringify(body)}:{})});
}
test('real Keycloak authentication protects API',async()=>{
 assert.equal((await request('/api/cases')).status,401);
 reviewer=(await login('reviewer','Synthetic-demo-only-2026!')).access_token;
 advisor=(await login('advisor','Synthetic-demo-only-2026!')).access_token;
 assert.equal((await request('/api/cases','GET',undefined,reviewer)).status,200);
});
test('repeat intake preserves one case and FHIR source versions',async()=>{
 const before=await (await request('/api/cases/respiratory','GET',undefined,reviewer)).json();
 const r=await request('/api/intake','POST',makeFixture('respiratory'),reviewer,'integration-respiratory');assert.equal(r.status,200);assert.equal((await r.json()).duplicate,true);
 const after=await(await request('/api/cases/respiratory','GET',undefined,reviewer)).json();
 assert.equal(before.bundle.entry[0].resource.meta.versionId,after.bundle.entry[0].resource.meta.versionId);
 assert.equal((await pool.query("SELECT count(*) FROM cases WHERE id='respiratory'")).rows[0].count,'1');
});
test('malformed payloads, conflicting idempotency keys, and advisor intake are rejected',async()=>{
 assert.equal((await request('/api/intake','POST',{},reviewer,'invalid')).status,422);
 assert.equal((await request('/api/intake','POST',makeFixture('observation'),reviewer,'integration-respiratory')).status,409);
 assert.equal((await request('/api/intake','POST',makeFixture('observation'),advisor,'advisor-attempt')).status,403);
});
test('intake audit includes versioned FHIR source evidence and database rejects audit edits',async()=>{
 const a=await (await request('/api/cases/respiratory/audit','GET',undefined,reviewer)).json();
 assert.ok(a.some((x:any)=>x.action==='synthetic-intake'&&x.detail.resources.every((r:any)=>r.version)));
 await assert.rejects(pool.query("UPDATE audit SET actor='tampered' WHERE sequence=(SELECT min(sequence) FROM audit)"),/append-only/);
});
after(async()=>pool.end());
