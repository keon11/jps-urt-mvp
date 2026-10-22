"""Recompute aggregate gates from retained per-request measurements."""
import json,math,sys,gzip
from pathlib import Path
phase6=next((a.split('=',1)[1] for a in sys.argv if a.startswith('--phase6=')),None)
assert phase6 in [None,'baseline','candidate','extended']
performance=next((a.split('=',1)[1] for a in sys.argv if a.startswith('--performance=')),None)
assert performance in [None,'baseline','optimized','optimized-budgeted']
issue4='--issue-4' in sys.argv or performance is not None
p=Path(__file__).resolve().parent.parent/((('artifacts/phase-6/performance-'+phase6)) if phase6 else ('artifacts/issue-5/'+performance) if performance else ('artifacts/issue-4' if issue4 else 'artifacts/issue-3'))
r=json.loads((p/'benchmark-results.json').read_text());rawPath=p/'soak-requests.jsonl';raw=[json.loads(line) for line in (gzip.open(str(rawPath)+'.gz','rt') if not rawPath.exists() else rawPath.open()) if line.strip()]
l=r['load'];assert len(raw)==l['requests'] and {row['session'] for row in raw}==set(range(25))
errors={}
for row in raw:
 assert math.isfinite(row['durationMs']) and row['durationMs']>=0
 assert row.keys()=={'elapsedMs','session','status','durationMs'}
 if row['status']!='200':errors[row['status']]=errors.get(row['status'],0)+1
assert errors==l['errors'];assert sum(errors.values())==l['failedRequests']
durations=sorted(row['durationMs'] for row in raw)
for key,percent in [('p50Ms',.5),('p95Ms',.95),('p99Ms',.99)]:assert abs(durations[min(len(durations)-1,int(len(durations)*percent))]-l[key])<.000001
assert abs(max(durations)-l['maxMs'])<.000001
assert abs(len(raw)/l['seconds']-l['throughputPerSecond'])<.000001
assert l['seconds']>=((600 if phase6=='extended' else 120) if phase6 else (3600 if issue4 else 600))
if not performance and not phase6:assert r['passed'] and l['p95Ms']<=1000 and l['errorFraction']<.01 and l['throughputPerSecond']>=20
if issue4:
 assert l['peakApiRssBytes']<=1073741824
 samples=json.loads((p/'soak-samples.json').read_text())
 assert len(samples)>=200
 assert max(s['rssBytes'] for s in samples)<=l['peakApiRssBytes']
proof={'recomputed':True,'requests':len(raw),'errors':errors,'aggregateMatchesRaw':True,'passed':True,'performanceAcceptancePassed':r['passed'],'zeroTimeoutTargetMet':not any('Timeout' in k for k in errors)}
(p/'soak-measurements-verification.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof))
