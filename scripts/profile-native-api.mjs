// Built-in Node/V8 inspector. Only the isolated, read-only synthetic API is eligible.
import fs from 'node:fs/promises';import{execFileSync}from'node:child_process';import assert from'node:assert/strict';
const label=process.argv[2];assert(['baseline','optimized','optimized-budgeted'].includes(label));
const pid=Number(execFileSync('fuser',['-n','tcp','3010'],{stdio:['ignore','pipe','ignore'],encoding:'utf8'}).trim());assert(Number.isInteger(pid)&&pid>1);
assert((await fs.readFile('/proc/'+pid+'/environ','utf8')).split('\0').includes('BENCHMARK_READ_ONLY=true'));
process.kill(pid,'SIGUSR1');let list;
for(let i=0;i<30;i++){try{list=await(await fetch('http://127.0.0.1:9229/json/list')).json();break;}catch{await new Promise(r=>setTimeout(r,100));}}
assert(list?.length===1);const url=new URL(list[0].webSocketDebuggerUrl);assert(['127.0.0.1','localhost'].includes(url.hostname));
const ws=new WebSocket(url),pending=new Map();let next=0;await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
ws.onmessage=e=>{const m=JSON.parse(String(e.data));const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
await fs.mkdir('artifacts/issue-5/'+label,{recursive:true});
const startedAt=new Date().toISOString();
try{
 await call('Profiler.enable');await call('Profiler.start');
 await call('Runtime.evaluate',{expression:"(()=>{const m=process.getBuiltinModule('node:perf_hooks');globalThis.__urPerfLoop=m.monitorEventLoopDelay({resolution:10});globalThis.__urPerfLoop.enable();return true})()",awaitPromise:true,returnByValue:true});
 await new Promise(r=>setTimeout(r,30000));
 const loop=await call('Runtime.evaluate',{expression:'(()=>{const m=globalThis.__urPerfLoop;m.disable();const x={p50Ms:m.percentile(50)/1e6,p95Ms:m.percentile(95)/1e6,p99Ms:m.percentile(99)/1e6,maxMs:m.max/1e6};delete globalThis.__urPerfLoop;return x})()',returnByValue:true});
 assert(!loop.exceptionDetails&&loop.result?.value,'Actual event-loop metrics required');
 const {profile}=await call('Profiler.stop');
 await fs.writeFile('artifacts/issue-5/'+label+'/native-api.cpuprofile',JSON.stringify(profile)+'\n');
 const functions=new Map();for(const n of profile.nodes)functions.set(n.id,n.callFrame.functionName+' @ '+n.callFrame.url);
 const hits={};for(const id of profile.samples??[]){const name=functions.get(id);hits[name]=(hits[name]??0)+1;}
 await fs.writeFile('artifacts/issue-5/'+label+'/native-profile-summary.json',JSON.stringify({startedAt,endedAt:new Date().toISOString(),seconds:(profile.endTime-profile.startTime)/1e6,eventLoop:loop.result.value,topSampleCounts:Object.entries(hits).sort((a,b)=>b[1]-a[1]).slice(0,20),scope:'30s sampled V8 profile/event-loop delay during 25-session load; inspector overhead present in both runs; no token/clinical variable capture'},null,2)+'\n');
 console.log('Captured native V8 CPU and event-loop proof:',label);
}finally{
 await call('Runtime.evaluate',{expression:"setTimeout(()=>{try{process.getBuiltinModule('node:inspector').close()}catch{}},100);true",returnByValue:true}).catch(()=>{});ws.close();
}
