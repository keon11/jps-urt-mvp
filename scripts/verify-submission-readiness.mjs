// Preparation gate only. It never submits, signs, sends or accepts terms.
import fs from 'node:fs/promises';import assert from'node:assert/strict';
const template={version:'1.0.0',classification:'OWNER INPUT REQUIRED; NO LEGAL OR CLINICAL ATTESTATION',legalEntity:null,authorizedSignatory:null,threeReferences:null,pricingExhibitA:null,insuranceEvidence:null,clinicalReviewerSignoff:null,payerAgreements:null,jpsEpicPermission:null,securityRiskAssessment:null,latestAddendaReview:null,hubOutreachEvidence:null};
await fs.mkdir('docs/submission',{recursive:true});try{await fs.writeFile('docs/submission/owner-input-template.json',JSON.stringify(template,null,2)+'\n',{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
const supplied=JSON.parse(await fs.readFile('docs/submission/owner-input-template.json','utf8'));
const required=Object.entries(supplied).filter(([k])=>!['version','classification'].includes(k)).map(([k,v])=>({field:k,status:v===null?'EXTERNAL VALIDATION REQUIRED':'requires evidence review'}));
assert.deepEqual(Object.keys(supplied).sort(),Object.keys(template).sort(),'Owner template schema changed; review required');
const result={at:new Date().toISOString(),engineeringPreparationOnly:true,readyToSubmit:false,submitted:false,signed:false,requirements:required,reason:'Owner/company/clinical/contract/security facts unavailable; no defaults invented.'};
await fs.writeFile('artifacts/issue-4/submission-readiness.json',JSON.stringify(result,null,2)+'\n');console.log('Prepared owner template; submission readiness is BLOCKED on',required.length,'owner evidence items. No bid submitted.');
