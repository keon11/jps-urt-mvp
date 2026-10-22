"""Create an immutable Phase 4 API snapshot with the comparable Phase 5 harness.
No branch reset, second repository, dependency installation or credentials created.
"""
from pathlib import Path
import subprocess,tarfile,io,json,hashlib,os,sys
root=Path(__file__).resolve().parent.parent;first='--first-optimized' in sys.argv;dst=root/('.runtime/phase5-first-optimized' if first else '.runtime/phase5-baseline');base='2d86253b5dd214353f11177134d311568edf9800' if first else 'e9d00f6805bc1b58a77bcc135d568dd8c18fdd8e';manifest=root/('artifacts/issue-5/first-optimized-source-snapshot.json' if first else 'artifacts/issue-5/baseline-source.json')
if not dst.exists():
 dst.mkdir(parents=True)
 raw=subprocess.check_output(['git','archive',base,'services','scripts','fixtures','tests/browser/local-account.ts','package.json','package-lock.json','tsconfig.json'],cwd=root)
 with tarfile.open(fileobj=io.BytesIO(raw)) as archive:
  for member in archive:
   path=Path(member.name);assert not path.is_absolute() and '..' not in path.parts and (member.isdir() or member.isfile())
   target=dst/path
   if member.isdir():target.mkdir(parents=True,exist_ok=True)
   else:target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(archive.extractfile(member).read())
 (dst/'scripts/benchmark.ts').write_bytes((root/'scripts/benchmark.ts').read_bytes())
 for name in ['node_modules','.runtime','artifacts','docs','dist','infra']:os.symlink(root/name,dst/name,target_is_directory=True)
 files={str(p.relative_to(dst)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (dst/'services').rglob('*.ts')};files['scripts/benchmark.ts']=hashlib.sha256((dst/'scripts/benchmark.ts').read_bytes()).hexdigest()
 manifest.parent.mkdir(parents=True,exist_ok=True);manifest.write_text(json.dumps({'base':base,'scope':'Immutable fixed API source, same installed dependencies and comparable benchmark harness','sha256':files},indent=2)+'\n')
m=json.loads(manifest.read_text());assert m['base']==base
for name,digest in m['sha256'].items():assert hashlib.sha256((dst/name).read_bytes()).hexdigest()==digest
for p in (dst/'services').rglob('*.ts'):
 original=subprocess.check_output(['git','show',base+':'+str(p.relative_to(dst))],cwd=root);assert original==p.read_bytes()
print('PASS: immutable API bytes match recorded fixed commit; harness hashes match recorded baseline. Existing snapshot is never overwritten.')
