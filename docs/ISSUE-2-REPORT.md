# Issue #2 delivery report — 2026-10-21

Working branch: [dev/issue-2-execution](https://github.com/keon11/jps-urt-mvp/tree/dev/issue-2-execution). No merge to main. Original autonomous MVP and previous desktop branches remain unchanged.

## Delivered behavior and acceptance boundaries

| Phase | Verified result | Remaining boundary |
|---|---|---|
| A: desktop workstation | Unnamed desktop UI, top task navigation, persistent encounter rail, focused clinical/source workbench; real 1440/1920 captures; original eight demonstrations preserved | Founder visual acceptance remains pending; no Epic proprietary UI/assets used |
| B: policy evidence | Immutable originals/provenance, owned synthetic revisions, exact citations, tables and candidate difference | One CMS page initially retrieved; later robots check 403; authentic official revision and dates unverified |
| C: governance | Real proposal, evidence/conflict/testing stages, independent approvals, publication/rollback/suspension and internal authorization actions; server RBAC/idempotency tests | Synthetic accounts are not clinical credential verification; no real medical policy activated |
| D: reliability | Preserved failed runs, measured query repair, real partial-transaction reconciliation and FHIR/AI outage/recovery proofs | Single host and bounded workload; no enterprise HA, long-soak or clinical accuracy claim |
| E: preview/delivery | Credential-free read-only fixture build, tested evidence/policy browsing, final tests and restore package | Vercel project creation still 403; hosted URL, Git linkage/protection and live backend integration are not claimed |

Policy candidates are explicitly fictional. Official CMS text never becomes an executable rule automatically. Pending changes never alter active evaluations. Admin/supervisor cannot substitute for separate clinical-authority approval. Internal next-step approval is distinct from insurer authorization and never changes the source FHIR encounter class.

## Executed tests and measurements

Final dependency-set checks: **21 unit, 22 live integration, 7 live browser tests**, plus **1 isolated fixture browser test**, TypeScript/build and static preview scan. Original eight workflows are included in the live browser walkthrough. Npm audit reports zero vulnerabilities after the jsdiff patch. Full logs are in [artifacts/issue-2](../artifacts/issue-2/); [verification summary](../artifacts/issue-2/verification-summary.json) records machine-readable outcomes. GitHub CI runs unit/build/fixture artifact scan/audit, while the logged integration/browser tests use the actual local services.

| Measurement | Actual result | Scope |
|---|---|---|
| Queue load | 7,457 requests / 120.36s; 61.96/s | 10,000 added queue clones + six original records; 25 distinct authentication sessions of the same synthetic reviewer role |
| Read latency | p50 392.39ms; p95 743.23ms; p99 1119.00ms; max 2589.04ms | Authenticated bounded worklist API, not full-bundle UI or clinical inference |
| Errors | 0 / 7,457 | Same predeclared thresholds after two retained failed runs |
| Resources | Peak API RSS 170.59 MiB; average API CPU 19.07% of one core | Shared local host, 5 logical CPUs; no extrapolated production capacity |
| API restart | 2.32s | Isolated instance; persisted count/audit unchanged |
| FHIR recovery | 13.24s | Actual Medplum stop/start; failed review preserved previous assessment and success-audit count |
| AI recovery | 2.03s readiness; subsequent model review 60.06s | Rules-only fallback while unavailable; no fake model success |
| Final restore | Full table hashes/counts, application read and audit verified | Private dump `.runtime/issue2-final-checkpoint.dump`; detailed latest duration/counts in restore proof |
| Reconciliation | Three FHIR Claims before repair; one resource/one committed event after identical injected-failure sequence | Conditional-create receipt + payload fingerprint + durable intent journal; altered replay rejected |
| Observability | Real HTTP histograms, dependency alerts and correlated application/upstream traces | Local evaluation/export; no external notification or source-content export |

The 120-second load interval is not evidence of sustained multi-day operation. The legacy unbounded full-bundle API/UI is not certified for the paginated API's capacity. Missing documents are reported as missing evidence, not confirmed violations. Candidate conformance tests are not independent clinical validation or sensitivity/specificity estimates.

## Fresh desktop evidence

Latest running-application capture set: [`phase-e-final-253f123-20261021T150846Z`](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/manifest.json). Each image has exact dimensions and SHA-256; the manifest includes capture time, source base commit and working-source hashes. No inherited screenshot is presented as a fresh capture.

| Screen | 1440px | 1920px |
|---|---|---|
| Encounter queue | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1440/queue.png) | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1920/queue.png) |
| FHIR evidence | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1440/evidence.png) | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1920/evidence.png) |
| AI review / source lineage | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1440/ai-review.png) | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1920/ai-review.png) |
| Payer simulator | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1440/authorization.png) | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1920/authorization.png) |
| Physician advisor | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1440/advisor.png) | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1920/advisor.png) |
| Operations / alerts | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1440/operations.png) | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1920/operations.png) |
| Audit | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1440/audit.png) | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1920/audit.png) |
| Policy Management Center | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1440/policy-center.png) | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1920/policy-center.png) |
| Internal Authorization Review | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1440/internal-authorization.png) | [Capture](../artifacts/issue-2/phase-e-final-253f123-20261021T150846Z/1920/internal-authorization.png) |

[Side-by-side before/after comparison](../artifacts/issue-2/comparison-phase-e-final-253f123-20261021T150846Z.html). The inherited-image audit explicitly identifies the unchanged old login/Grafana images. New workstation captures are visually distinct from both old layouts. Corrected history regions remain keyboard focusable and retain all records.

## Reproduce and restore

Requires Node 24, Docker Compose, recommended 12–16 GiB RAM, disk for images/model and the existing loopback ports. From this branch:

```sh
npm run start:demo
```

Open http://localhost:3000 on the same machine. Obtain local seeded account values from the local operator; no password is prefilled or displayed in the UI. Keep all services on loopback. The bootstrap downloads/checks the pinned public model if necessary; it uses no paid model API.

Run data-mutating checks sequentially:

```sh
npm test
npm run build
npm run test:integration
npm run test:browser
npm run test:preview
npm run verify:audit
```

`npm run benchmark`, `npm run test:reconciliation` and `npm run checkpoint:verify` use isolated databases. `npm run test:recovery` temporarily stops the local Medplum/model services and restores them; schedule that drill when no other local demo is in progress. Do not run load/fault/data-mutating suites concurrently.

The final private dump was actually restored into a newly created database, all application table counts/hashes matched, the audit chain verified and a read-only restored application served the worklist. It was not restored over the working MVP. [Restore proof](../artifacts/issue-2/final-restore-proof.json). Runtime dumps/models are intentionally not committed and are not durable off-host backups; transfer the private dump through an approved channel before workspace expiry if exact event-history preservation is required. Source and six fictional fixtures can otherwise reconstruct the demo with the startup command.

Stable source checkpoints: original Phase 5 `b71b6e6`; prior desktop `ea5f71f`; Issue #2 A `22189a4`, B `101a501`, C `0719fef`, D `253f123`; the final E checkpoint is this report's containing commit. Inspect the checked-out full SHA with `git rev-parse HEAD`. No default-branch merge is part of restoration.

## Open-source inventory and remaining blockers

[Installed dependency/license inventory](dependency-licenses.json), [notices](THIRD-PARTY-NOTICES.md), [runtime image inventory](../artifacts/issue-2/runtime-images.json), [architecture](ARCHITECTURE.md), [security/production gaps](SECURITY-AND-PRODUCTION-GAPS.md), and [phase execution details](ISSUE-2-EXECUTION.md).

Medplum, HAPI/CQF, Keycloak, PostgreSQL, Grafana, llama.cpp/Qwen and the existing adapters remain verified by actual tests. Added only HTML parsing/access-rule comparison and tracing integrations needed by the slice. No redundant Drools, Temporal, Kubernetes or heavy extraction stack was installed. Epic's four inspected public repositories offer evaluation projects, not verified reusable EHR workstation UI source; no proprietary assets or endorsement are used.

**Vercel:** the current connection lists Hobby team `kevionkt111-1687`, but link-only project creation returns 403. [Exact blocker](../artifacts/issue-2/vercel-blocker.json). Grant the connected identity project-creation/link permission in that team through [Vercel](https://vercel.com/dashboard), without sending tokens in chat or committing credentials. Then create/link a preview-only project, verify repository/branch/protection, and deploy this development commit as a preview. `vercel.json` permits only `dev/issue-2-execution` in the preview environment, disables main, emits static `dist-preview`, and has no backend functions/proxy. No hosted preview URL exists yet.

**Epic/JPS/clinical/payer:** no authorized Epic client registration, JPS production access, real payer transport, private contract criteria or qualified independent clinical labels were supplied. Those integrations/validations were not performed and are not claimed. Commercial plans remain fictional. Official source dates and historical revision completeness require further verification; no license-gated token or contractual acceptance was automated. HIPAA compliance, production readiness, certification and real-world accuracy remain unestablished.

Final restored checkpoint: **587 audit events**, all ten application tables matched, restored application read passed in **4.03 seconds**. Latest [fixture preview screenshot manifest](../artifacts/issue-2/phase-e-preview-final-20261021T151319Z/manifest.json) includes four newly captured read-only screens. All final browser results are passing without retries/flaky tests.
