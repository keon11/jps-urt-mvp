import {initDb,pool} from '../services/api/src/db.js';
import {intake,transaction,audit} from '../services/api/src/store.js';
import {fixtureIds,makeFixture} from '../services/api/src/fixtures.js';
import {assess} from '../services/api/src/review.js';
import {fhirClient} from '../services/api/src/adapters.js';
const actor={id:'demo-preparer',name:'synthetic-demo-preparer',roles:['admin']};
await initDb();
for(const id of fixtureIds){
 await intake(makeFixture(id),'demo-seed-'+id,actor);
 if(process.argv.includes('--reset'))await transaction(async tx=>{
  const row=(await tx.query('SELECT * FROM cases WHERE id=$1 FOR UPDATE',[id])).rows[0];
  const bundle=makeFixture(id),client=await fhirClient();await client.executeBatch(bundle);
  const resources=await Promise.all(bundle.entry!.map(e=>client.readResource(e.resource!.resourceType as any,e.resource!.id!)));
  const snapshot={resourceType:'Bundle',type:'collection',meta:bundle.meta,entry:resources.map(resource=>({resource}))};
  const workflow={state:'new',authorization:'not-submitted',notifications:[],events:[],humanDecision:null,escalation:null};
  await audit(tx,id,actor.name,'synthetic-demo-reset',{previousWorkflow:row.workflow,previousAssessment:row.assessment,restoredFixture:id,note:'Prior FHIR versions and all audit events preserved.'});
  await tx.query('UPDATE cases SET bundle=$2,workflow=$3,assessment=NULL,updated_at=now() WHERE id=$1',[id,snapshot,workflow]);
 });
 const row=(await pool.query('SELECT * FROM cases WHERE id=$1',[id])).rows[0];
 if(!row.assessment||row.assessment.triageStale){const result=await assess(id,actor,id==='continued-stay'?'continued-stay':'initial');console.log(id,result.assessment.recommendation,result.assessment.ai.mode);}
 else console.log(id,'current assessment preserved');
}
await pool.end();
