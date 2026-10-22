# AGENTS.md — JPS Hospital MVP execution contract

## Mandatory scope
Repository: keon11/jps-urt-mvp
Working branch: dev/phase-5-performance (existing branch based on the verified Issue #2 checkpoint)
Do not create another repository or branch. Never merge to main. Keep all data synthetic and do not expose public demo credentials.
Read GitHub issues #1 and #2, with issue #2 taking priority for new features and issue #1 for UI visual acceptance.

## Recursive work loop
Inspect existing code -> identify smallest missing capability -> reuse licensed upstream module if useful -> implement -> test -> repair -> verify -> commit -> continue.
Proceed without routine questions. Keep the last tested MVP working. Stop for external credentials, spending, PHI, real payer submission, clinical/legal commitments, or irreversible actions.
If the coding environment is unavailable or Plan Mode prevents edits, state that fact. Never claim execution occurred.

## Phase 1: Desktop interface acceptance
- Verify new screenshots rather than reused artifacts. No visible Clarity UR branding.
- Real desktop clinical workstation at 1440px/1920px, not generic SaaS cards.
- Keep eight existing demonstrations. Do not copy Epic proprietary code/assets.

## Phase 2: Narrow policy intelligence vertical slice
- Use permitted official policy source(s) with source URL, hash, effective date and extracted provenance; fallback to explicitly synthetic fixtures if access is restricted.
- Compare versions; produce candidate rules, never auto-activate clinical policy.
- Avoid installing redundant crawling or rules engines.

## Phase 3: Rule governance and authorization controls
- Clerk proposes change; supervisor reviews; clinical authority approves medical criteria; version/rollback/audit.
- Pending change must not affect other clerks. Separate internal authorization review from external insurer approval.
- Add real functioning UI buttons, server-side RBAC and regression tests.

## Phase 4: Reliability proof
- Predeclare measurable latency/throughput/error/recovery criteria.
- Run synthetic load, outage, restart, reconciliation, duplicate and audit tests; publish actual metrics.
- Preserve failure logs; do not claim enterprise/clinical readiness without independent validation.

## Phase 5: Preview
- Vercel is frontend only. Existing deployment permission blocker is not a reason to stop local feature work.
- Never expose the insecure demo backend or credentials. If remote preview is blocked, produce reproducible local desktop screenshots and fixture-only static build.

## Acceptance
- Updated docs, dependency/license inventory, real screenshots, passing build/tests and honest gaps.
- Commit and push to dev/phase-5-performance. No main merge.

## Issue #3 execution
Issue #3 controls this sprint: deployable fixture preview, provenance and golden synthetic correctness corpus, FHIR sandbox conformance, longer measured reliability, and draft RFP preparation. Never submit or invent company/legal/clinical evidence.

## Issue #4
Use Issue #4 for the current stage order and acceptance: Synthea/FHIR/SMART proof, synthetic policy/denial correctness, one-hour minimum measured soak, desktop fixture preview and draft submission readiness. Preserve external-authentication/clinical/legal boundaries and all prior checkpoints.

## Issue #5
Issue #5 controls current performance work. Preserve Phase 4 and all eight demonstrations. Profile first; predeclare targets; compare same-hardware 3600-second/25-session/10006-row bounded queue runs. Preserve raw failures. No cache, redundant infrastructure or weaker safety/auth checks without measured justification. Commit/push only this development branch; never merge main.
