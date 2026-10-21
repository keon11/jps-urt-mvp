import {test} from 'node:test';import assert from 'node:assert/strict';
import {login} from '../services/api/src/adapters.js';import {demonstrationPassword} from './browser/local-account.js';
test('synthetic validation report requires authorized clinical or supervisor role',async()=>{
 const path='http://localhost:3000/api/policy-validation';assert.equal((await fetch(path)).status,401);
 for(const role of ['reviewer','admin','advisor']){const token=(await login(role,demonstrationPassword(role))).access_token;const r=await fetch(path,{headers:{Authorization:'Bearer '+token}});assert.equal(r.status,role==='reviewer'?403:200);if(r.ok){const body=await r.json();assert(body.passed);assert.equal(body.clinicalValidation,false);assert.equal(body.results.length,19);}}
});
