"""Losslessly retain every raw row without publishing a >100MiB Git blob."""
from pathlib import Path
import gzip,shutil,hashlib,json,sys
label=sys.argv[1];assert label in ['baseline','optimized','optimized-budgeted','probe']
p=Path('artifacts/issue-5')/label;raw=p/'soak-requests.jsonl';target=p/'soak-requests.jsonl.gz'
with raw.open('rb') as source,gzip.open(target,'wb',compresslevel=6) as out:shutil.copyfileobj(source,out)
with raw.open('rb') as source:original=hashlib.file_digest(source,'sha256').hexdigest()
with gzip.open(target,'rb') as source:assert hashlib.file_digest(source,'sha256').hexdigest()==original
(p/'raw-log-manifest.json').write_text(json.dumps({'rawSha256':original,'gzipSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'rawBytes':raw.stat().st_size,'compressedBytes':target.stat().st_size,'roundTripVerified':True,'classification':'Every synthetic queue request status/latency retained; no tokens or clinical content'},indent=2)+'\n')
raw.unlink();print('Verified lossless compressed raw proof:',label)
