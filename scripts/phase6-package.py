"""Assemble an allowlisted review/demo transfer, never submit it as an RFP response."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import json,hashlib,subprocess,datetime
root=Path(__file__).resolve().parent.parent;p=root/'artifacts/phase-6'
summary=json.loads((p/'acceptance-summary.json').read_text());assert summary['engineeringChecksPassed'] and not summary['readyToSubmit']
subprocess.run(['node','scripts/source-fingerprint.mjs','--phase-6','--check'],cwd=root,check=True)
files=set()
for pattern in ['docs/submission/PHASE-6-*','docs/submission/OFFICIAL-QUESTIONNAIRE-DRAFT.md','docs/submission/SECURITY-AI-DRAFT.md','docs/submission/IMPLEMENTATION-ROADMAP.md','docs/PHASE-6-*.md','docs/licenses/bitstream-vera-license.txt','artifacts/phase-6/RFP20261404054_*.xlsx','artifacts/phase-6/RFP20261404054_*.docx','artifacts/phase-6/RFP20261404054_*.pdf','artifacts/phase-6/*.json','artifacts/phase-6/*.txt','artifacts/phase-6/fixture-frontend-preview.zip','artifacts/phase-6/performance-*/*.json','artifacts/phase-6/performance-*/*.gz','artifacts/phase-6/performance-*/*.txt']:
 files.update(x for x in root.glob(pattern) if x.is_file() and x.name not in ['technical-package-manifest.json','technical-package.txt','package-verification.json'])
run=(root/'.runtime/phase6-live-run').read_text().strip()
for issue in ['issue-2','phase-6']:files.update(x for x in (root/'artifacts'/issue/run).rglob('*') if x.suffix in ['.png','.json'])
for d in (root/'artifacts/issue-2').glob('phase6-fixture-*'):files.update(x for x in d.glob('*.png'))
for file in files:
 rel=file.relative_to(root)
 assert not file.is_symlink() and not any(v in rel.parts for v in ['.runtime','.env','.vercel'])
 assert file.suffix in ['.md','.txt','.json','.png','.pdf','.xlsx','.docx','.zip','.gz']
manifest={'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'classification':'DRAFT TECHNICAL DEMONSTRATION TRANSFER; NOT A BID; NO PHI/CREDENTIALS/SIGNATURES','sourceCommitBeforePackaging':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'sourceFingerprintSha256':hashlib.sha256((p/'source-fingerprint.json').read_bytes()).hexdigest(),'privateRuntimeExcluded':True,'submitted':False,'readyToSubmit':False,'files':[{'path':str(f.relative_to(root)),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted(files)]}
target=p/'RFP20261404054_TECHNICAL-DEMONSTRATION_DRAFT.zip'
with ZipFile(target,'w',ZIP_DEFLATED) as z:
 for f in sorted(files):z.write(f,str(f.relative_to(root)))
 z.writestr('TECHNICAL-MANIFEST.json',json.dumps(manifest,indent=2)+'\n')
with ZipFile(target) as z:
 assert z.testzip() is None
 for f in manifest['files']:assert hashlib.sha256(z.read(f['path'])).hexdigest()==f['sha256']
manifest.update(archiveSha256=hashlib.sha256(target.read_bytes()).hexdigest(),archiveBytes=target.stat().st_size,allEntryHashesVerified=True)
(p/'technical-package-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print('PASS: allowlisted technical package:',len(files),'hashed files;',manifest['archiveBytes'],'bytes; private runtime excluded, nothing submitted.')
