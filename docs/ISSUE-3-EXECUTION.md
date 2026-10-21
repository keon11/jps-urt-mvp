# Issue #3 execution evidence

Working branch: dev/phase-3-validation. The prior MVP/Issue #2 checkpoints and main are preserved.

## Preview gate
The requested deployment verifier ran first, unchanged, and passed against the inherited Issue #2 configuration. It did not test a hosted deployment. Corrected both static config verifiers and the Vercel branch gate to the existing Phase 3 branch; main and the old branch are disabled. No backend deployment or credentials are bundled. Preview browser captures run separately at 1440 and 1920 pixels.

## Acceptance before extended measurement
Reuse the existing isolated PostgreSQL/worklist benchmark, conditional FHIR receipts, audit verification and fault drills; do not add a second workflow/rules engine. Extended interval: 600 seconds, 25 authenticated sessions, 10,000 additional cloned fictional queue records. Gates: p95 <=1000ms, error fraction <1%, throughput >=20/s, API restart <=15s, restore <=120s. Preserve per-request durations/statuses, 15-second samples and failed results. This is a ten-minute single-host API soak, not HA or an enterprise long-duration certification. Fault/reconciliation scripts execute sequentially after load, never concurrently with browser mutations.

Policy expectations must be stored in a versioned synthetic corpus before the evaluator is run. Tests cover inclusive effective/expiry boundaries, plan identity, contradictions, exceptions, missing evidence, stale evidence and ambiguous terms. All recommendations stay illustrative and human-reviewed; no real payer rule is auto-published.
