# Security and AI response draft — NOT AN ATTESTATION

Transfer verified answers into the official Exhibit G and any supplied AI questionnaire. This is not an invented copy of those forms. Unknowns must remain unanswered or explicitly marked pending; no certification or legal obligation is accepted.

| Topic | Evidence-based draft response | Outstanding production evidence / owner |
|---|---|---|
| Data | Only fictional tagged FHIR cases used; fixture preview is read-only and disconnected | Authorized data inventory/classification and data-flow review — privacy owner |
| Identity | Local Keycloak roles and server-side authorization tested | Enterprise SSO/MFA, credential lifecycle, periodic access review — security/JPS IAM |
| Encryption | Local backend is loopback HTTP and demo PostgreSQL configuration | Production TLS, encryption at rest, key rotation and secrets management — infrastructure |
| Audit | Chained SHA-256 events, DB triggers, actual restore verification | Independent immutable retention, access review and retention policy — security/legal |
| HIPAA/HITECH | Compliance not established; no PHI processed | Risk assessment, BAA, safeguards, policies and workforce evidence — privacy/legal |
| Availability | Single-host bounded tests; measured failures and recovery retained | Multi-zone HA, DR/RPO/RTO, long-soak and signed SLA — operations |
| AI | Pinned local llama.cpp/Qwen, schema-constrained evidence-linked outputs and rules fallback | Independent clinical labels, model drift/fairness review, approved intended-use and monitoring — clinical authority |
| Payer logic | Illustrative owned policy corpus, provenance, RBAC approval and rollback | Validated criteria rights, real plan contracts/effective dates and reviewer qualifications — clinical/payer owner |
| Epic | Synthetic FHIR mappings and public metadata probe only | Authorized tenant app/scopes and EHR reconciliation acceptance — integration owner |
| Incident response | No production incident-response service asserted | On-call, response plan/tabletop, notification commitments and contact roster — security/legal |
| Supply chain | Pinned direct dependencies, local license inventory and npm audit | Complete transitive/container/model license/security review, SBOM and patch SLA — security/legal |
| Public preview | Static fictional fixtures; no public backend or credentials | Hosted deployment permission/protection/access verification outstanding — Vercel owner |

Independent clinical validation, SOC 2, HITRUST, HIPAA compliance, denial reduction and production scalability are not claimed.
