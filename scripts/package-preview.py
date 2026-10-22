"""Package the already verified fixture-only build, never runtime/env files."""
from pathlib import Path
from hashlib import sha256
from zipfile import ZipFile, ZIP_DEFLATED
import json,subprocess,sys
root=Path(__file__).resolve().parent.parent
issue='phase-6' if '--phase-6' in sys.argv else 'issue-5' if '--issue-5' in sys.argv else 'issue-4'
subprocess.run(['node','scripts/verify-preview.mjs'],cwd=root,check=True)
subprocess.run(['node','scripts/source-fingerprint.mjs','--check']+(['--phase-6'] if issue=='phase-6' else ['--issue-5'] if issue=='issue-5' else []),cwd=root,check=True)
build=root/'dist-preview';files=sorted(p for p in build.rglob('*') if p.is_file())
assert files and (build/'index.html').is_file()
assert all(p.suffix in ['.html','.js','.css','.svg','.png','.ico'] and not p.is_symlink() for p in files)
manifest={'classification':'READ-ONLY SYNTHETIC FIXTURE FRONTEND; NO BACKEND/AUTH/CLINICAL SERVICE','sourceFingerprintSha256':sha256((root/('artifacts/'+issue+'/source-fingerprint.json')).read_bytes()).hexdigest(),'files':[{'path':str(p.relative_to(build)),'sha256':sha256(p.read_bytes()).hexdigest()} for p in files]}
output=root/('artifacts/'+issue+'/fixture-frontend-preview.zip')
with ZipFile(output,'w',ZIP_DEFLATED) as archive:
 for p in files:archive.write(p,str(p.relative_to(build)))
 archive.writestr('PREVIEW-MANIFEST.json',json.dumps(manifest,indent=2)+'\n')
manifest['archiveSha256']=sha256(output.read_bytes()).hexdigest()
(root/('artifacts/'+issue+'/fixture-frontend-manifest.json')).write_text(json.dumps(manifest,indent=2)+'\n')
print('Packaged',len(files),'verified static fixture assets; no hosted deployment claimed.')
