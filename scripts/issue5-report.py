"""Render only completed evidence; performance misses remain misses."""
from pathlib import Path
from datetime import datetime,timezone
import json,re,subprocess,hashlib,gzip
root=Path(__file__).resolve().parent.parent;p=root/'artifacts/issue-5'
def read(n):return json.loads((p/n).read_text())
b=read('baseline/benchmark-results.json');o=read('optimized/benchmark-results.json')
for label,r in [('baseline',b),('optimized',o)]:
 assert r['load']['seconds']>=3600 and r['thresholds']['sessions']==25 and r['thresholds']['rows']==10000
 assert read(label+'/soak-measurements-verification.json')['aggregateMatchesRaw']
 m=read(label+'/raw-log-manifest.json');raw=p/label/'soak-requests.jsonl.gz'
 assert hashlib.sha256(raw.read_bytes()).hexdigest()==m['gzipSha256']
 with gzip.open(raw,'rb') as f:assert hashlib.file_digest(f,'sha256').hexdigest()==m['rawSha256']
 assert read(label+'/native-profile-summary.json')['eventLoop']['p95Ms']>0
assert b['host']==o['host']
assert read('dataset-baseline.json')['sha256']==read('dataset-maintained.json')['sha256']==read('dataset-optimized.json')['sha256']
eq=read('queue-equivalence.json');assert eq['passed'] and len(eq['checks'])==32
fault=read('fault-recovery.json');restore=read('final-restore-proof.json');reconcile=read('reconciliation-after-repair.json')
assert fault['passed'] and restore['passed'] and reconcile['passed']
def count(name):
 text=(p/name).read_text();assert re.search(r'fail 0\b',text);return int(re.search(r'pass (\d+)\b',text).group(1))
u=count('final-unit.txt');i=count('final-integration.txt');br=int(re.search(r'(\d+) passed',(p/'final-browser.txt').read_text()).group(1));assert u>=41 and i>=25 and br>=10
for width in [1440,1920]:
 stats=read(f'final-preview-{width}-results.json')['stats'];assert stats['expected']==1 and stats['unexpected']==0 and stats['flaky']==0
assert read('final-npm-audit.json')['metadata']['vulnerabilities']['total']==0
subprocess.run(['node','scripts/source-fingerprint.mjs','--issue-5','--check'],cwd=root,check=True)
run=(root/'.runtime/issue5-live-run').read_text().strip()
for issue in ['issue-2','issue-5']:
 m=json.loads((root/'artifacts'/issue/run/'manifest.json').read_text())
 for im in m['images']:assert hashlib.sha256((root/im['file']).read_bytes()).hexdigest()==im['sha256']
base=b['load'];opt=o['load'];timeouts=sum(v for k,v in opt['errors'].items() if 'Timeout' in k)
throughput=(opt['throughputPerSecond']/base['throughputPerSecond']-1)*100;latency=(opt['p95Ms']/base['p95Ms']-1)*100
goals={'p95Under500Ms':opt['p95Ms']<500,'zeroTimeouts':timeouts==0,'benchmarkGatesPassed':o['passed'],'allPerformanceTargetsMet':o['passed'] and timeouts==0}
summary={'at':datetime.now(timezone.utc).isoformat(),'classification':'LOCAL ENGINEERING / SYNTHETIC ONLY','tests':{'unit':u,'integration':i,'browser':br,'fixtureWidths':[1440,1920]},'targets':goals,'baseline':b,'optimized':o,'comparison':{'throughputPercentChange':throughput,'p95PercentChange':latency,'sameRecordedHardware':b['host']==o['host'],'limits':'Single shared host, same fixed queue/sessions; optimized includes explicitly measured ordinary VACUUM/ANALYZE. Separate probes/plans attribute effects; no production/clinical capacity claim.'},'restore':restore,'faults':fault,'reconciliation':reconcile,'screenshots':run,'externalBlockers':['Epic/JPS authorized tenant/client/scopes/permissions','Authorized payer/clinical criteria and agreements','Qualified independent clinical validation','Owner procurement/legal/insurance evidence','Vercel project permission/protection (prior 403)']}
(p/'verification-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
rows=[]
for label,r in [('Reproduced original',b),('Optimized + maintained',o)]:
 l=r['load'];rows.append(f"| {label} | {l['seconds']:.3f} | {l['requests']:,} | {l['throughputPerSecond']:.2f} | {l['p50Ms']:.2f} | {l['p95Ms']:.2f} | {l['p99Ms']:.2f} | {l['maxMs']:.2f} | {json.dumps(l['errors'])} | {l['peakApiRssBytes']/1048576:.2f} |")
text=f'''# Issue #5 measured performance and hospital demonstration readiness

[Development branch](https://github.com/keon11/jps-urt-mvp/tree/dev/phase-5-performance). The containing delivery commit is the reproducible source checkpoint; previous MVP/Phase 4 commits remain ancestors and main is unchanged. [Machine-readable proof](../artifacts/issue-5/verification-summary.json).

## ENGINEERING VERIFIED

The original empty-search path applied ILIKE '%' to every row for page/count queries. Actual EXPLAIN/BUFFERS, payload, warm auth/DB round-trip, catalog/cache and V8 profiles are retained. Reused existing PostgreSQL covering index and pg parameterization, Node perf_hooks/V8 and existing jose/Prometheus/React. No new NPM dependency, result/token cache, infrastructure, schema denormalization, auth bypass or clinical-rule change.

The empty-search fast path removes that redundant predicate; filtered searches retain literal escaping and parameters. All 32 original/optimized SQL page/count comparisons passed, including deep/end offsets and wildcard/backslash/injection-looking text. Counts stay current with no application cache. Selected-row JSON at offset 5000 was 12,741 bytes before/after; this is not a full UI/FHIR bundle payload claim. Warm JWT p95 was about 1.40ms and DB SELECT-1 round-trip p95 about 1.33ms in the initial profile; these local snapshots are not WAN measurements. Buffer/cache counters are database-cumulative, not per-request application-cache rates.

Visibility-map diagnostics found 0 all-visible pages out of 2048 after earlier fixture restore/rewrite; existing index was present. Explicit ordinary VACUUM/ANALYZE was measured on the isolated synthetic database only. Original/optimized idle plans, 120s query-only and maintained probes, and maintenance metadata separate query and maintenance effects. The first after-profile taken under baseline load is labeled and is not an idle improvement claim. No forced planner flag is used by the application. [Reuse/license metadata](../artifacts/issue-5/reuse-inventory.json).

### Comparable one-hour queue measurements

Predeclared targets: each run >=3600s, same 10,006-row isolated queue, 25 synthetic same-role sessions, page/offset sequence, 5s request timeout, token renewal and 0.05 trace sampling. Optimized target p95 <500ms; throughput >=20/s; errors <1%; sampled API RSS <=1GiB; restart <=15s; restore <=120s. Timeout target zero is tracked separately and never hidden by the fractional error gate.

| Run | Seconds | Requests | Req/s | p50 ms | p95 ms | p99 ms | Max ms | Errors | Peak API MiB |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|
{chr(10).join(rows)}

Throughput change **{throughput:+.2f}%**; p95 change **{latency:+.2f}%**, compared with the newly reproduced original. Actual target status: **{json.dumps(goals)}**. Optimized errors/timeouts are reported above even if other gates pass. Observed zero in one interval is not a zero-failure guarantee. Full ordered case-row hashes verify the same queue content before/after maintenance and optimized load. Raw rows are independently recomputed and retained losslessly compressed with SHA-256 round-trip proof. CPU/RSS samples and matched 30s V8/event-loop profiles are included in each run directory; their overhead is present in both runs.

Historical Phase 4 was 71.0149 req/s, p95 626.116ms, 21 timeouts over 3600.160s. Compare against that as historical context, not a new controlled run. Recorded current hardware is {b['host']['logicalCPUs']} logical CPUs, {b['host']['totalMemoryBytes']/1073741824:.2f}GiB host RAM, {b['host']['node']}. Shared-host/OS scheduling remains uncontrolled. Optimization includes measured fixture maintenance; do not attribute the combined gain only to SQL. The driver and service run on the same host, so this is not WAN, clinical inference, legacy full-bundle UI, real clinician concurrency, HA or a production SLA.

### Correctness, recovery and desktop proof

Final checks: **{u} unit, {i} live integration, {br} live browser**, plus fixture preview at 1440/1920; all eight hospital demonstrations preserved. Builds, deployment config, credential/static preview scan, exact source fingerprints, audit and npm audit (zero reported vulnerabilities) passed. Fresh actual images: [workstation manifest](../artifacts/issue-2/{run}/manifest.json), [risk/Synthea manifest](../artifacts/issue-5/{run}/manifest.json). Human visual inspection and any limits are recorded separately; browser layout tests are not a clinical usability certification.

Actual FHIR/CQF/AI readiness recovery: {fault['fhirRecoverySeconds']:.2f}/{fault['ruleEngineRecoverySeconds']:.2f}/{fault['aiRecoverySeconds']:.2f}s. Failed reviews preserved prior assessment and success audit; AI outage used labeled rules fallback and actual inference recovered. Alerts/traces/metrics verified. Retry/reconciliation left one external FHIR receipt and one committed logical event; altered replay rejected.

Application restore verified all {len(restore['tables'])} table hashes/counts, {restore['audit']['events']} chained audit events and an authenticated restored worklist in {restore['seconds']:.2f}s. Private `.runtime/issue5-final-checkpoint.dump` remains outside Git; it is not an off-host/coordinated backup of Medplum/HAPI/Keycloak/all volumes. [Actual restore proof](../artifacts/issue-5/final-restore-proof.json).

## SYNTHETIC ONLY

No patient information, clinical criteria or payer workflow was replaced by the optimization. All records remain fictional and all rules illustrative/unvalidated. The Synthea-derived history and documentation-risk panels remain functional; historical data does not establish current-admission necessity. Internal authorization next-step approval is not insurer approval. No actual Epic/insurer transaction, clinical validation, HIPAA compliance or production readiness is asserted.

## EXTERNAL VALIDATION REQUIRED

Authorized Epic/JPS tenant/client/scopes and hospital acceptance; licensed/approved payer criteria/private contracts; qualified independent clinical reviewers and representative labels; owner procurement/legal/pricing/insurance/reference evidence; Vercel create/link permission and verified protection (prior actual 403). No credentials, contracts, signatures, paid service or production access were invented. Prior [source-backed owner drafts](submission/OWNER-CHECKLIST.md) remain unsigned/unsubmitted. No new hosted preview is claimed; backend stays separate on loopback.

### Reproduce and present

Prerequisites: Node 24, Docker Compose/pinned local services, original synthetic demo initialized, adequate disk/RAM. Start `TRACE_SAMPLE_RATE=1 npm run start:demo`. Use [the concise hospital demonstration checklist](ISSUE-5-DEMO-CHECKLIST.md). Obtain local values privately and never publish backend/default fixture credentials.

`python3 scripts/prepare-performance-baseline.py` creates/verifies immutable Phase 4 API source with the comparable harness. To run the original baseline, execute the driver **inside** `.runtime/phase5-baseline` with COMPOSE_FILE pointing to the repository's absolute compose.yaml, using `npx tsx scripts/benchmark.ts --performance=baseline`; do not label the current optimized working tree as original. `bash scripts/run-phase5.sh` waits for that baseline, then performs sequential probes/maintenance, optimized hour and final suites. It intentionally takes more than two hours, and checkpoints completed measurement stages. Never overlap case mutations/faults with load. Keep the last known working source/checkpoint while investigating a failed stage.

Independent raw verification: `python3 scripts/verify-soak-measurements.py --performance=baseline` (or optimized). Compression: `python3 scripts/compress-performance-proof.py baseline` after verification; the gzip can be streamed/decompressed with standard tools. `npx tsx scripts/verify-queue-equivalence.ts`, `npx tsx scripts/profile-queue.ts --after --label=diagnostic`, and `npx tsx scripts/maintain-synthetic-queue.ts` are local reproducible probes; the last restricts maintenance to the loopback isolated synthetic database. A short probe never replaces an hour.

[Packaged read-only static fixture frontend](../artifacts/issue-5/fixture-frontend-preview.zip), [asset hashes](../artifacts/issue-5/fixture-frontend-manifest.json), reproducible with `python3 scripts/package-preview.py --issue-5` after the verified preview build/source fingerprint. No live Vercel deployment is implied.

Retained failures include the missing private fixture path and the first profiler's unsupported dynamic-import cleanup crash. Both interrupted runs remain separate. Repaired profiler was exercised in a complete diagnostic interval before the new full baseline; driver now stops on child exit and refuses short duration. See [execution/failure history](ISSUE-5-EXECUTION.md), [predeclared targets](ISSUE-5-ACCEPTANCE.md), and raw artifacts for all measured misses and limits. Production still requires representative capacity/multi-day tests, monitoring/maintenance policy, coordinated encrypted backups/HA/DR, security/privacy assurance and clinical/payer validation.
'''
(root/'docs/ISSUE-5-REPORT.md').write_text(text);print('Rendered completed measurements and actual target status:',goals)
