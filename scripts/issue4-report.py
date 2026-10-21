"""Render readiness only from completed, independently checked local proof. No external success inference."""
from pathlib import Path
from datetime import datetime,timezone
import json,re,subprocess,hashlib
root=Path(__file__).resolve().parent.parent;p=root/'artifacts/issue-4'
def read(n):return json.loads((p/n).read_text())
b=read('benchmark-results.json');raw=read('soak-measurements-verification.json');f=read('fault-recovery.json');r=read('final-restore-proof.json');reconcile=read('reconciliation-after-repair.json');s=read('synthea-local-proof.json');d=read('denial-validation.json');ready=read('submission-readiness.json')
assert all(x['passed'] for x in [b,raw,f,r,reconcile,d]);assert b['load']['seconds']>=3600
assert s['localMedplumPassed'] and s['hapiBaseValidationPassed'] and s['hapiResources']==64 and s['localAdapterPagination']['passed']
assert s['fullCohortImport']['actualLocalMedplum'] and s['fullCohortImport']['resources']==6650 and not s['fullCohortImport']['unresolvedInternalClinicalReferences']
assert s['localVersionReconciliation']['updatedSourceRequiresReview'] and s['localVersionReconciliation']['staleRejected'] and s['localVersionReconciliation']['duplicateDetected']
assert ready['readyToSubmit'] is False and ready['submitted'] is False and ready['signed'] is False
unit=(p/'final-unit.txt').read_text();integration=(p/'final-integration.txt').read_text();browser=(p/'final-browser.txt').read_text()
def count(text):
 assert re.search(r'fail 0\b',text)
 return int(re.search(r'pass (\d+)\b',text).group(1))
u=count(unit);i=count(integration);browser_count=int(re.search(r'(\d+) passed',browser).group(1));assert u>=41 and i>=25 and browser_count>=10
for width in [1440,1920]:
 preview=read(f'final-preview-{width}-results.json')['stats'];assert preview['expected']==1 and preview['unexpected']==0 and preview['flaky']==0
static=read('fixture-frontend-manifest.json')
assert hashlib.sha256((p/'fixture-frontend-preview.zip').read_bytes()).hexdigest()==static['archiveSha256']
assert static['sourceFingerprintSha256']==hashlib.sha256((p/'source-fingerprint.json').read_bytes()).hexdigest()
assert read('final-npm-audit.json')['metadata']['vulnerabilities']['total']==0
subprocess.run(['node','scripts/source-fingerprint.mjs','--check'],cwd=root,check=True)
live=(root/'.runtime/issue4-live-run').read_text().strip()
for issue in ['issue-2','issue-4']:
 m=json.loads((root/'artifacts'/issue/live/'manifest.json').read_text())
 for image in m['images']:assert hashlib.sha256((root/image['file']).read_bytes()).hexdigest()==image['sha256']
prev=json.loads((root/'artifacts/issue-3/benchmark-results.json').read_text());load=b['load'];throughput_delta=(load['throughputPerSecond']/prev['load']['throughputPerSecond']-1)*100;latency_delta=(load['p95Ms']/prev['load']['p95Ms']-1)*100
summary={'verifiedAt':datetime.now(timezone.utc).isoformat(),'classification':{'ENGINEERING VERIFIED':'Completed local software/test/recovery scope only','SYNTHETIC ONLY':'Generated records, engineering golden labels and bounded queue workload','EXTERNAL VALIDATION REQUIRED':['Authenticated Epic client/tenant','JPS permissions','Clinical signoff/representative labels','Authorized payer criteria/agreements','Vercel project permission/protection','Owner commercial/legal/insurance/reference evidence']},'tests':{'unit':u,'integration':i,'liveBrowser':browser_count,'fixtureBrowser':'1 at each desktop width'},'synthea':{'patients':s['patients'],'medplumRepresentativeResources':s['resources'],'fullMedplumClinicalResources':s['fullCohortImport']['resources'],'localVersionReconciliation':s['localVersionReconciliation'],'hapiResources':s['hapiResources'],'fullProfileCertification':False,'epicAuthenticated':False},'hour':b,'independentRawProof':raw,'phase3Comparison':{'throughputPercentChange':throughput_delta,'p95PercentChange':latency_delta,'sameBoundedQueueWorkload':True,'limitations':'Shared host; independent read-only/UI/source work occurred; no causal capacity/HA inference from a single run.'},'faults':f,'restore':r,'reconciliation':reconcile,'denialGolden':{'cases':len(d['results']),'metrics':d['metrics'],'calibration':d['calibration'],'clinicalValidation':False},'liveScreenshotRun':live,'vercel':read('vercel-blocker.json'),'submission':ready}
(p/'verification-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
report=f'''# Issue #4 complete engineering readiness report

Branch: [dev/phase-4-enterprise-proof](https://github.com/keon11/jps-urt-mvp/tree/dev/phase-4-enterprise-proof). All prior MVP checkpoints preserved; no main merge. The containing delivery commit is the source checkpoint; `git rev-parse HEAD` gives its full SHA. [Machine-readable evidence](../artifacts/issue-4/verification-summary.json).

## ENGINEERING VERIFIED

- Actual pinned Synthea 4.0.0 generated **16 fictional patients** (12 living, 4 deceased). Jar digest matched the upstream release, Java 21 ran fixed seeds 20261404054, reference/end date 2026-10-20, Texas, age 18–85 and five exported history years. [Generation manifest](../artifacts/issue-4/synthea-generation-manifest.json), [license](licenses/Synthea-4.0.0-LICENSE.txt), reproducible `python3 scripts/generate-synthea.py`.
- Committed derived clinical corpus retains longitudinal Patient/Encounter/Observation/Condition data, source hashes and a documented projection. Original exports remain private. Optional provider/contact context is removed or replaced with explicit fictional Location labels; the projection is not a complete/original chart. An initial actual Medplum Location-reference failure was preserved and repaired using generated Locations.
- Actual local proof: **{s['resources']} Medplum resources stored/read, {s['hapiResources']} HAPI base-resource validations**, 16 patients, actual local adapter pagination. All **{s['fullCohortImport']['resources']} derived clinical resources** were additionally batch-imported with original export SHA-256 in FHIR meta.source; internal clinical references reconciled. Actual local generated-Patient version update/duplicate/stale handling passed and the administrative field was restored. HAPI informational unknown-extension messages are retained. Public Epic CapabilityStatement/SMART discovery available; PKCE/endpoint checks performed. Read-only transport tests cover pagination, identity, scope/expiry/401/403, bounded retries and stale reconciliation.
- Operations now browses actual Synthea-derived histories with diagnoses, observations and hashes. The encounter risk-evidence action reads the published illustrative registry, checks source freshness and requires human review. It never contacts an insurer, predicts adjudication, activates criteria or changes source patient status. All eight original demonstrations preserved.
- Final checks: **{u} unit, {i} live integration, {browser_count} live browser tests**, plus one fixture browser check at each of 1440/1920; builds, preview credential scan, deployment verifier, product/fixture/dependency source fingerprints and npm audit passed. Actual screenshot bytes/hashes verified. [Logs](../artifacts/issue-4/).

### One-hour comparable bounded queue proof

Targets were committed before measurement: >=3600s, 25 sessions, 10,000 cloned queue rows plus six originals, p95 <=1000ms, throughput >=20/s, errors <1%, sampled API RSS <=1GiB, restart <=15s and restore <=120s. Every request status/latency is retained and aggregates independently recomputed.

| Measurement | Actual |
|---|---|
| Duration / requests | {load['seconds']:.2f}s / {load['requests']:,} |
| Throughput | {load['throughputPerSecond']:.2f} requests/s |
| p50 / p95 / p99 | {load['p50Ms']:.2f} / {load['p95Ms']:.2f} / {load['p99Ms']:.2f} ms |
| Maximum latency | {load['maxMs']:.2f}ms |
| Errors | {load['failedRequests']} ({load['errorFraction']:.6%}); {json.dumps(load['errors'])} |
| Sampled API peak RSS / average CPU | {load['peakApiRssBytes']/1048576:.2f} MiB / {load['apiAverageCpuPercent']:.2f}% of one core |
| Session renewals | {load['authenticationRenewals']} (no tokens recorded) |
| API restart / isolated baseline restore | {b['apiRestartSeconds']:.2f}s / {b['restore']['seconds']:.2f}s |
| Working MVP check during load | Case count and audit chain unchanged; not a full-table case-content snapshot |

Phase 3 baseline: 63.60 requests/s, p95 689.43ms, 0.1938% timeouts over 600 seconds. Current changes: throughput {throughput_delta:+.2f}%, p95 {latency_delta:+.2f}%. This is the same bounded queue API/dataset/session workload on the shared host. Independent source/build/document verification and extended synthetic Medplum/HAPI validation occurred during the hour; do not causally attribute changes without a controlled repeat. Raw rows stream to disk and progress/RSS sample every 15 seconds. Other service resource usage is retained in a [single instantaneous Docker snapshot](../artifacts/issue-4/soak-container-resource-snapshot.json); it does not establish their peak usage.

This is not Synthea clinical-inference throughput, full-bundle UI capacity, real clinician concurrency, multi-day stability, HA, a production SLA or a clinical accuracy claim. Nonzero failures/tail latency remain material production concerns. No threshold was relaxed and no short run substituted for the hour. The initial process-session interruption at about 1975 seconds is retained separately and never combined with this completed run.

### Fault, reconciliation and recovery

Actual FHIR / CQF / AI readiness recovery: **{f['fhirRecoverySeconds']:.2f}s / {f['ruleEngineRecoverySeconds']:.2f}s / {f['aiRecoverySeconds']:.2f}s** (predeclared 60/120/60s bounds). Failed FHIR/CQF reviews preserved previous assessment and success-audit count and raised alerts. AI outage used labeled rules fallback; subsequent actual model review took {f['recoveredClinicalReview']['seconds']:.2f}s. Current-drill parent/child traces and metrics were verified without clinical-source export. Injected partial DB failure/retry left one FHIR receipt and one committed logical event; altered replay was rejected.

Final private checkpoint restored into a separate database in **{r['seconds']:.2f}s**. All **{len(r['tables'])} table row counts/hashes**, **{r['audit']['events']} audit events** and a restored application worklist read verified. [Restore proof](../artifacts/issue-4/final-restore-proof.json). `.runtime/issue4-final-checkpoint.dump` is private and not an off-host backup; transfer privately before workspace expiry if exact event history is needed. Source/fixtures recreate the demo. The dump covers the application database, not coordinated Medplum/HAPI/Keycloak/container-volume recovery; see [restore runbook](ISSUE-4-RESTORE.md).

## SYNTHETIC ONLY

The 24-case payer corpus has independently written engineering expectations: plan/wildcard precedence, explicit priority, conflict ties, effective/expiry dates, exceptions, approvals, pending isolation, changed sources and unknown/private criteria. Confusion counts: {json.dumps(d['metrics'])}. These classify synthetic workflow risk flags, with review-required not treated as a confirmed violation. Labels are not independent clinician/insurer outcomes. Calibration is unsupported: no adjudication probabilities or representative labeled outcomes exist. No real medical/payer rule is silently activated.

Historical Synthea data does not establish current acute admission evidence. Tests fail closed when current criteria are missing. HAPI base-structure validation removes profile declarations on validation copies and does not establish full US Core/IG certification. Mocked OAuth failures and local Medplum service authentication are not authenticated Epic SMART exchange. No clinical validation, payer approval, HIPAA compliance or production readiness is asserted.

### Desktop evidence and reproduction

[Live 1440/1920 workstation manifest](../artifacts/issue-2/{live}/manifest.json), [new risk/Synthea workspace captures](../artifacts/issue-4/{live}/manifest.json). The screenshots are unique actual browser captures with source references/hashes, not inherited mockups. Fixture preview captures are in the timestamped issue4-preview directories under artifacts/issue-2.

Local prerequisites: Node 24, Docker Compose, Java 21 only for regeneration, adequate RAM/disk for pinned services/model/generator. Start `TRACE_SAMPLE_RATE=1 npm run start:demo`, open http://localhost:3000 on that same machine and obtain seeded local account values from the operator. Keep all services on loopback; no credentials are displayed/prefilled. Build `npm run build:preview` for the explicitly disconnected, read-only frontend. A [verified static frontend archive](../artifacts/issue-4/fixture-frontend-preview.zip) and [asset hashes](../artifacts/issue-4/fixture-frontend-manifest.json) are included; `python3 scripts/package-preview.py` recreates the package from the verified build. This archive is not a hosted Vercel deployment.

Sequential checks: `npm test`, `npm run build`, `npm run test:integration`, `npm run test:browser`, `npm run test:preview`, `npm run verify:audit`. Added commands: `npm run generate:synthea`, `npm run test:synthea`, `npm run test:denial-correctness`, `npm run test:hour`, `npm run prepare:readiness`. Full cohort validation: `npx tsx scripts/verify-synthea.ts --all-hapi`. After hour completion, separately run `python3 scripts/verify-soak-measurements.py --issue-4`, `npx tsx scripts/reconcile-proof.ts --issue-4`, `npx tsx scripts/fault-recovery.ts --issue-4`, `npx tsx scripts/final-checkpoint.ts --issue-4`. Fault tests intentionally stop/restart local services; never overlap them or case-mutating suites with load/another demonstration. TRACE_SAMPLE_RATE=1 on the local API makes current-drill trace proof deterministic; the isolated load API uses its pinned 0.05 rate.

## EXTERNAL VALIDATION REQUIRED

- **Epic:** authorized non-production registration, tenant endpoint, client/scopes and secure token provider. Public metadata/SMART discovery succeeded; no authenticated patient/encounter exchange or JPS integration occurred. Do not send credentials in chat.
- **Hospital/JPS:** approved clinical/interface access, data mapping/acceptance and production permissions. None are inferred from this software.
- **Payers/clinical:** authorized criteria licenses, private plan agreements/effective dates, qualified independent clinical reviewers, representative/blinded labels and signoff. Public CMS source retrieval is permitted but official dates/revisions/applicability remain unverified; zero official executable criteria inferred.
- **Vercel:** link-only project creation remains HTTP 403 in team kevionkt111-1687; no mapped CLI fallback. Owner must grant create/link permission or import this existing repo with the Phase 4 branch, preview target and protection verified. No hosted URL/public backend/production deployment is claimed.
- **Commercial/legal:** owner legal entity, authorized signatory, references, pricing, insurance, HUB/outreach evidence, completion/review of retrieved blank official forms and latest addenda. The readiness checker preserves owner entries and reports **readyToSubmit=false**. No offer, signatures, submissions, communications, BAA or contractual terms accepted.
- **Production:** encryption/keys, enterprise SSO/MFA, privacy/risk assessment, immutable independent retention, incident response, HA/DR, sustained multi-day capacity, drift/fairness and contracted support remain outstanding.

Prepared [source-backed matrix](submission/TRACEABILITY.md), [roadmap](submission/IMPLEMENTATION-ROADMAP.md), [owner checklist](submission/OWNER-CHECKLIST.md), [security/AI draft](submission/SECURITY-AI-DRAFT.md), [synthetic demo script](submission/SYNTHETIC-DEMO-SCRIPT.md), [retrieved official blank-form inventory](submission/OFFICIAL-FORMS.md), [source-linked questionnaire sidecar](submission/OFFICIAL-QUESTIONNAIRE-DRAFT.md), blank internal pricing working CSV and [draft preparation archive](../artifacts/issue-4/jps-submission-preparation.zip). These are not official completed/signed forms. Retained Addendum 1 says November 3, 2026 at 2 p.m. CST; owner must verify current cutoff/all addenda before any submission.

[Architecture/license inventory](ISSUE-4-ARCHITECTURE.md), [predeclared acceptance](ISSUE-4-ACCEPTANCE.md), [execution/failure history](ISSUE-4-EXECUTION.md), [security gaps](SECURITY-AND-PRODUCTION-GAPS.md). Reused proven engines; no redundant workflow/rule/orchestration engine installed. Full transitive/container/model legal/security review remains a production requirement.
'''
(root/'docs/ISSUE-4-REPORT.md').write_text(report);print('Verified readiness report rendered from completed hour, raw, recovery, source and regression proof.')
