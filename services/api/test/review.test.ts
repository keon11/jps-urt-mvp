import {test} from 'node:test';import assert from 'node:assert/strict';
import {facts,clinicalResult,localTriage} from '../src/review.js';import {makeFixture} from '../src/fixtures.js';
test('illustrative respiratory threshold and mismatch raise queue priority',()=>{
 const f=facts(makeFixture('respiratory')),r=clinicalResult(f,true,true,'not-submitted');
 assert.equal(r.recommendation,'Inpatient review suggested');assert.ok(r.baselinePriority>=70);assert.ok(r.signals.some(s=>s.code==='status-mismatch'));
});
test('stable inpatient case prompts observation and continued-stay reassessment',()=>{
 const r=clinicalResult(facts(makeFixture('observation')),false,false,'approved');assert.equal(r.recommendation,'Observation review suggested');assert.equal(r.continuedStay,'Reassess continued-stay need');assert.equal(r.denialRisk.probability,null);
});
test('missing, stale, future and wrong-unit vitals prevent a clinical recommendation',()=>{
 for(const mode of ['missing','stale','future','units']){
  const b=makeFixture('respiratory');const o=b.entry![4].resource as any;
  if(mode==='missing')b.entry!.splice(4,1);if(mode==='stale')o.effectiveDateTime='2026-10-01T00:00:00Z';if(mode==='future')o.effectiveDateTime='2030-10-01T00:00:00Z';if(mode==='units')o.valueQuantity.code='mg';
  const f=facts(b);assert.ok(f.missing.length);assert.equal(clinicalResult(f,false,false,'approved').recommendation,'Insufficient evidence');
 }
});
test('missing physician documentation raises illustrative risk',()=>{const r=clinicalResult(facts(makeFixture('documentation')),false,true,'not-submitted');assert.equal(r.denialRisk.label,'Elevated illustrative risk');});
test('unavailable model is explicitly labeled as rules-only fallback',async()=>{const r=await localTriage({baselinePriority:20,signals:[],evidence:['Observation/test']},'http://127.0.0.1:1');assert.equal(r.mode,'rules-fallback');assert.equal(r.adjustment,0);});
test('model responses with fabricated evidence are rejected',async()=>{
 const {createServer}=await import('node:http');
 const server=createServer((_req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:JSON.stringify({urgency:'urgent',rationaleCode:'routine',evidence:['Observation/fabricated']})}}]}));});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const port=(server.address() as import('node:net').AddressInfo).port;const result=await localTriage({baselinePriority:20,signals:[],evidence:['Observation/known']},'http://127.0.0.1:'+port);assert.equal(result.mode,'rules-fallback');assert.equal(result.adjustment,0);}finally{await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});
