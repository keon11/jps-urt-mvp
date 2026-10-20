import {initDb,pool} from '../services/api/src/db.js';
import {intake} from '../services/api/src/store.js';
import {fixtureIds,makeFixture} from '../services/api/src/fixtures.js';
await initDb();
for(const id of fixtureIds){const r=await intake(makeFixture(id),'seed-'+id,{id:'seed',name:'synthetic-seeder',roles:['admin']});console.log(id,r.duplicate?'already exists':'ingested');}
await pool.end();
