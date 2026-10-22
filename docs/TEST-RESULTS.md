# Executed verification results

## Phase 6 — latest verified engineering checkpoint

Current branch: `dev/phase-6-submission-acceptance`. All eight synthetic demonstrations and the 1440/1920 desktop workstation remain working. Final checks passed **45 unit, 25 integration, 10 browser tests**, both fixture widths, build, synthetic policy/denial/FHIR checks, recovery, reconciliation, audit and dependency audit.

The controlled 120s pair improved p95 from **178.97 to 132.24ms**, with zero errors in both intervals. The 600s follow-up recorded **136,459 requests, p95 156.35ms and zero errors**, including 50 renewals. These shorter diagnostics do **not** prove elimination of the Phase 5 one-hour timeouts or hospital-scale reliability.

Prepared a source-quoted matrix covering 379 nonempty RFP paragraphs, an unsigned 8-page proposal PDF/editable DOCX, unchanged blank official Exhibit A, internal blank-input costing workbook, required vendor-form checklist and a hashed technical demonstration package. Actual prices, legal/company/reference/HUB facts, signatures, clinical/payer/Epic/JPS approvals and Vercel project/protection remain external. **Nothing submitted; production and bid readiness remain false.**

See [the final report](PHASE-6-REPORT.md), [restoration instructions](PHASE-6-RESTORE.md), [source-paragraph matrix](submission/PHASE-6-TRACEABILITY.md) and [founder actions](submission/PHASE-6-VENDOR-FORMS.md). Stable product checkpoint: `abff54b7897e3c3cc1c7c78f90517111d28c7ce9`; private source bundle and application dump are separately verified and excluded from public packages. Earlier sections below are historical checkpoints.

## Issue #5 — measured performance (2026-10-22)

Current branch: `dev/phase-5-performance`. All eight demonstrations are preserved. Three full one-hour runs are retained. Reproduced baseline: 71.42 req/s, p95 535.06ms. Final CPU-budgeted queue: 265.85 req/s, p95 134.14ms, errors `{"502": 11, "TimeoutError": 45}`. Zero-timeout target met: **False**; all performance targets met: **False**. Failures remain part of the report. Final verification: 41 unit, 25 live integration, 10 browser tests and fixture preview at 1440/1920; restore, fault recovery, reconciliation, audit and npm audit evidence retained.

See [the actual report](ISSUE-5-REPORT.md), [measurement evidence](../artifacts/issue-5/verification-summary.json), [architecture](ISSUE-5-ARCHITECTURE.md) and [demonstration checklist](ISSUE-5-DEMO-CHECKLIST.md). These are bounded local synthetic queue measurements on a shared four-CPU quota, not clinical accuracy, hospital capacity, an SLA or production readiness. Epic/JPS authorization, authorized payer criteria, independent clinical validation, owner legal/commercial evidence and Vercel permission remain external gates. Earlier sections below are historical checkpoints.

Verified locally on 2026-10-20 with real modular services and entirely fictional data. These are executed local results; GitHub-hosted CI and a public deployment were not run.

| Check | Executed result | Evidence |
|---|---|---|
| Unit tests | **14 passed, 0 failed** | `artifacts/phase-5-unit-tests.txt` |
| Live integration suite | **14 passed, 0 failed** | `artifacts/final-integration-tests.txt` |
| Browser suite | **3 passed, 0 failed** | `artifacts/phase-5-browser-tests.txt`, `artifacts/browser-results.json` |
| TypeScript and production frontend build | **Passed** | `artifacts/phase-5-build.txt`, `artifacts/startup-run.txt` |
| Complete local startup orchestration | **Passed** | `artifacts/startup-run.txt` |
| Empty-data-directory PostgreSQL initialization | **Passed** | `artifacts/clean-init-results.json` |
| Medplum/CQF/Keycloak/local-model probes | **Passed** | `artifacts/foundation-results.json`, `artifacts/final-foundation-tests.txt`, startup transcript |
| Model checksum | **Matched pinned official SHA-256** | `artifacts/model-checksum.txt`, `docs/model-lock.json` |
| Full npm dependency audit | **0 reported vulnerabilities** | `artifacts/npm-audit-full.json` |
| Production npm dependency audit | **0 reported vulnerabilities** | `artifacts/npm-audit.json` |
| Audit integrity | **130 events verified** | `artifacts/audit-integrity.json` |
| Final demo readiness | **6 fictional cases with current local-model assessments; all services ready** | `artifacts/final-readiness.json` |
| Shell and Compose configuration validation | **Passed** | Executed `bash -n scripts/start-demo.sh` and `docker compose config --quiet` |

The live suite uses Medplum, HAPI/CQF, Keycloak, Valkey, PostgreSQL, local llama.cpp inference and Grafana. It covers role restrictions, idempotent intake, conflicting event/key reuse, changed FHIR versions, continued stay, source Provenance, actual authorization receipts, explicit physician overrides, preservation of source encounter class, provisional information requests, report counts and sorted priority, restricted Grafana SQL access, and real Grafana datasource queries. Isolated fault-injection API instances demonstrate that CQF and Medplum outages return an error without replacing assessment/audit history.

The main browser test performs all eight requested scenarios through the running UI. The other browser tests verify session recovery and a rendered Grafana dashboard backed by live SQL aggregates. Screenshots show actual application state during those flows, including human decisions and simulated authorization events. They are not static mockups.

The startup script was executed end to end in this environment using persistent service volumes. Fresh PostgreSQL initialization was tested independently with the actual official image entrypoint and an empty isolated tmpfs. A second complete clean-machine deployment, load tests, real payer/Epic integration, container vulnerability scanning, formal clinical validation and production security/compliance assessment were not executed or claimed.

Earlier failures and repairs are recorded in `STATUS.md`. Final successful transcripts supersede earlier/interrupted attempts. Source file hashes are retained in `artifacts/source-manifest.json`; Git history identifies the completed phase commits. Audit-chain verification and final readiness results are retained separately after the final synthetic data preparation.

## Issue #1 desktop redesign — 2026-10-21

These results supersede the historical mobile presentation checks. Mobile is outside current scope. No backend, clinical rules or model changes were required.

| Check | Executed outcome | Evidence |
|---|---|---|
| Unit suite | 14/14 passed, no skips | [Log](../artifacts/desktop-redesign/unit-tests.txt) |
| TypeScript and live frontend build | Passed | [Log](../artifacts/desktop-redesign/build.txt) |
| Real-service integration | 14/14 passed, no skips; includes outage behavior, FHIR versions, RBAC, authorization, advisor decisions, reporting | [Log](../artifacts/desktop-redesign/integration-tests.txt) |
| Live browser | 5/5 passed: eight-scenario walkthrough, session recovery, live Grafana, desktop acceptance at 1440 and 1920 | [Log](../artifacts/desktop-redesign/browser-tests.txt), [JSON](../artifacts/browser-results.json) |
| Static fictional preview | Build, credential/source-map scan, synthetic markers/counts, and browser check passed; zero API/external requests | [Log](../artifacts/desktop-redesign/preview-tests.txt), [JSON](../artifacts/desktop-redesign/preview-browser-results.json) |
| Desktop screenshots | Seven screens at both requested widths, actually captured and visually inspected; additional 1280px overflow and keyboard checks | [Index](DESKTOP-REDESIGN.md#actual-screenshots) |
| Audit integrity | Full local append-only hash chain verified | [Log](../artifacts/desktop-redesign/audit-verification.txt) |
| Dependency audit | Zero reported vulnerabilities | [Log](../artifacts/desktop-redesign/npm-audit.txt) |
| Preview configuration | Vercel property schema and branch/environment build gate checks passed | [Log](../artifacts/desktop-redesign/config-checks.txt) |
| Remote Vercel deployment | **BLOCKED**, not passed: connector returned 403 during link-only project creation; no independent CLI credentials | [Record](../artifacts/desktop-redesign/vercel-blocker.json) |

The first new focus assertion was corrected to test actual keyboard Tab navigation. Visual inspection led to repairs for active navigation contrast and unbounded audit/authorization history. Final browser captures include the corrected UI. Credential values are absent from the public frontend build; no protected service was exposed. Existing local demo defaults remain in original history and backend fixture configuration and must not be reused for a public service.

Local implementation acceptance passes. End-to-end **remote preview deployment acceptance is incomplete** until an authorized Vercel connection can create/link the project, protection is verified, the exact development commit is deployed as a preview, and the actual hosted URL is tested. A local fixture test is not evidence of a live Vercel deployment or live backend integration.

## Issue #2 evidence

The current report is [ISSUE-2-REPORT.md](ISSUE-2-REPORT.md); detailed phase results and preserved failures are under `artifacts/issue-2/`. Final suites cover 21 unit tests, 22 real-service integration tests, seven live browser scenarios/tests (including the original eight-workflow walkthrough), and the isolated read-only fixture browser check. Phase counts increased as the policy, governance, retry and bounded-worklist checks were added. The report distinguishes local passes from Vercel 403, founder visual approval, Epic/JPS access, authentic policy revision completeness and clinical-validation gaps.

Issue #3 final local regression: 28/28 unit, 23/23 live integration, 7/7 live browser; fixture browser passed at both 1440/1920. Builds, deployment verifier, preview credential scan and npm audit passed. Ten-minute load passed predeclared gates with 74 timeouts (not zero errors); the failed token-expiry attempt and raw measurements are retained. Actual FHIR/CQF/AI outage, reconciliation and full-table restored application checks passed. Detailed numbers, screenshots, scope and blockers: [ISSUE-3-REPORT.md](ISSUE-3-REPORT.md).

## Issue #4 final local proof

41/41 unit, 25/25 live integration, 10/10 live browser and one fixture browser test at each desktop width passed. All eight demonstrations remain tested. Full build, preview credential/static scan, source fingerprints, audit integrity and npm audit (zero reported vulnerabilities) passed. Actual Synthea proof: 16 generated patients, 6,650 clinical imports, 64 representative reads, 64 HAPI base validations and local version reconciliation. Continuous 3600.160-second bounded queue soak: 255,665 requests, 71.01 requests/s, p95 626.12ms, 21 timeouts (0.008214%); independent raw recomputation passed. Final restore verified all 10 application table hashes, 847 audit events and restored worklist read in 2.96s. Scope, retained failures, resource/recovery measurements, screenshots and external blockers: [ISSUE-4-REPORT.md](ISSUE-4-REPORT.md). These are synthetic/local engineering results, not clinical/insurer validation or production certification.
