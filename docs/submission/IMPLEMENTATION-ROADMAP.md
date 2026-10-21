# Implementation roadmap — proposed production work, not a commitment

The engineering demo is available now; production implementation dates/costs require JPS discovery, authorized criteria, clinical governance, procurement and contracted resources. No production completion date is promised by the proposal deadline.

| Milestone | Existing evidence | Production exit requirement | Dependency / owner |
|---|---|---|---|
| Synthetic demonstration | Eight working workflows; Synthea/FHIR corpus; case review and policy governance | Confirm intended use, user roles and representative workflow requirements | Hospital operations and clinical sponsor |
| Security/architecture discovery | Local modular foundation, roles/audit, private fixture-only preview | Data classification, threat/risk assessment, hosting/keys/network design, BAA and access approvals | JPS IT/security/privacy/legal |
| Epic interoperability | Public metadata/SMART discovery; synthetic/local Medplum/HAPI tests | Registered tenant/client/scopes, patient-context mappings, reconciliation and hospital acceptance | Authorized Epic/JPS integration owner |
| Payer criteria configuration | Owned illustrative policy evidence, approval lifecycle and synthetic negatives | Authorized payer/criteria rights, plan/effective-date matrix, exceptions and delegated signoff | Hospital clinical authority and payer/legal owners |
| Independent evaluation | Engineering golden corpus and raw measurements | Qualified blinded labels, error analysis, bias/fairness, representative data and clinical approval | Independent clinical reviewers |
| Reliability/security hardening | Single-host measured load/recovery/dedup/audit proofs | HA/DR, RPO/RTO, multi-day testing, encryption, enterprise SSO/MFA, on-call and incident response | Infrastructure/security/operations |
| Pilot and adoption | Synthetic desktop demo/script and tested human boundaries | Approved non-production then controlled pilot, training, rollback plan and operational metrics | JPS operations and clinical governance |
| Production operation | Not delivered or claimed | Contracted SLA/support, continuous monitoring, drift/revalidation and change approvals | Authorized contracting and service owners |

The one-hour queue workload does not establish Synthea clinical-processing throughput, long-term HA, production DR or clinical performance. Scope, staffing, pricing and schedule remain owner-approved proposal inputs.
