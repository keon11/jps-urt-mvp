# RFP traceability

Public source: https://www.jpshealthnet.org/rfp/utilization-review-technology-and-optimization-partner-urt

The original RFP and Addendum 1 were retrieved on 2026-10-20. Source URLs and hashes of the original DOCX bytes are in `sources/provenance.json`; extracted text is retained for review. Addendum 1 extends the response deadline to November 3, 2026 at 2 p.m. CST. This software is a demonstration, not a submitted proposal or acceptance of contractual terms.

| RFP business capability | MVP implementation target | Production gap |
|---|---|---|
| Intelligent prioritized worklists | Persistent queue, illustrative rule scoring and local-model triage | Calibrated model and clinical/operational validation |
| Admission and observation review | Evidence-linked advisory disposition | Authorized criteria and regulatory review |
| Continued stay | Review using latest FHIR observations, longitudinal history | Validated longitudinal clinical criteria |
| Authorization and notifications | Local payer simulator, event/deadline tracking | Real payer/clearinghouse integration |
| Denial prevention | Illustrative documentation/status/authorization signals | Prospective validation; no claimed denial probability |
| Physician advisor escalation | Role-restricted escalation and reasoned decision | JPS-approved workflow and staffing |
| Explainability and audit | Source versions, rule/model version, decision history | Enterprise retention and independent audit storage |
| Reporting | Queue metrics, timeliness, simulated authorization and escalation | Enterprise reporting and outcome feeds |
| Epic and enterprise integration | FHIR R4 synthetic intake adapter | No Epic, ADT or JPS connectivity |
| Security, AI governance, HIPAA/HITECH | Local isolation, RBAC, audit and explicit limitations | BAA, risk assessment, TLS, encryption at rest, SSO/MFA, DR, support and governance |

The RFP states that the platform shall not autonomously change patient status, submit payer actions or replace clinical/regulatory review. The MVP preserves this boundary: assessment is advisory and payer events are simulated and user-triggered. No legal forms, addenda acknowledgments, bids or external messages are submitted.
