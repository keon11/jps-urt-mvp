"""Package only draft preparation documents; never submit or bundle runtime secrets."""
from pathlib import Path
from hashlib import sha256
from datetime import datetime, timezone
from zipfile import ZipFile, ZIP_DEFLATED
import json
root=Path(__file__).resolve().parent.parent
files=sorted((root/'docs/submission').glob('*'))
assert files and all(p.is_file() and p.suffix in ('.md','.json','.csv') for p in files)
manifest={'createdAt':datetime.now(timezone.utc).isoformat(),'classification':'DRAFT PREPARATION ONLY; NOT A BID; NO SIGNATURES OR SUBMISSION','files':[{'path':str(p.relative_to(root)),'sha256':sha256(p.read_bytes()).hexdigest()} for p in files]}
out=root/'artifacts/issue-3';out.mkdir(parents=True,exist_ok=True)
with ZipFile(out/'jps-submission-preparation.zip','w',ZIP_DEFLATED) as archive:
 for p in files:archive.write(p,str(p.relative_to(root)))
 archive.writestr('PREPARATION-MANIFEST.json',json.dumps(manifest,indent=2)+'\n')
manifest['archiveSha256']=sha256((out/'jps-submission-preparation.zip').read_bytes()).hexdigest()
(out/'submission-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Packaged',len(files),'draft documents; no credentials, official signed forms, or runtime files included.')
