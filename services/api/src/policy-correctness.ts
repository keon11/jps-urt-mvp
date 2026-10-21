import {z} from 'zod';
import {hash} from './fixtures.js';
import corpus from '../../../fixtures/validation/golden-v1.json';
const day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const t=Date.parse(v+'T00:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===v;});
const digest=z.string().regex(/^[a-f0-9]{64}$/);
export const candidateRule=z.object({id:z.string().min(1),version:z.string().min(1),synthetic:z.literal(true),approved:z.boolean(),sourceUrl:z.string(),sourceHash:digest,verifiedSourceHash:digest,effectiveDate:day,endDate:day.nullable(),plans:z.array(z.string().min(1)).min(1),requirement:z.enum(['physician-note','authorization-receipt']),exceptions:z.array(z.string()),ambiguous:z.boolean()}).strict().refine(r=>!r.endDate||r.endDate>=r.effectiveDate);
const contextSchema=z.object({asOf:day,plan:z.string().min(1),evidence:z.enum(['present','missing','unknown']),sourceHash:digest,assessedSourceHash:digest,exception:z.string().nullable()}).strict();
export function evaluateCandidate(rules:unknown,context:unknown){
 const result=(outcome:string,reason:string,selected:z.infer<typeof candidateRule>[] =[])=>({outcome,reason,requiresHumanReview:true,coverageDetermination:false,syntheticOnly:true,engineVersion:'1.0.0',citations:selected.map(r=>({id:r.id,version:r.version,url:r.sourceUrl,sha256:r.sourceHash})),inputHash:hash({rules,context})});
 const c=contextSchema.safeParse(context);if(!c.success)return result('review','missing-context');
 const parsed=z.array(candidateRule).min(1).safeParse(rules);if(!parsed.success)return result('review','unverified-policy');
 const applicable=parsed.data.filter(r=>r.plans.includes(c.data.plan)&&r.effectiveDate<=c.data.asOf&&(!r.endDate||r.endDate>=c.data.asOf));
 if(!applicable.length)return result('review','no-applicable-policy');
 if(applicable.some(r=>!r.approved))return result('review','unapproved-policy',applicable);
 if(applicable.some(r=>!r.sourceUrl||r.sourceHash!==r.verifiedSourceHash))return result('review','unverified-policy',applicable);
 if(applicable.some(r=>r.ambiguous))return result('review','ambiguous-policy',applicable);
 if(new Set(applicable.map(r=>JSON.stringify([r.requirement,[...r.exceptions].sort()]))).size>1)return result('review','conflicting-policy',applicable);
 if(c.data.sourceHash!==c.data.assessedSourceHash)return result('review','stale-evidence',applicable);
 if(c.data.exception)return applicable.every(r=>r.exceptions.includes(c.data.exception!))?result('exception','explicit-exception',applicable):result('review','unverified-exception',applicable);
 if(c.data.evidence==='unknown')return result('review','uncertain-evidence',applicable);
 return c.data.evidence==='missing'?result('needs-information','missing-evidence',applicable):result('complete','supported',applicable);
}
export function correctnessReport(){
 const results=corpus.cases.map(c=>({id:c.id,expected:c.expected,actual:evaluateCandidate(c.rules,c.context)}));
 const positive=(o:string)=>o==='complete'||o==='exception';
 let tp=0,fp=0,tn=0,fn=0;
 for(const r of results){const expected=positive(r.expected.outcome),actual=positive(r.actual.outcome);if(expected&&actual)tp++;else if(actual)fp++;else if(expected)fn++;else tn++;}
 const ratio=(a:number,b:number)=>b?a/b:null;
 return {corpusVersion:corpus.version,corpusHash:hash(corpus),labeling:corpus.labeling,clinicalValidation:false,scope:'Synthetic allow-to-proceed classification only. Same-author acceptance labels, no clinical accuracy estimate.',results,metrics:{tp,fp,tn,fn,precision:ratio(tp,tp+fp),recall:ratio(tp,tp+fn),sensitivity:ratio(tp,tp+fn),specificity:ratio(tn,tn+fp)},passed:results.every(r=>r.expected.outcome===r.actual.outcome&&r.expected.reason===r.actual.reason)};
}
