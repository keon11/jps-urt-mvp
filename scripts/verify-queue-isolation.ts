/** Real queue reads plus an idempotent internal draft request; no publication/FHIR write. */
import assert from 'node:assert/strict';import{writeFile}from'node:fs/promises';
import{isolatedContext,startApi,stopApi,closeOriginal}from'./reliability-context.js';
import{login}from'../services/api/src/adapters.js';import{demonstrationPassword}from'../tests/browser/local-account.js';
const c=await isolatedContext();let child:any;const result:any={at:new Date().toISOString(),scope:'25 concurrent read streams, one synthetic reviewer token, internal draft proposal/retry; global clinical pool retained, no insurer/patient-status modification'};
try{
 child=await startApi(c.dsn,false);const token=(await login('reviewer',demonstrationPassword())).access_token;const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const get=async(path:string)=>{const r=await fetch('http://127.0.0.1:3010/api/'+path,{headers,signal:AbortSignal.timeout(5000)});assert.equal(r.status,200);return r.json();};
 const before=await get('policy-center');let reads=0,errors=0;const until=performance.now()+20000;
 const workers=Promise.all(Array.from({length:25},(_,i)=>(async()=>{let n=0;while(performance.now()<until){try{await get('encounter-worklist?limit=50&offset='+((i*31+n++*50)%9950));reads++;}catch{errors++;}}})()));
 await new Promise(r=>setTimeout(r,1000));const eventId=crypto.randomUUID();const body={documentId:before.registry.active_document==='synthetic-1'?'synthetic-2':'synthetic-1',reason:'documentation-requirement-update',eventId};
 const post=async()=>{const r=await fetch('http://127.0.0.1:3010/api/policy-changes',{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});assert.equal(r.status,200);return r.json();};
 const begin=performance.now(),first=await post();result.writerLatencyMs=performance.now()-begin;assert.equal(first.state,'draft');assert.deepEqual(await post(),first);await workers;
 const after=await get('policy-center');assert.deepEqual(after.registry,before.registry);const n=await c.db.query('SELECT count(*)::int AS n FROM governance_commands WHERE id=$1',[eventId]);assert.equal(n.rows[0].n,1);assert.equal(errors,0);assert(reads>0);
 Object.assign(result,{readRequests:reads,readErrors:errors,duplicateReturnedSameResult:true,committedLogicalCommands:1,registryUnchanged:true,proposalState:first.state,passed:true});
}catch(e){result.passed=false;result.error=(e as Error).message;process.exitCode=1;}finally{if(child)await stopApi(child);await c.db.end();await closeOriginal();await writeFile('artifacts/issue-5/queue-isolation.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));}
