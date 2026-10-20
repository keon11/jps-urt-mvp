import {test} from 'node:test';import assert from 'node:assert/strict';
import {authTransition,validateDecision,operational} from '../src/workflow.js';import {makeFixture} from '../src/fixtures.js';
test('authorization lifecycle handles pending, denial retry, partial approval and expiry',()=>{
 assert.equal(authTransition('not-submitted','submit'),'submitted');assert.equal(authTransition('submitted','payer-response','pending-information'),'pending-information');assert.equal(authTransition('pending-information','submit'),'submitted');assert.equal(authTransition('submitted','payer-response','partial-approved'),'partial-approved');assert.equal(authTransition('partial-approved','simulate-expiry'),'expired');assert.equal(authTransition('denied','submit'),'submitted');
 for(const [s,a]of [['approved','submit'],['not-submitted','payer-response'],['denied','simulate-expiry']])assert.throws(()=>authTransition(s,a,'approved'));
});
test('advisor overrides require an explicit reason, escalation and current evidence',()=>{
 const row={workflow:{state:'escalated'},assessment:{recommendation:'Inpatient review suggested'}};
 assert.throws(()=>validateDecision(row,{disposition:'Observation',reason:'evidence-supports-recommendation'}));
 assert.doesNotThrow(()=>validateDecision(row,{disposition:'Observation',reason:'clinical-judgment-override'}));
 assert.doesNotThrow(()=>validateDecision(row,{disposition:'Request more information',reason:'additional-documentation-required'}));
 assert.throws(()=>validateDecision({...row,assessment:{...row.assessment,triageStale:true}},{disposition:'Inpatient',reason:'evidence-supports-recommendation'}));
 assert.throws(()=>validateDecision({...row,workflow:{state:'new'}},{disposition:'Inpatient',reason:'evidence-supports-recommendation'}));
});
test('illustrative notification clock marks late cases and respects logged notifications',()=>{
 const row={bundle:makeFixture('authorization'),workflow:{notifications:[]},assessment:null};
 assert.equal(operational(row).operational.notificationOverdue,true);
 assert.equal(operational({...row,workflow:{notifications:[{}]}}).operational.notificationOverdue,false);
});
