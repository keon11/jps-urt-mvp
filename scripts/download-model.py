#!/usr/bin/env python3
"""Download a revision-pinned public model, then verify its SHA-256."""
import hashlib, json, pathlib, urllib.request
root=pathlib.Path(__file__).resolve().parent.parent
lock=json.loads((root/'docs/model-lock.json').read_text())
path=root/'.runtime/models'/lock['file']
path.parent.mkdir(parents=True,exist_ok=True)
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
if not path.exists() or digest(path)!=lock['sha256']:
 url=f"https://huggingface.co/{lock['repository']}/resolve/{lock['revision']}/{lock['file']}"
 temporary=path.with_suffix('.download')
 urllib.request.urlretrieve(url,temporary)
 if digest(temporary)!=lock['sha256']:
  temporary.unlink();raise RuntimeError('Model checksum mismatch')
 temporary.replace(path)
path.chmod(0o644)
print(f'Verified {lock["file"]}: {lock["sha256"]}')
