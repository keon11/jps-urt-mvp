# JPS URT MVP — EXTRACTED BUILD CONTRACT
Version: 2026-10-20. Source: JPS RFP #20261404054 and provided security, AI, contract exhibits. This is an engineering extraction, NOT proof of implementation or compliance.

## North star
Build a working, repeatable, synthetic-data-only demonstration of AI-assisted utilization management. Target seven-day sprint; never claim that this is a HIPAA-compliant production system or an actual Epic integration.

## Procurement facts (RFP)
- JPS wants AI prioritization for inpatient/observation encounters, admission status review, continued-stay review, payer authorization/notification, denial-risk identification, physician advisor escalation, explainable recommendations, role-specific queues, dashboards and audit trails.
- Human oversight mandatory. NEVER autonomously change patient status, submit payer actions, or replace clinical/regulatory review.
- Requires Epic and relevant enterprise systems integration for production; FHIR/HL7/APIs/flat files may be used as approved.
- Requires HIPAA/HITECH safeguards, BAA, encryption, least privilege, audit, incident response, disaster recovery, vulnerability and penetration testing, and disclosure of PHI use for model training.
- Requires AI model cards, model/version/change history, accuracy/error/failure modes, fairness/bias assessment, disclosures, security and privacy documentation.
- RFP selection score: 30 points needs fit, 30 quality, 20 reputation, 20 price. Three references requested.
- Original RFP deadline Oct 20, 2026; user-provided addendum/listing reports extension to Nov 3, 2026 2 PM. Verify actual signed addendum before any bid.
- Pricing exhibit, contract terms, signed forms and vendor questionnaires are procurement deliverables, not automatically satisfied by a demo.

## Architecture: reuse over rewrite
1. Medplum: primary FHIR storage and reusable application components; prefer its existing authentication where sufficient, avoid redundant infrastructure.
2. HAPI/CQF/CQL: clinical criteria evaluation if compatible, pin versions and document limits.
3. HL7 Da Vinci CRD/DTR/PAS: reusable profiles and reference examples, NOT a live insurer connection or licensed payer policy.
4. Keycloak: add only if needed for demonstration of enterprise identity federation; avoid duplicate identity source.
5. Grafana: metrics, operational reporting; only if easier than Medplum-native charts.
6. Thin adapters: translate FHIR encounter data into review worklists, evidence-linked prioritization, rule results and audit events.
7. Local downloadable model: OPTIONAL. Benchmark CPU/memory; deterministic illustrative scoring remains available as explicitly rules-based fallback. Never call rules-based scores AI.

## Contract boundaries
- Synthetic patient data ONLY; never ingest real PHI, JPS records, production credentials or production Epic connections.
- Do not represent synthetic clinical/payer criteria as authoritative. No automated medical or payer decisions.
- Pin dependency versions, inspect licenses and transitive dependencies. No claims of SOC 2, HITRUST or HIPAA certification.
- Do not merge to main, change other repos, pay for services, publish PHI, or make binding representations.
- Commit only on a development branch. If initial repository has no commits, coordinate branch initialization before coding.

## Eight demonstrations and acceptance gates
D1 Intake: load >=100 explicitly synthetic FHIR encounters, reproducibly.
D2 Prioritization: rank cases with documented rationale; identical inputs yield repeatable results for deterministic baseline.
D3 Admission review: show illustrative inpatient-vs-observation review recommendation and supporting evidence; human approval only.
D4 Continued stay: show re-review trigger and supporting documentation.
D5 Authorization: flag missing/expiring fictional authorization and log reviewer action.
D6 Denial risk: flag illustrative risks and display uncertainty and evidence; do not promise financial recovery.
D7 Physician escalation: role-specific referral, accept/reject, timestamp and audit.
D8 Reporting: review queue metrics, timeliness, override reasons and immutable/auditable events.

## Seven-day sprint (engineering target, not guaranteed)
Day 1: dependency/version/license inventory, architecture decision record, runnable local dev stack, smoke tests.
Day 2: synthetic FHIR fixture generator, ingest, persistence, 100-case deterministic tests.
Day 3: clinical rules adapter, prioritization, source-linked explanations; tests.
Day 4: authorization, continued-stay, denial-risk scenarios; tests.
Day 5: reviewer dashboard, physician escalation, role/access tests.
Day 6: monitoring, audit trails, resilience, end-to-end tests, failure-mode handling.
Day 7: repeatable live demo, screenshots, test report, runbook, limitations and production gap register.

## Recursive execution protocol
FOR EACH PHASE:
  1. Inspect actual repository and upstream APIs; verify current state.
  2. Select the smallest reusable components and define testable outputs.
  3. Implement only missing adapters/features; keep third-party source as pinned dependencies.
  4. Run unit, integration, and end-to-end tests relevant to the phase.
  5. On failure, diagnose root cause, apply minimal fix, retest. After three materially distinct attempts, record blocker and continue independent tasks; do not infinite-loop.
  6. On success, commit on development branch with test evidence and proceed immediately to next phase.
  7. Never claim passing tests not run, working Epic integration not verified, or security compliance not established.
  8. Stop only for credentials, paid resources, production systems, real PHI, legal agreements, irreversible actions or security-sensitive permissions.

## Production gap register — required before hospital use
Actual Epic/JPS interfaces and agreements; authorized payer criteria and licensing; clinician-approved logic and prospective validation; security governance, BAA, risk analysis, access controls and logging verification; independent penetration testing; hosting/subprocessor agreements; disaster recovery and incident response exercises; operational SLAs; JPS acceptance and training; required insurance and vendor references.

## Deliverables
Runnable repo, lockfiles and setup script, fixture generator, 8 reproducible demos, screenshots, test evidence, architecture and license manifest, security/clinical limitations, production gaps, bid readiness checklist. Provide measured actual code size and execution timings rather than extrapolated claims.
