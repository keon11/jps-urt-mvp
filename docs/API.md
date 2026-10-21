# API and adapter contract

OpenAPI 3.1: [openapi.json](openapi.json), also authenticated `GET /api/openapi.json` while running. API origin is `http://localhost:3000`; all workflow paths start `/api`. FHIR storage is Medplum `/fhir/R4/`, and CQF operations use HAPI `/fhir/`.

## Identity and permissions

`POST /session` accepts `{username,password}` and returns `{id,name,roles}` with an HttpOnly SameSite=Strict session cookie. `DELETE /session` clears it. API clients may instead supply a Keycloak JWT with `Authorization: Bearer ...`. Issuer, audience `ur-web`, signature, expiry and recognized application roles are checked server-side.

| Action | Reviewer | Advisor | Admin |
|---|---|---|---|
| Read cases, evidence, reports, rules, service status, audit | Yes | Yes | Yes |
| Intake or synthetic observation update | Yes | No | Yes |
| Run initial / continued-stay review | Yes | Yes | Yes |
| Simulate payer events / notifications | Yes | No | Yes |
| Escalate | Yes | No | Yes |
| Record human decision | No | Yes | Yes |

`GET /health` and aggregate `GET /metrics` are unauthenticated loopback operational endpoints. No clinical payloads are exposed there. Logout clears the cookie; an already-issued bearer token remains usable until its short expiry. Production needs proper revocation/SSO/session policy.

## Case operations

- `GET /fixtures` lists the six allowlisted scenario IDs. `GET /fixtures/{id}` returns their fictional transaction bundles.
- `POST /intake` accepts one exact shipped bundle and requires `Idempotency-Key`. New cases return 201; duplicates return 200 and `{case,duplicate:true}` without overwriting clinical versions. Conflicting key reuse returns 409. Unknown/modified bundles return 422 before FHIR persistence.
- `GET /cases` returns an array sorted by current review priority; stale scores sort below current scores. `GET /cases/{id}` returns a single case.
- A case contains `id`, `patient_id`, `encounter_id`, `label`, `scenario`, `bundle` (versioned source snapshot), `workflow`, optional `assessment`, timestamps and derived `operational` flags. Canonical clinical resources remain in Medplum.
- `POST /cases/{id}/reviews` accepts `{kind:'initial'|'continued-stay'}`. Response includes the updated case, recommendation, continued-stay recommendation, baseline/final priority, illustrative risk signals, missing evidence, validated model result or explicit fallback, source versions, CQL expressions, provenance, rule version, demo clock and evaluation time.
- `POST /cases/{id}/synthetic-vitals` accepts numeric `{spo2,systolic,expectedNights}`. It updates the fictional FHIR observations and clears assessment/human decision, preserving historical audit and FHIR versions.
- `POST /cases/{id}/authorization` accepts `{action,eventId,outcome?}`. `eventId` is a UUID. Actions are `submit`, `payer-response`, `notify`, `simulate-expiry`. `outcome` is required only for `payer-response`: `pending-information`, `approved`, `partial-approved`, `denied`. Invalid transitions and conflicting event reuse return 409. Receipts reference synthetic FHIR Claim/ClaimResponse resources; there is no external transport.
- `POST /cases/{id}/escalations` accepts one predefined reason. `POST /cases/{id}/decisions` accepts predefined disposition/reason values documented in OpenAPI. Both require current review evidence; decisions additionally require active escalation and the advisor/admin role. An override requires `clinical-judgment-override`.
- `GET /cases/{id}/audit` returns its full history; `GET /audit` returns the latest 250 cross-case events. `GET /reports` returns current operational counts, age bands, signals, AI modes, human outcomes and recent activity. These are demonstration counts, not validated outcome or accuracy metrics.

## Failures and consistency

400 denotes missing request headers/credentials, 401 invalid authentication, 403 forbidden role/origin, 404 unknown case/fixture, 409 conflicting state or stale in-flight work, 413 oversized payload, 422 invalid inputs, 429 login throttling, and 502 dependency failure. Errors return `{error:string}`. No phase or review success is claimed after a dependency failure.

FHIR transactions make clinical intake atomic; application state/audit are committed in a separate PostgreSQL transaction. Retry uses deterministic resource IDs and idempotency tracking. A crash between systems can leave orphaned FHIR resources/receipts; production requires an outbox/reconciliation mechanism. An in-flight review rejects intervening application case changes. Direct writes to Medplum can still race a review; production needs subscription/version reconciliation and stronger concurrency policy.

The CQF adapter removes Medplum-specific `meta.project`/`meta.compartment` fields from the supplied FHIR R4 bundle while retaining source versions in lineage. Numeric features are extracted from source observations; CQF evaluates constructed illustrative CQL expressions. AI receives those illustrative signals and allowed evidence references, not arbitrary clinical text. No unvalidated model citation is accepted.

## Synthetic policy governance (Issue #2)

`GET /api/policy-evidence` returns immutable document metadata, tables, candidate citations and revision differences. `GET /api/policy-center` adds active document/revision, publication history, role capabilities and visible correction requests. Clerks see their own requests; supervisor/clinical-authority roles can review all requests.

`POST /api/policy-changes` accepts `{documentId, reason, eventId}` for the two registered fictional revisions. `POST /api/policy-changes/:id/actions` accepts `{action, eventId, expectedVersion}`; supported actions are request-approval, verify-evidence, analyze-conflicts, run-tests, supervisor-approve, approve, reject, request-evidence, publish, rollback. The server enforces actor role, proposer independence, current lifecycle, source/test approval, effective date and publication conflicts. `POST /api/policy-suspension` accepts `{eventId, expectedRevision}` for authorized safety suspension.

`GET /api/cases/:id/authorization-review` returns active documentation requirements, evidence, missing items, policy revision, assessment source hash/currentness and internal history. POST accepts `{action, eventId, expectedPolicyRevision, assessmentSourceHash}`. Actions: request-information, escalate, approve-internal-next-step. Missing evidence is not a confirmed violation. Internal approval does not change insurer authorization or the source FHIR encounter. New schemas are strict, return 422 for malformed inputs, 403 for role denials and 409 for stale/conflicting operations. Identical event retries return the original result; altered actor/payload replays are rejected. These are synthetic product APIs, not claims of a certified payer standard.

`GET /api/encounter-worklist?limit=50&offset=0&q=...` provides authenticated bounded summary pages, total count and nextOffset. Limit is 1–100; offset is nonnegative and capped; search text is at most 80 characters and LIKE wildcards are escaped. Full FHIR bundles are omitted. The legacy `/api/cases` response remains compatible and is not claimed to have the same large-queue capacity as this bounded API. `GET /api/operational-alerts` measures dependency readiness and returns local warnings; it sends no external notifications. HTTP request duration histograms are available on the existing local metrics endpoint.

Issue #3: `GET /api/policy-validation` is authenticated and restricted to admin/advisor. It returns the version/hash of the owned synthetic corpus, per-case expected/actual results, and synthetic-only precision/recall/sensitivity/specificity. It accepts no arbitrary clinical payload or rule activation. Reviewer receives 403; anonymous receives 401. This is not clinical validation. Candidate lifecycle testing includes the corpus gate while preserving distinct supervisor/clinical publication approvals.

## Issue #4 synthetic evidence and risk review

`GET /api/synthetic-cohort` requires an authenticated reviewer/advisor/admin role. It returns the committed Synthea-derived cohort's patient summaries, resource counts, recent diagnosis/observation evidence, source export hashes and projection limitations. It is a read-only fixture-provenance view, not a live Epic chart or an admission recommendation. It does not add historical records to the original six-case worklist.

`GET /api/denial-validation` is restricted to admin/advisor and returns the versioned 24-case owned synthetic corpus, expected/actual results, workflow-flag confusion counts and an explicit unsupported-calibration statement. Reviewer receives 403 and anonymous requests receive 401. It accepts no arbitrary payer criteria or publication action.

`GET /api/cases/:id/denial-risk-review` requires the same authenticated clinical application roles and reads the existing published illustrative registry and case evidence. It compares current FHIR source bytes with the assessment hash; stale/missing/uncertain evidence requires review. Returned documentation/authorization risk is not an insurer determination or calibrated prediction. This GET never approves a rule, submits to an insurer or modifies patient status. Internal actions remain on the separate authorization-review POST, with role, event/idempotency, version and evidence checks.
