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
