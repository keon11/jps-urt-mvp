# Phase 4 readiness ledger

## ENGINEERING VERIFIED

Working six-case/eight-workflow checkpoint preserved. Stage 1 local proof: pinned Synthea release/license, 16 generated patients, longitudinal clinical derivation/source hashes, generated Location reference repair, 64 Medplum writes/reads, eight HAPI base-structure validations without errors, actual local adapter pagination. Stage 2: published-policy case risk action, source citations and human-review boundaries; initial 37 unit/24 live integration/two risk-browser checks passed. Exact logs and commits are in artifacts/issue-4 and ISSUE-4-EXECUTION.md. Extended local FHIR proof now passed: 6,650 derived clinical resources imported with source hash metadata, 64 representative stored/read resources, 64 HAPI base validations, 22 synthetic patients paginated, actual generated-Patient update/duplicate/stale reconciliation and administrative-field restoration. Final whole-application checks and the one-hour gate remain pending.

## SYNTHETIC ONLY

All patients and labels are artificial. The committed Synthea projection is not an original or complete chart: generated contact identifiers and optional external provider context are removed, with transformations recorded. Medical history realism is not clinical truth or representative hospital data. HAPI tests remove US Core profile claims on validation copies, preserve informational extension warnings, and do not constitute full IG certification. Mocked transport expiry/permission/retry tests and local Medplum token usage are not authenticated Epic SMART tests.

Payer cases use owned fictional rules/approval flags and independently written engineering expectations. Metrics classify workflow risk flags, not medical necessity or adjudication accuracy. Calibration is unsupported because no insurer outcome probabilities/representative labels exist. Unknown private criteria remain unknown. Current active case risk is based only on the existing published illustrative registry and never submits anything or changes clinical source status.

The hour benchmark is the same bounded queue workload used in Phase 3: cloned queue records, 25 same-role sessions, paginated authenticated reads. It is not Synthea clinical-inference throughput or concurrent human workflow capacity. It is **RUNNING**, not passed, until 3600 seconds and all predeclared gates are verified. No HA, enterprise SLA, independent clinical accuracy or HIPAA compliance claim.

## EXTERNAL VALIDATION REQUIRED

- Authorized non-production Epic client/tenant/read scopes and secure token-provider configuration; public SMART/CapabilityStatement discovery alone is available.
- Hospital/JPS authorization and approved interface/clinical workflows; no JPS production connection is attempted.
- Payer agreements/private plan criteria/effective dates and authorized medical-necessity criteria rights; no real insurer determination or transaction.
- Qualified independent clinical reviewers/signoff and representative labeled evaluations, including bias/fairness and outcome review.
- Vercel identity with project create/link permission in team kevionkt111-1687; current link-only attempt is forbidden (403). Remote branch/preview/protection remain unverified.
- Owner legal entity, references, commercial pricing, insurance, authorized signatory, applicable HUB/outreach evidence and official forms/addenda review. Draft preparation is not an offer or submission.
- Production security/operations: enterprise SSO/MFA, encryption/key management, BAA/risk assessment, independent immutable retention, incident response, HA/DR and contracted support.
