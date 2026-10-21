import {writeFile,mkdir} from 'node:fs/promises';
import {correctnessReport} from '../services/api/src/policy-correctness.js';
const result=correctnessReport();await mkdir('artifacts/issue-3',{recursive:true});await writeFile('artifacts/issue-3/policy-correctness.json',JSON.stringify({...result,at:new Date().toISOString()},null,2)+'\n');
console.log(JSON.stringify({passed:result.passed,cases:result.results.length,metrics:result.metrics,clinicalValidation:false}));if(!result.passed)process.exitCode=1;
