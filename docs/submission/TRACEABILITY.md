# Draft source-backed traceability

Not a submission, commitment or statement of production compliance. Exact source quotations and original DOCX hashes are in traceability.json. Source freshness/addenda must be rechecked before submission.

| Requirement | Status | Evidence | Gap | Source line |
|---|---|---|---|---|
| prioritization | Synthetic demonstration | [Evidence](../../services/api/src/review.ts) | No calibrated clinical accuracy or representative data. | rfp.txt:169 |
| explainability | Synthetic demonstration | [Evidence](../../services/api/src/review.ts) | Authorized criteria and qualified independent clinical validation outstanding. | rfp.txt:170 |
| governance | Synthetic demonstration | [Evidence](../../services/api/src/policy-governance.ts) | No validated production payer/plan contract criteria. | rfp.txt:210 |
| oversight | Implemented demonstration boundary | [Evidence](../../services/api/src/workflow.ts) | Real payer submission and clinical status changes are disabled. | rfp.txt:130 |
| interoperability | Synthetic conformance only | [Evidence](../../services/api/src/fhir-conformance.ts) | No authenticated Epic/JPS tenant testing, ADT, interface certification or production reconciliation. | rfp.txt:176 |
| reliability | Proposed production work | [Evidence](../../docs/ISSUE-3-EXECUTION.md) | Measured single-host recovery/soak does not establish HA, DR or contractual SLA. | rfp.txt:211 |
| model-governance | Partial synthetic demonstration | [Evidence](../../docs/model-lock.json) | Model pinning/audit/fallback present; drift, fairness and clinical evaluation outstanding. | rfp.txt:212 |
| audit | Synthetic demonstration | [Evidence](../../services/api/src/store.ts) | Hash chain and application immutability are not certified WORM storage. | rfp.txt:213 |
| training | Proposed production work | [Evidence](../../docs/DEMO.md) | A demo guide exists; JPS training/go-live services not delivered. | rfp.txt:164 |
| pricing | Owner input required | [Evidence](../../docs/submission/pricing-working-template.csv) | Working worksheet only; official Exhibit A must be obtained/completed without changing its format. | rfp.txt:232 |
| references | Owner input required | [Evidence](../../docs/submission/OWNER-CHECKLIST.md) | No customer references supplied or fabricated. | rfp.txt:255 |
| private-criteria | Synthetic only; authorized criteria required | [Evidence](../../services/api/src/denial-risk.ts) | No private plan contract or real medical-necessity criteria inferred. | rfp.txt:171 |
| denial-risk | Synthetic workflow risk flags | [Evidence](../../services/api/src/denial-risk.ts) | No validated denial prediction, prospective outcome study or calibration. | rfp.txt:173 |
| hipaa-baa | External security/legal validation required | [Evidence](../../docs/SECURITY-AND-PRODUCTION-GAPS.md) | Compliance and BAA not established or accepted. | rfp.txt:186 |
| secondary-use | Boundary preserved in synthetic demo | [Evidence](../../docs/submission/SECURITY-AI-DRAFT.md) | No JPS data used; production use controls/agreements require approval. | rfp.txt:189 |
| model-evaluation | Proposed independent validation work | [Evidence](../../docs/submission/IMPLEMENTATION-ROADMAP.md) | Representative clinical labels, drift/bias evidence and signoff remain outstanding. | rfp.txt:212 |
| security | Draft; unknowns pending | [Evidence](../../docs/submission/SECURITY-AI-DRAFT.md) | Official forms and evidence require authorized owner/security/legal review. | rfp.txt:270 |
