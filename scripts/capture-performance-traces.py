"""Preserve existing privacy-restricted OTel spans, with honest cumulative scope."""
from pathlib import Path
import json,gzip,hashlib,sys
label=sys.argv[1];assert label in ['baseline','optimized','optimized-budgeted']
p=Path('artifacts/issue-5')/label;raw=Path('.runtime/benchmark-traces.jsonl').read_bytes();spans=[]
for line in raw.splitlines():
 if not line.strip():continue
 s=json.loads(line)
 assert set(s)<=set(['name','traceId','spanId','parentSpanId','attributes','status','durationMs'])
 assert set(s['attributes'])<=set(['http.request.method','http.route','http.response.status_code','request.id'])
 spans.append(s)
assert spans,'Actual trace spans required'
target=p/'otel-traces-cumulative.jsonl.gz'
with gzip.open(target,'wb') as z:z.write(raw)
(p/'otel-trace-manifest.json').write_text(json.dumps({'scope':'Cumulative existing benchmark exporter at this checkpoint, including historical runs and probes; not exclusively attributable to this hour','spans':len(spans),'rawSha256':hashlib.sha256(raw).hexdigest(),'gzipSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'attributesWhitelisted':True,'sourceContentExported':False,'samples':spans[-3:]},indent=2)+'\n')
print('Retained',len(spans),'actual cumulative privacy-restricted spans:',label)
