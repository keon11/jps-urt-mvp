"""Inventory every retained RFP paragraph with source-exact engineering dispositions.
No coverage percentage implies legal compliance or independently validated capability.
"""
from pathlib import Path
import json,re,hashlib,csv,io
root=Path(__file__).resolve().parent.parent;out=root/'docs/submission';artifact=root/'artifacts/phase-6'
source=root/'docs/sources/rfp.txt';lines=source.read_text().splitlines();prov=json.loads((root/'docs/sources/provenance.json').read_text());fresh=json.loads((artifact/'official-source-refresh.json').read_text());assert fresh['retrieved']
for p in prov:assert any(a.get('sha256')==p['sha256'] and a['url']==p['url'] for a in fresh['attachments']),'Retained source changed: review new original before generating matrix'
features=[
 ('priorit|worklist','Partial synthetic demonstration','services/api/src/worklist.ts','Prioritized local queue and evidence-linked scoring; no clinically calibrated model or Epic-fed production queue.'),
 ('continued.stay','Synthetic demonstration','services/api/src/review.ts','Illustrative latest-source reassessment only; approved longitudinal criteria/clinical validation required.'),
 ('inpatient|observation|admission status','Partial synthetic demonstration','services/api/src/review.ts','Advisory synthetic encounter review; source patient status preserved. Approved criteria and clinical validation outstanding.'),
 ('denial|appeal','Partial synthetic workflow flags','services/api/src/denial-risk.ts','Missing evidence distinguished from violation. No calibrated denial prediction, appeal outcomes or actual insurer agreement.'),
 ('authorization|notification|payer','Partial synthetic demonstration','services/api/src/workflow.ts','Simulated tracking and internal next-step actions only; no real payer exchange/private contracts.'),
 ('physician|escalat','Synthetic demonstration','services/api/src/workflow.ts','Local advisor queue and reasoned human decisions; hospital-approved staffing/escalation workflow required.'),
 ('role.based|permission|workflow.*configur|configurable.*workflow','Partial synthetic demonstration','services/api/src/policy-governance.ts','Server-side roles, isolated pending changes, authorized publish/rollback; JPS role mapping/delegation and production configuration outstanding.'),
 ('audit|override|lineage|source.data|explain','Partial synthetic demonstration','services/api/src/store.ts','Source/version explanations and chained local audit tested; no independent immutable retention certification.'),
 ('dashboard|report|metric|performance monitoring','Partial synthetic reporting','services/api/src/reporting.ts','Current synthetic counts/illustrative deadlines; real outcome feeds, financial impact and calibrated AI performance not established.'),
 ('Epic|ADT|bidirectional|HL7|FHIR|integrat|data exchange','Synthetic transport/conformance only','services/api/src/epic-sandbox.ts','Read-only FHIR adapter/local conformance; no authenticated Epic/JPS integration, certified ADT, bidirectional writeback or hospital reconciliation.'),
 ('availability|disaster|recovery|service.level|reliable|scalab|high.perform','Local engineering evidence; production work required','docs/ISSUE-5-REPORT.md','Single-host benchmarks/recovery/restore; residual timeouts. No HA, coordinated DR, contractual SLA or hospital-capacity proof.'),
 ('model|AI.*govern|fairness|bias|drift','Partial model governance; clinical validation required','docs/model-lock.json','Pinned local model, labels/fallback/audit; no independent accuracy, drift/fairness or representative evaluation.'),
 ('HIPAA|HITECH|Business Associate|encrypt|security|confidentiality|secure authent|session management|least.privilege|retention|penetration|incident|SOC 2|HITRUST|ISO 27001','Security/legal approval required','docs/SECURITY-AND-PRODUCTION-GAPS.md','Local synthetic isolation/RBAC are not HIPAA compliance, enterprise encryption/SSO/MFA, BAA or security certification.'),
 ('training|go.live|adoption|support procedures|upgrade','Future service delivery','docs/submission/IMPLEMENTATION-ROADMAP.md','Demo instructions exist; no JPS training, go-live, staffed support or upgrade/SLA service delivered.')]
# Existing module name verified below; no invented evidence path.
features=[(a,b,('services/api/src/fhir-conformance.ts' if c.endswith('epic-sandbox.ts') else c),d) for a,b,c,d in features]
rows=[]
for n,line in enumerate(lines,1):
 if not line.strip():continue
 text=line.strip();kind='Context / source structure';status='Source context; no compliance assertion';evidence='docs/sources/rfp.txt';gap='Read with surrounding paragraphs and official DOCX; not an acceptance or contractual statement.';owner='Founder/legal review'
 if 120<=n<=213:
  kind='Business / technical requirement'
  status='Future production work / external approval';evidence='docs/submission/IMPLEMENTATION-ROADMAP.md';gap='Not established by synthetic software; authorized implementation and hospital acceptance required.';owner='Engineering + hospital/clinical authority'
  for pattern,st,ev,g in features:
   if re.search(pattern,text,re.I):status,evidence,gap=st,ev,g;break
  if 132<=n<=153:
   kind='Required operational metric';status='Partial synthetic metric / real outcome validation required';evidence='services/api/src/reporting.ts';gap='Current counts/illustrative timeliness only. Production denominator, retrospective cohorts, discharge-before-review, mean review delays, PA turnaround, denials/appeals and AI outcome validation are not fully implemented.'
  if 'shall not autonomously change patient status' in text:
   status='Implemented synthetic safety boundary';evidence='services/api/src/workflow.ts';gap='No external patient status or payer action permitted; JPS workflow/legal approval still required.'
 elif re.search(r'\b(must|shall|required|requires|provide|submit|signed|signing|warrants|certif|respondent|vendor|contract|deadline|Exhibit|HUB|Good Faith|pricing|price quotes|references)\b',text,re.I) or n>=218:
  kind='Administrative / commercial / legal requirement or form field';status='Owner completion / approval required';evidence='docs/submission/OWNER-CHECKLIST.md';gap='No company fact, signature, price, contract acceptance or filing supplied. Owner must review original wording/applicability.'
  if 299<=n<=310 or n in [275,276,280,281,284,287,290,294,295,297,300]:kind='Source structure / evaluator or blank field'
  if n in [14,73,87]:gap='Original deadline is superseded by retained Addendum 1: November 3, 2026, 2:00 p.m. CST as written. Recheck current addenda.'
  if 'Exhibit E' in text:status='Not utilized per RFP';gap='No Exhibit E response required by retained source; owner must verify later amendments.'
  if 'Form 1295' in text:gap='RFP says no action until award/contract ready and tracking number assigned; no premature filing.'
 assert (root/evidence).exists(),evidence
 facets=[{'topic':pattern,'status':st,'evidence':ev,'gap':g} for pattern,st,ev,g in features if 120<=n<=213 and re.search(pattern,text,re.I)]
 rows.append({'facets':facets,'id':f'RFP-L{n:03d}','kind':kind,'status':status,'evidence':evidence,'gap':gap,'owner':owner,'citation':{'file':'docs/sources/rfp.txt','line':n,'quote':line,'sentences':[v for v in re.split(r'(?<=[.;!?])\s+(?=[A-Z])',text) if v]},'sourceSha256':prov[0]['sha256']})
assert {r['citation']['line'] for r in rows}=={n for n,l in enumerate(lines,1) if l.strip()}
result={'classification':'DRAFT ENGINEERING TRACEABILITY; NOT LEGAL COMPLIANCE OR A BID','coverageUnit':'Every nonempty retained source paragraph/line, with sentence subclauses preserved. Background, evaluator fields and form fields separately classified; owner must review all legal/compound clauses.','sourceUrl':prov[0]['url'],'sourceSha256':prov[0]['sha256'],'extractedTextSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceLines':len(lines),'nonemptyLinesCovered':len(rows),'unmappedNonemptyLines':0,'deadlinePrecedence':{'source':'docs/sources/addendum.txt','originalSha256':prov[1]['sha256'],'deadlineAsWritten':'November 3, 2026, at 2:00 p.m. CST','acknowledged':False,'signed':False},'requirements':rows}
(out/'PHASE-6-TRACEABILITY.json').write_text(json.dumps(result,indent=2)+'\n')
def escape(s):return s.replace('|','\\|').replace('\n',' ')
md='# Phase 6 complete source-paragraph traceability — DRAFT\n\nEvery nonempty retained RFP paragraph is inventoried, including source structure, forms and evaluator fields. This is engineering traceability, not a finding of legal compliance. All matching capability facets and sentence subclauses, exact quotes and source hashes are in [JSON](PHASE-6-TRACEABILITY.json). The official DOCX and owner/counsel review govern ambiguous compound obligations. No implemented status implies production/clinical acceptance. Addendum 1 supersedes original deadline references; no addendum signed.\n\n| ID / source line | Requirement / exact source | Disposition | Evidence | Remaining gap / owner |\n|---|---|---|---|---|\n'
for r in rows:md+='| '+ ' | '.join([r['id'],escape(r['citation']['quote']),escape(r['status']),f"[Evidence](../../{r['evidence']})",escape(r['gap']+' Owner: '+r['owner'])])+' |\n'
(out/'PHASE-6-TRACEABILITY.md').write_text(md)
(artifact/'traceability-verification.json').write_text(json.dumps({k:v for k,v in result.items() if k!='requirements'},indent=2)+'\n')
print(f'PASS: {len(rows)} exact source-paragraph citations, zero unmapped nonempty lines; dispositions remain draft and external obligations unaccepted.')
