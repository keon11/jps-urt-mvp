import {test,after} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {login} from '../services/api/src/adapters.js';import {pool} from '../services/api/src/db.js';import {extractPolicy} from '../services/api/src/policy-intelligence.js';import {demonstrationPassword} from './browser/local-account.js';
test('authenticated policy evidence exposes versioned synthetic candidates, while anonymous requests fail',async()=>{
 const url='http://localhost:3000/api/policy-evidence';assert.equal((await fetch(url)).status,401);
 const t=await login('reviewer',demonstrationPassword());const r=await fetch(url,{headers:{Authorization:'Bearer '+t.access_token}});assert.equal(r.status,200);const d=await r.json();assert.equal(d.diff.added[0].code,'authorization-receipt');assert.equal(d.documents.filter((d:any)=>d.synthetic).length,2);
 for(const v of [1,2]){const original=await readFile(`fixtures/policies/authorization-v${v}.html`,'utf8');assert.equal(d.documents.find((d:any)=>d.id===`synthetic-${v}`).sourceHash,extractPolicy(original,'urn:comparison').sourceHash);}
});
test('policy evidence originals are immutable in the application database',async()=>{await assert.rejects(()=>pool.query("UPDATE policy_documents SET original='altered' WHERE id='synthetic-1'"),/append-only/);const r=await pool.query("SELECT original FROM policy_documents WHERE id='synthetic-1'");assert.match(r.rows[0].original,/Entirely synthetic/);});
after(()=>pool.end());
