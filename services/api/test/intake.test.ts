import {test} from 'node:test';import assert from 'node:assert/strict';
import {makeFixture,fixtureIds,validateFixture,hash} from '../src/fixtures.js';
test('all fixtures are synthetic with linked FHIR transaction resources',()=>{
 for(const id of fixtureIds){const b=makeFixture(id);assert.equal(validateFixture(b),b);assert.equal(b.type,'transaction');assert.equal(b.entry?.filter(e=>e.resource?.resourceType==='Patient').length,1);assert.ok(b.entry?.every(e=>e.resource?.meta?.tag?.[0].code==='synthetic'));}
});
test('intake rejects altered bundles, missing markers and unknown payloads',()=>{
 const b=makeFixture('respiratory');(b.entry![0].resource as any).name[0].family='Realname';assert.throws(()=>validateFixture(b));assert.throws(()=>validateFixture({}));assert.throws(()=>validateFixture(null));
});
test('canonical digest tolerates JSON key order, not modified clinical values',()=>{
 const b=makeFixture('observation');assert.equal(hash(b),hash(Object.fromEntries(Object.entries(b).reverse())));const c=structuredClone(b);(c.entry![4].resource as any).valueQuantity.value=82;assert.notEqual(hash(b),hash(c));
});
