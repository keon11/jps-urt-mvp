"""Render delivery evidence only after actual local gates pass."""
import json,re,hashlib
from pathlib import Path
from datetime import datetime,timezone
root=Path(__file__).resolve().parent.parent
p=root/'artifacts/issue-3'
def read(name):return json.loads((p/name).read_text())
benchmark=read('benchmark-results.json');fault=read('fault-recovery.json');restore=read('final-restore-proof.json');reconcile=read('reconciliation-after-repair.json')
for r in [benchmark,fault,restore,reconcile]:assert r['passed']
unit=(p/'final-unit.txt').read_text();integration=(p/'final-integration.txt').read_text();browser=(p/'final-browser.txt').read_text()
assert re.search(r'pass 28\b',unit) and re.search(r'fail 0\b',unit)
assert re.search(r'pass 23\b',integration) and re.search(r'fail 0\b',integration)
assert '7 passed' in browser
assert read('final-npm-audit.json')['metadata']['vulnerabilities']['total']==0
live=(root/'.runtime/issue3-live-run').read_text().strip()
manifest=json.loads((root/'artifacts/issue-2'/live/'manifest.json').read_text())
for i in manifest['images']:assert hashlib.sha256((root/i['file']).read_bytes()).hexdigest()==i['sha256']
correctness=read('policy-correctness.json');assert correctness['passed'];epic=read('epic-conformance.json')
summary={'verifiedAt':datetime.now(timezone.utc).isoformat(),'tests':{'unit':28,'liveIntegration':23,'liveBrowser':7,'fixtureBrowser':'1 test at each of 1440 and 1920; both passed'},'syntheticPolicy':{'cases':len(correctness['results']),'metrics':correctness['metrics'],'corpusVersion':correctness['corpusVersion'],'clinicalValidation':False},'benchmark':benchmark,'faultRecovery':fault,'restore':restore,'reconciliation':reconcile,'liveScreenshots':f'artifacts/issue-2/{live}/manifest.json','publicEpicMetadata':epic['access'],'authenticatedEpicValidation':False,'jpsConnected':False,'vercel':'project creation 403; no hosted URL','submission':'draft preparation only; not signed/submitted'}
(p/'verification-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
l=benchmark['load'];m=correctness['metrics']
text=f'''# Issue #3 verified delivery report

Branch: [dev/phase-3-validation](https://github.com/keon11/jps-urt-mvp/tree/dev/phase-3-validation). No merge to main. Original MVP and Issue #2 checkpoints remain preserved. This report's containing commit is the final source checkpoint; use `git rev-parse HEAD` for its full SHA.

## Delivered and verified

- Deployment verifier executed first. Fixed both config checks/branch gate for Phase 3; npm ci/build and credential-free fixture browser checks passed at 1440/1920. Vercel link-only creation still returns 403; no hosted deployment/protection claimed.
- CMS retrieval passed robots checking. Exact source URL/hash/original bytes retained; changed byte hashes have unchanged normalized text. Policy dates, plan applicability and authentic official revision remain unverified. No official executable criteria inferred or activated.
- Versioned owned policy specification and 19-case golden corpus cover date boundaries, plan identity, conflicts, exceptions, missing/unknown evidence, changed sources and ambiguous terms. Approval test gate and admin/advisor read-only report work. Synthetic metrics: TP={m['tp']}, TN={m['tn']}, FP={m['fp']}, FN={m['fn']}; precision/recall/sensitivity/specificity={m['precision']}/{m['recall']}/{m['sensitivity']}/{m['specificity']}. Same-author engineering labels, not clinical accuracy or independent clinical validation. A fixture migration failure was caught, retained and repaired without changing expected labels.
- Six synthetic FHIR bundles mapped with identity/version/hash preservation. Negative tests cover external/broken references, duplicate identities, missing synthetic tags, class/subject mismatch and stale/inconsistent updates. Public Epic FHIR R4 CapabilityStatement discovery succeeded. No authenticated patient/encounter sandbox exchange, US Core/profile certification or JPS connection is claimed.
- All eight original demonstrations preserved. Final checks: **28 unit, 23 live integration, 7 live browser tests**; fixture check passed once at each desktop size; TypeScript/live and fixture builds, preview credential scan and deployment config passed. Npm audit reports zero vulnerabilities. [Machine-readable evidence](../artifacts/issue-3/verification-summary.json).

## Actual reliability measurements

Predeclared ten-minute thresholds: 25 authenticated sessions, 10,000 cloned synthetic queue rows plus six originals; p95 <=1000ms, errors <1%, throughput >=20/s, API restart <=15s, restore <=120s. FHIR/AI readiness <=60s and CQF readiness <=120s. Thresholds were committed before their runs.

| Measurement | Actual result |
|---|---|
| Completed interval | {l['seconds']:.2f}s |
| Requests / throughput | {l['requests']:,} / {l['throughputPerSecond']:.2f} per second |
| p50 / p95 / p99 | {l['p50Ms']:.2f} / {l['p95Ms']:.2f} / {l['p99Ms']:.2f} ms |
| Maximum latency | {l['maxMs']:.2f}ms |
| Failed requests / fraction | {l['failedRequests']} / {l['errorFraction']:.6%} |
| Error breakdown | {json.dumps(l['errors'])} |
| Proactive session renewals | {l['authenticationRenewals']} |
| Peak API RSS / average CPU | {l['peakApiRssBytes']/1048576:.2f} MiB / {l['apiAverageCpuPercent']:.2f}% of one core |
| API restart | {benchmark['apiRestartSeconds']:.2f}s |
| FHIR / CQF / AI readiness recovery | {fault['fhirRecoverySeconds']:.2f} / {fault['ruleEngineRecoverySeconds']:.2f} / {fault['aiRecoverySeconds']:.2f}s |
| Recovered actual model review | {fault['recoveredClinicalReview']['seconds']:.2f}s |
| Final full restore | {restore['seconds']:.2f}s; {len(restore['tables'])} table hashes/counts matched; {restore['audit']['events']} audit events verified |

The first soak **failed**: identity tokens expired, unauthorized responses and timeouts occurred, and the final check used an expired token. It is not a capacity success. Its result/log/raw requests are preserved (lossless gzip plus original-byte hash). The repaired run renews using issuer expires_in and still counts every failure. Raw successful-run timings/statuses and 15-second RSS/progress samples are retained. No token values recorded, auth lifetime weakened or threshold relaxed.

Reconciliation fault injection confirms one FHIR receipt/one committed logical event after failed database writes and retry; altered replay is rejected. Actual FHIR and CQF outages return failure, preserve previous assessment/success-audit count and raise alerts; AI outage uses labeled rules fallback. Current-drill spans prove parent/child correlation without exporting source content. Working MVP case/audit state was unchanged during the successful isolated load interval.

These are single-host API measurements with 25 sessions of the same synthetic role and cloned queue rows, not a clinical population, legacy full-bundle UI capacity, multi-day soak, HA or production SLA certification. Resource figures cover the API process; PostgreSQL CPU was also observed busy on the shared host. No extrapolated production capacity claim.

## Screenshots, startup and restore

[Final real desktop capture manifest](../artifacts/issue-2/{live}/manifest.json) includes unique timestamped screenshots at 1440/1920, byte hashes and source reference. [1440 worklist](../artifacts/issue-2/{live}/1440/queue.png), [1920 worklist](../artifacts/issue-2/{live}/1920/queue.png), [policy center](../artifacts/issue-2/{live}/1440/policy-center.png), [internal authorization](../artifacts/issue-2/{live}/1920/internal-authorization.png). Fixture preview captures: [1440](../artifacts/issue-2/issue-3-preview-1440/manifest.json) and [1920](../artifacts/issue-2/issue-3-preview-1920/manifest.json).

With Node 24 and local Docker Compose, run `TRACE_SAMPLE_RATE=1 npm run start:demo` and open http://localhost:3000 on the same machine. Obtain local seeded values through the operator; no credentials are prefilled or displayed. Keep backend services on loopback. Build `npm run build:preview` for the read-only disconnected frontend; it has no backend credentials or real payer transport.

Run data-mutating checks sequentially: `npm test`, `npm run build`, `npm run test:integration`, `npm run test:browser`, `npm run test:preview`, `npm run verify:audit`. Added commands: `npm run verify:deployment`, `npm run test:policy-correctness`, `npm run test:epic-conformance`, `npm run test:soak`, `npm run prepare:submission`. After soak, run `npx tsx scripts/reconcile-proof.ts --issue-3`, `npx tsx scripts/fault-recovery.ts --issue-3` and `npx tsx scripts/final-checkpoint.ts --issue-3` separately. Fault tests intentionally stop local services and restore them; do not run during another demo. TRACE_SAMPLE_RATE=1 must be set on the local API process for deterministic current-drill trace proof (the isolated load API uses its separately pinned 0.05 sample rate).

Private checkpoint: `.runtime/issue3-final-checkpoint.dump`; [restore proof](../artifacts/issue-3/final-restore-proof.json). It was actually restored to a separate DB, all tables/audit checked and restored app read verified. It does not overwrite the working MVP or prior dump. Runtime dumps are not committed/off-host backups; transfer privately before workspace expiry if exact event history is needed. Source/fixtures recreate the six-case demo.

## Draft JPS preparation and external blockers

[Source-backed traceability](submission/TRACEABILITY.md), [proposal outline](submission/PROPOSAL-DRAFT.md), [security/AI questionnaire draft](submission/SECURITY-AI-DRAFT.md), [owner checklist](submission/OWNER-CHECKLIST.md) and [draft preparation archive](../artifacts/issue-3/jps-submission-preparation.zip). Twelve exact RFP quotations and evidence links verified. Pricing worksheet has blank amounts and is explicitly not official Exhibit A. No company credentials, references, certification, pricing, signatures or compliance claims fabricated. No bid, email, legal acceptance or portal submission performed.

- **Vercel:** connected identity lacks project create/link permission in team kevionkt111-1687 (HTTP 403). Owner must grant that permission or import the existing repo with Phase 3 branch, preview target and protection verified. Do not send tokens in chat.
- **Epic:** public metadata access succeeds; authenticated exchange requires authorized non-production client/tenant/read scopes provisioned through a secure configuration channel. No JPS production access requested or used.
- **Clinical/payer:** qualified reviewers, authorized criteria/private plan contracts, representative labeled data and independent clinical validation remain outstanding. Official policy dates/revisions/applicability remain unverified.
- **RFP:** owner must verify latest addenda and official forms, provide legal entity facts, actual references, HUB/support/staffing/commercial details, and have authorized counsel/signatory review. Retained Addendum 1 says November 3, 2026 at 2 p.m. CST; current receipt cutoff/addenda require direct owner verification. The package is not ready to submit as a completed offer.
- **Production/security:** HIPAA compliance, TLS/at-rest encryption/key management, enterprise SSO/MFA, independent immutable retention, incident response, HA/DR and contractual service obligations remain unestablished. See [security gaps](SECURITY-AND-PRODUCTION-GAPS.md) and [reused component inventory/architecture](ISSUE-3-ARCHITECTURE.md).
'''
(root/'docs/ISSUE-3-REPORT.md').write_text(text)
print('Rendered verified report and machine-readable evidence; external blockers remain explicit.')
