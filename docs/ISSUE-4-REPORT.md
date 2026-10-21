# Issue #4 complete engineering readiness report

Branch: [dev/phase-4-enterprise-proof](https://github.com/keon11/jps-urt-mvp/tree/dev/phase-4-enterprise-proof). All prior MVP checkpoints preserved; no main merge. The containing delivery commit is the source checkpoint; `git rev-parse HEAD` gives its full SHA. [Machine-readable evidence](../artifacts/issue-4/verification-summary.json).

## ENGINEERING VERIFIED

- Actual pinned Synthea 4.0.0 generated **16 fictional patients** (12 living, 4 deceased). Jar digest matched the upstream release, Java 21 ran fixed seeds 20261404054, reference/end date 2026-10-20, Texas, age 18–85 and five exported history years. [Generation manifest](../artifacts/issue-4/synthea-generation-manifest.json), [license](licenses/Synthea-4.0.0-LICENSE.txt), reproducible `python3 scripts/generate-synthea.py`.
- Committed derived clinical corpus retains longitudinal Patient/Encounter/Observation/Condition data, source hashes and a documented projection. Original exports remain private. Optional provider/contact context is removed or replaced with explicit fictional Location labels; the projection is not a complete/original chart. An initial actual Medplum Location-reference failure was preserved and repaired using generated Locations.
- Actual local proof: **64 Medplum resources stored/read, 64 HAPI base-resource validations**, 16 patients, actual local adapter pagination. All **6650 derived clinical resources** were additionally batch-imported with original export SHA-256 in FHIR meta.source; internal clinical references reconciled. Actual local generated-Patient version update/duplicate/stale handling passed and the administrative field was restored. HAPI informational unknown-extension messages are retained. Public Epic CapabilityStatement/SMART discovery available; PKCE/endpoint checks performed. Read-only transport tests cover pagination, identity, scope/expiry/401/403, bounded retries and stale reconciliation.
- Operations now browses actual Synthea-derived histories with diagnoses, observations and hashes. The encounter risk-evidence action reads the published illustrative registry, checks source freshness and requires human review. It never contacts an insurer, predicts adjudication, activates criteria or changes source patient status. All eight original demonstrations preserved.
- Final checks: **41 unit, 25 live integration, 10 live browser tests**, plus one fixture browser check at each of 1440/1920; builds, preview credential scan, deployment verifier, product/fixture/dependency source fingerprints and npm audit passed. Actual screenshot bytes/hashes verified. [Logs](../artifacts/issue-4/).

### One-hour comparable bounded queue proof

Targets were committed before measurement: >=3600s, 25 sessions, 10,000 cloned queue rows plus six originals, p95 <=1000ms, throughput >=20/s, errors <1%, sampled API RSS <=1GiB, restart <=15s and restore <=120s. Every request status/latency is retained and aggregates independently recomputed.

| Measurement | Actual |
|---|---|
| Duration / requests | 3600.16s / 255,665 |
| Throughput | 71.01 requests/s |
| p50 / p95 / p99 | 340.53 / 626.12 / 928.45 ms |
| Maximum latency | 5596.45ms |
| Errors | 21 (0.008214%); {"TimeoutError": 21} |
| Sampled API peak RSS / average CPU | 265.31 MiB / 16.23% of one core |
| Session renewals | 325 (no tokens recorded) |
| API restart / isolated baseline restore | 2.03s / 0.90s |
| Working MVP check during load | Case count and audit chain unchanged; not a full-table case-content snapshot |

Phase 3 baseline: 63.60 requests/s, p95 689.43ms, 0.1938% timeouts over 600 seconds. Current changes: throughput +11.66%, p95 -9.18%. This is the same bounded queue API/dataset/session workload on the shared host. Independent source/build/document verification and extended synthetic Medplum/HAPI validation occurred during the hour; do not causally attribute changes without a controlled repeat. Raw rows stream to disk and progress/RSS sample every 15 seconds. Other service resource usage is retained in a [single instantaneous Docker snapshot](../artifacts/issue-4/soak-container-resource-snapshot.json); it does not establish their peak usage.

This is not Synthea clinical-inference throughput, full-bundle UI capacity, real clinician concurrency, multi-day stability, HA, a production SLA or a clinical accuracy claim. Nonzero failures/tail latency remain material production concerns. No threshold was relaxed and no short run substituted for the hour. The initial process-session interruption at about 1975 seconds is retained separately and never combined with this completed run.

### Fault, reconciliation and recovery

Actual FHIR / CQF / AI readiness recovery: **12.13s / 68.51s / 2.03s** (predeclared 60/120/60s bounds). Failed FHIR/CQF reviews preserved previous assessment and success-audit count and raised alerts. AI outage used labeled rules fallback; subsequent actual model review took 8.70s. Current-drill parent/child traces and metrics were verified without clinical-source export. Injected partial DB failure/retry left one FHIR receipt and one committed logical event; altered replay was rejected.

Final private checkpoint restored into a separate database in **2.96s**. All **10 table row counts/hashes**, **847 audit events** and a restored application worklist read verified. [Restore proof](../artifacts/issue-4/final-restore-proof.json). `.runtime/issue4-final-checkpoint.dump` is private and not an off-host backup; transfer privately before workspace expiry if exact event history is needed. Source/fixtures recreate the demo. The dump covers the application database, not coordinated Medplum/HAPI/Keycloak/container-volume recovery; see [restore runbook](ISSUE-4-RESTORE.md).

## SYNTHETIC ONLY

The 24-case payer corpus has independently written engineering expectations: plan/wildcard precedence, explicit priority, conflict ties, effective/expiry dates, exceptions, approvals, pending isolation, changed sources and unknown/private criteria. Confusion counts: {"tp": 3, "tn": 21, "fp": 0, "fn": 0, "precision": 1, "recall": 1, "specificity": 1}. These classify synthetic workflow risk flags, with review-required not treated as a confirmed violation. Labels are not independent clinician/insurer outcomes. Calibration is unsupported: no adjudication probabilities or representative labeled outcomes exist. No real medical/payer rule is silently activated.

Historical Synthea data does not establish current acute admission evidence. Tests fail closed when current criteria are missing. HAPI base-structure validation removes profile declarations on validation copies and does not establish full US Core/IG certification. Mocked OAuth failures and local Medplum service authentication are not authenticated Epic SMART exchange. No clinical validation, payer approval, HIPAA compliance or production readiness is asserted.

### Desktop evidence and reproduction

[Live 1440/1920 workstation manifest](../artifacts/issue-2/issue4-live-final-20261021T214459Z/manifest.json), [new risk/Synthea workspace captures](../artifacts/issue-4/issue4-live-final-20261021T214459Z/manifest.json). The screenshots are unique actual browser captures with source references/hashes, not inherited mockups. Fixture preview captures are in the timestamped issue4-preview directories under artifacts/issue-2.

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
