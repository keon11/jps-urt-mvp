import {test} from 'node:test';import assert from 'node:assert/strict';
import {correctnessReport,evaluateCandidate} from '../src/policy-correctness.js';
test('versioned independently specified synthetic expectations match candidate evaluator',()=>{const r=correctnessReport();assert.equal(r.results.length,19);assert(r.passed,JSON.stringify(r.results.filter(s=>s.actual.outcome!==s.expected.outcome)));assert.equal(r.metrics.fp,0);assert.equal(r.metrics.fn,0);assert.equal(r.clinicalValidation,false);});
test('malformed input fails closed with human review and never represents coverage',()=>{for(const value of [null,{},[],{plan:'real'}]){const r=evaluateCandidate(value,value);assert.equal(r.outcome,'review');assert.equal(r.requiresHumanReview,true);assert.equal(r.coverageDetermination,false);}});

import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import corpus from '../../../fixtures/validation/golden-v1.json';
test('golden policy citations identify the owned specification bytes, not unrelated clinical evidence',()=>{const bytes=readFileSync('fixtures/validation/policy-spec-v1.json');const digest=createHash('sha256').update(bytes).digest('hex');for(const c of corpus.cases)for(const rule of c.rules){assert.equal(rule.sourceHash,digest);assert.equal(rule.sourceUrl,c.id==='missing-source'?'':'urn:ur-demo:validation:policy-spec:v1');}});
