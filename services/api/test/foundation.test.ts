import {test} from 'node:test';
import assert from 'node:assert/strict';
import {config} from '../src/config.js';
test('default services are local and FHIR R4 adapters have separate endpoints',()=>{
 for(const u of [config.medplum,config.cqf,config.keycloak,config.ollama]) assert.equal(new URL(u).hostname,'localhost');
 assert.notEqual(config.medplum,config.cqf);
});
