"""Retrieve permitted public blank forms; draft sidecars only, never fill/sign/submit originals."""
from pathlib import Path
from hashlib import sha256
from urllib.parse import urlparse
import subprocess,json,zipfile,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent.parent;p=root/'artifacts/issue-4';p.mkdir(parents=True,exist_ok=True)
discovery=json.loads((p/'rfp-attachment-discovery.json').read_text());assert discovery['retrieved']
forms=[];draft=[]
for a in discovery['attachments']:
 if not any(k in a['label'] for k in ['Exhibit A','Exhibit C','Exhibit G','Exhibt G']):continue
 assert a['robotsPermitted'] and urlparse(a['url']).hostname=='www.jpshealthnet.org'
 kind='pricing' if 'Exhibit A' in a['label'] else 'terms' if 'Exhibit C' in a['label'] else 'ai' if 'for AI' in a['label'] else 'security'
 path=root/'.runtime/official-forms'/(kind+Path(urlparse(a['url']).path).suffix)
 path.parent.mkdir(parents=True,exist_ok=True)
 subprocess.run(['curl','--fail','--silent','--show-error','--proto','=https','--max-time','30','--max-filesize','10000000','-o',str(path),a['url']],check=True)
 raw=path.read_bytes();record={'kind':kind,'url':a['url'],'sha256':sha256(raw).hexdigest(),'originalPrivatePath':str(path.relative_to(root)),'filled':False,'signed':False,'termsAccepted':False}
 with zipfile.ZipFile(path) as z:
  assert sum(i.file_size for i in z.infolist())<25000000,'Unexpected decompressed form size'
  if kind in ['ai','security']:
   xml=ET.fromstring(z.read('word/document.xml'));ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
   rows=[]
   for row in xml.findall('.//w:tr',ns):
    cells=[' '.join(t.text or '' for t in cell.findall('.//w:t',ns)).strip() for cell in row.findall('./w:tc',ns)]
    if any(cells):rows.append(cells)
   paragraphs=[' '.join(t.text or ''for t in para.findall('.//w:t',ns)).strip() for para in xml.findall('.//w:body/w:p',ns)]
   record['extractedTableRows']=rows;record['paragraphs']=[v for v in paragraphs if v]
  elif kind=='pricing':record['workbookEntries']=[n for n in z.namelist() if n.startswith('xl/worksheets/') and n.endswith('.xml')]
 forms.append(record)
(p/'official-forms-inventory.json').write_text(json.dumps({'classification':'Public blank forms retrieved, not completed or submitted','forms':forms},indent=2)+'\n')
header='# Official blank form inventory — owner completion required\n\nBlank originals were retrieved from permitted official links without modifying or accepting terms. Original bytes remain private under .runtime/official-forms; rerun `python3 scripts/prepare-official-forms.py` to retrieve them. Nothing is filled, signed or submitted. Do not use the internal pricing CSV instead of official Exhibit A.\n\n| Form | Official source | SHA-256 | Owner action |\n|---|---|---|---|\n'
for f in forms:header+=f"| {f['kind']} | [Download]({f['url']}) | {f['sha256']} | {'Complete actual prices in original format' if f['kind']=='pricing' else 'Authorized legal review; no terms accepted' if f['kind']=='terms' else 'Review evidence and complete official questionnaire'} |\n"
(root/'docs/submission/OFFICIAL-FORMS.md').write_text(header)
for f in forms:
 if f['kind']not in ['ai','security']:continue
 draft.append(f"## {f['kind'].upper()} questionnaire\n\nSource: {f['url']}\n\nOriginal SHA-256: {f['sha256']}\n")
 source_rows=f['extractedTableRows'] or [[paragraph] for paragraph in f['paragraphs']]
 assert source_rows,'Questionnaire extraction returned no content'
 for n,cells in enumerate(source_rows,1):
  quote=' | '.join(cells);text=quote.lower();answer='UNANSWERED — owner must provide authorized evidence; no compliance answer or certification inferred.';evidence='OWNER-CHECKLIST.md'
  if any(k in text for k in ['hipaa','hitech','baa','soc 2','hitrust','certif']):answer='DRAFT: Compliance/certification/BAA is not established or accepted for this demo. Authorized privacy/security/legal evidence and review are required.';evidence='SECURITY-AI-DRAFT.md'
  elif any(k in text for k in ['training data','model training','phi','patient data']):answer='DRAFT: Only fictional generated/fixture records are used in the demonstration. No JPS/real patient data or external model training is performed. Production data use, privacy and contractual controls require approval.';evidence='SECURITY-AI-DRAFT.md'
  elif any(k in text for k in ['bias','fairness','accuracy','validation','drift','performance of the ai']):answer='DRAFT: Same-author synthetic engineering labels only; no independent clinical accuracy, bias/fairness or production drift validation established. Qualified independent reviewers and representative labels remain required.';evidence='IMPLEMENTATION-ROADMAP.md'
  elif any(k in text for k in ['encrypt','key management','multi-factor','sso']):answer='DRAFT: Local demo uses loopback services/Keycloak roles. Production encryption, key management, enterprise SSO/MFA and related assurance remain unestablished.';evidence='SECURITY-AI-DRAFT.md'
  elif 'audit' in text:answer='DRAFT: Local demo has chained audit records, source versions and tested restore/reconciliation. Independent immutable retention, enterprise retention controls and compliance certification are not established.';evidence='SECURITY-AI-DRAFT.md'
  elif any(k in text for k in ['uptime','disaster','recovery','availability']):answer='DRAFT: See actual single-host benchmark/recovery logs. No enterprise HA/DR, RPO/RTO or contractual availability commitment is made.';evidence='IMPLEMENTATION-ROADMAP.md'
  draft.append(f"### Source content item {n}\n\n> {quote.replace(chr(10),' ')}\n\nOwner organizational answer: **UNVERIFIED**. {answer}\n\nEvidence/preparation: [{evidence}]({evidence}). **Owner approval required; not entered into the official form.**\n")
(root/'docs/submission/OFFICIAL-QUESTIONNAIRE-DRAFT.md').write_text('# Source-linked official questionnaire working draft\n\nNot an attestation or completed official form. Exact extracted source rows are retained for review, including headings/answer fields. Heuristic draft suggestions never establish compliance and must be reviewed against each original question. All official originals remain unchanged.\n\n'+'\n'.join(draft))
print('Retrieved',len(forms),'official blank forms; preserved originals and created unapproved source-linked questionnaire draft. No signing/submission.')
