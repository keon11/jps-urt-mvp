# Phase 3 validation architecture and boundaries

The existing Medplum / CQF / Keycloak / PostgreSQL / Grafana / llama.cpp stack is retained. No new engine or dependency was installed. Existing CQF clinical recommendations and all eight workflows are preserved.

Policy ingestion reuses Cheerio, robots-parser and jsdiff. It records byte provenance separately from normalized text changes; a changed page hash does not establish a policy revision or new clinical requirement. Official policy dates and plan applicability remain unknown until verified. Original source bytes stay in private runtime/database storage and are not in the fixture preview.

The small typed synthetic candidate evaluator uses existing Zod and SHA-256 helpers. Its owned specification and labeled corpus are versioned; a corpus report is included in the existing approval test gate and exposed read-only at GET /api/policy-validation for admin/advisor. It does not activate rules or change live CQF decisions. Missing evidence is not a violation. Unknown context, ambiguities, stale sources and conflicting candidates require human review. Perfect metrics on 19 deliberately constructed synthetic acceptance labels do not establish independent clinical performance.

The FHIR contract reuses @medplum/fhirtypes and Zod; it maps the six owned fixture bundles and rejects dangerous references, conflicting identities and stale updates. It preserves content/version provenance and never writes to Epic. Public Epic CapabilityStatement discovery is separate from authenticated sandbox resource exchange, which requires a registered/authorized client. This narrow contract is not a complete HL7/US Core validator or Epic certification.

Reliability extends the existing isolated benchmark to ten minutes and retains every request's time, status, latency and session ordinal without tokens or source payloads. Existing reconciliation, restart, restore and real service fault drills are reused. New artifact destinations preserve prior Issue #2 proof. Fault trace verification excludes spans preceding the current drill. No Temporal, Kubernetes, duplicate inference or rules engine is justified by the measured workload.

Submission preparation reuses retained public RFP/addendum text, original source URLs and original byte hashes. The generator checks each quoted requirement against a concrete source line and each evidence path before producing traceability. Draft financial/company/legal fields remain blank or explicitly unknown. It does not connect to the submission portal, sign, accept terms, send communications or make a bid.

## License and compatibility inventory

| Reused component | Existing pinned version | License | New use |
|---|---|---|---|
| @medplum/fhirtypes | 5.2.6 | Apache-2.0 | FHIR R4 types; synthetic mapping contract |
| Zod | 4.1.12 | MIT | Strict synthetic policy/context and resource envelopes |
| Cheerio | 1.1.2 | MIT | HTML evidence extraction and XML metadata recognition |
| robots-parser | 2.3.0 | MIT | Official-source access check |
| jsdiff | 8.0.4 | BSD-3-Clause | Normalized source comparison |
| Playwright | 1.56.1 | Apache-2.0 | Actual fixture/live desktop browser checks |

Node 24 and the existing PostgreSQL schema/adapters remain compatible. Full existing direct dependency/license hashes are in dependency-licenses.json; transitive/container/model legal and security review remains a production requirement.
