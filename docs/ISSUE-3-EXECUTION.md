# Issue #3 execution evidence

Working branch: dev/phase-3-validation. The prior MVP/Issue #2 checkpoints and main are preserved.

## Preview gate
The requested deployment verifier ran first, unchanged, and passed against the inherited Issue #2 configuration. It did not test a hosted deployment. Corrected both static config verifiers and the Vercel branch gate to the existing Phase 3 branch; main and the old branch are disabled. No backend deployment or credentials are bundled. Preview browser captures run separately at 1440 and 1920 pixels.

## Acceptance before extended measurement
Reuse the existing isolated PostgreSQL/worklist benchmark, conditional FHIR receipts, audit verification and fault drills; do not add a second workflow/rules engine. Extended interval: 600 seconds, 25 authenticated sessions, 10,000 additional cloned fictional queue records. Gates: p95 <=1000ms, error fraction <1%, throughput >=20/s, API restart <=15s, restore <=120s. Preserve per-request durations/statuses, 15-second samples and failed results. This is a ten-minute single-host API soak, not HA or an enterprise long-duration certification. Fault/reconciliation scripts execute sequentially after load, never concurrently with browser mutations.

Policy expectations must be stored in a versioned synthetic corpus before the evaluator is run. Tests cover inclusive effective/expiry boundaries, plan identity, contradictions, exceptions, missing evidence, stale evidence and ambiguous terms. All recommendations stay illustrative and human-reviewed; no real payer rule is auto-published.

## Policy gate
19 versioned synthetic expected outcomes passed (TP=4, TN=15, FP=0, FN=0 for synthetic allow-to-proceed classification). Labels were written before evaluator execution; these are same-author engineering expectations, not qualified independent clinical labels. The report route is restricted to admin/advisor and the extended corpus gates policy candidate testing; pending changes remain isolated. Local integration suite passed 23/23. CMS robots permitted retrieval this session; two retained page hashes differ but extracted text does not. Dates, plan scope and authentic official revision remain unknown; zero official executable rules were inferred. The extractor now records explicit unverified policy type/applicability.

## Interoperability gate
Added a narrow synthetic FHIR R4 mapping/reconciliation contract using existing Medplum FHIR types and Zod. Six fixtures preserve identity, content hashes and source versions; negative tests reject unresolved external references, duplicate records, wrong subject/class, stale snapshots and content changes with unchanged versions. This is not an exhaustive FHIR/profile validator. The public Epic metadata endpoint was probed read-only with no patient request; exact status/format is in epic-conformance.json. No authorized client/token/tenant was supplied, so authenticated Epic interoperability and JPS integration are not performed or claimed.
