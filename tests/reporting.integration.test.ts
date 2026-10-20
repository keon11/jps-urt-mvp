import {test} from 'node:test';import assert from 'node:assert/strict';import pg from 'pg';
import {login,jsonFetch} from '../services/api/src/adapters.js';
const base='http://localhost:3000';
test('reports match persisted cases and Prometheus exposition serves real counts',async()=>{
 const t=await login('reviewer','Synthetic-demo-only-2026!');const headers={Authorization:'Bearer '+t.access_token};
 const r=await jsonFetch(base+'/api/reports',{headers}),cases=await jsonFetch(base+'/api/cases',{headers});
 const scores=cases.map((c:any)=>c.assessment?.triageStale?0:c.assessment?.priority||0);assert.ok(scores.every((v:number,i:number)=>i===0||scores[i-1]>=v),'Queue must be sorted by current priority');
 assert.equal(r.total,cases.length);assert.equal(Object.values(r.statusMix).reduce((a:any,b:any)=>a+b,0),cases.length);assert.ok(r.disclaimer.includes('fictional'));
 const m=await(await fetch(base+'/metrics')).text();assert.match(m,new RegExp('ur_cases\\{category="total"\\} '+cases.length));
 const spec=await jsonFetch(base+'/api/openapi.json',{headers});assert.equal(spec.openapi,'3.1.0');assert.ok(spec.paths['/cases/{id}/decisions']);
});
test('Grafana account can read only aggregate view, not source records or audit',async()=>{
 const client=new pg.Client({connectionString:'postgres://ur_metrics:synthetic-metrics-local-only@localhost:5433/ur'});await client.connect();
 try{const r=await client.query('SELECT * FROM ur_operational_metrics');assert.equal(r.rows[0].active_encounters,6);await assert.rejects(client.query('SELECT * FROM cases'),/permission denied/);await assert.rejects(client.query('SELECT * FROM audit'),/permission denied/);}finally{await client.end();}
});
test('actual Grafana datasource queries the provisioned operational dashboard',async()=>{
 const headers={Authorization:'Basic '+Buffer.from('demo-admin:synthetic-grafana-local-only').toString('base64'),'Content-Type':'application/json'};
 const health=await jsonFetch('http://localhost:3001/api/datasources/uid/ur-postgres/health',{headers});assert.equal(health.status,'OK',JSON.stringify(health));
 const board=await jsonFetch('http://localhost:3001/api/dashboards/uid/ur-synthetic-operations',{headers});assert.equal(board.dashboard.panels.length,7);
 const data=await jsonFetch('http://localhost:3001/api/ds/query',{method:'POST',headers,body:JSON.stringify({from:String(Date.now()-3600000),to:String(Date.now()),queries:[{refId:'A',datasource:{uid:'ur-postgres',type:'postgres'},format:'table',rawSql:'SELECT active_encounters FROM ur_operational_metrics;'}]})});
 assert.equal(data.results.A.status,200,JSON.stringify(data.results));assert.equal(data.results.A.frames[0].data.values[0][0],6);
});
