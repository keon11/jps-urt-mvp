import {test} from 'node:test';
import assert from 'node:assert/strict';
import {config} from '../src/config.js';
test('default services are local and FHIR R4 adapters have separate endpoints',()=>{
 for(const u of [config.medplum,config.cqf,config.keycloak,config.modelUrl]) assert.equal(new URL(u).hostname,'localhost');
 assert.notEqual(config.medplum,config.cqf);
});

import {toCqfBundle} from '../src/adapters.js';
test('CQF adapter removes proprietary metadata without losing source version or changing the snapshot',()=>{
 const data:any={resourceType:'Bundle',type:'collection',entry:[{resource:{resourceType:'Patient',id:'synthetic',meta:{versionId:'version-1',project:'internal-project',compartment:['internal'],tag:[{code:'synthetic'}]}}}]};
 const converted:any=toCqfBundle(data);
 assert.equal(converted.entry[0].resource.meta.versionId,'version-1');assert.equal(converted.entry[0].resource.meta.project,undefined);assert.equal(converted.entry[0].resource.meta.compartment,undefined);assert.equal(data.entry[0].resource.meta.project,'internal-project');
});
