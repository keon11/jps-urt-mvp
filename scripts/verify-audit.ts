import {pool} from '../services/api/src/db.js';
import {hash} from '../services/api/src/fixtures.js';
const {rows}=await pool.query('SELECT * FROM audit ORDER BY sequence');
let previous='GENESIS';
for(const row of rows){
 const computed=hash({caseId:row.case_id,actor:row.actor,action:row.action,detail:row.detail,at:row.at.toISOString(),previous});
 if(row.previous_hash!==previous||row.hash!==computed){await pool.end();throw new Error('Audit integrity failure at sequence '+row.sequence);}
 previous=row.hash;
}
console.log(JSON.stringify({verified:true,events:rows.length,lastHash:previous,checkedAt:new Date().toISOString()},null,2));
await pool.end();
