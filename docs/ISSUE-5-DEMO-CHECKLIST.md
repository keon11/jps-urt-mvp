# Hospital demonstration checklist — synthetic engineering only

Before presenting, select the verified Phase 5 commit and review its final measurement report; preserve the Phase 4 checkpoint. Use the separate loopback backend and local desktop workstation at 1440/1920. Obtain local account values privately; do not publish a backend, login values or a database dump. No production data or insurer transaction is part of this demonstration.

1. Start `TRACE_SAMPLE_RATE=1 npm run start:demo`; verify dependency readiness. Confirm the fictional/illustrative banner, six encounters and current source evidence. A stale finding must display review/refresh needs rather than an unsupported answer.
2. Walk through all eight scenarios: fictional intake/FHIR; AI prioritization; inpatient/observation suggestion; continued stay; simulated authorization/notification; documentation risk; physician advisor/human review; operational reporting/audit. Keep recommendations illustrative and decisions human controlled.
3. Show Authorization Review evidence, missing information and separate internal next-step action. Explicitly state that internal approval is not insurer approval. Demonstrate duplicate/retry protection using the tested simulator, never a real payer.
4. Show policy evidence and lifecycle with proposer/supervisor/clinical roles. Pending changes must not affect other reviewers; no private contract or official clinical rule is silently inferred/published.
5. Open Operations → Synthea cohort. These are actual generated longitudinal histories and source hashes, not current acute-admission evidence, original complete charts or authenticated Epic charts.
6. Open the Phase 5 before/after report. Quote only the actual bounded queue measurements, all three durations, timeouts, max latency and hardware limitations. Do not call these clinical-inference throughput, real clinical accuracy, HA or an SLA. A zero-timeout goal is unmet if any timeout occurred.
7. Show the fresh desktop screenshots and read-only disconnected fixture preview. The fixture build has no live backend/AI/auth connection; hosted Vercel access is a separate permission gate.
8. Keep the restore proof/private dump available to the operator. It covers application tables/audit and a restored worklist, not coordinated DR of every clinical/identity service. Avoid fault/load tests during a presentation.

Rehearsal gate: current unit/build/live integration/browser/fixture checks, one-hour comparison, outage/reconciliation, application restore, audit and security evidence must be reviewed. The final report must mark actual passes, missed targets and unexecuted work rather than filling unknowns.

External readiness remains blocked until authorized owners provide Epic/JPS tenant/client/scopes and interface acceptance; licensed/approved payer and clinical criteria; qualified independent clinical validation; procurement/legal/signatory/references/pricing/insurance evidence; and Vercel project permission/protection. None are supplied by a synthetic engineering demonstration. Source-backed owner drafts are under docs/submission; they remain unsigned/unsubmitted.
