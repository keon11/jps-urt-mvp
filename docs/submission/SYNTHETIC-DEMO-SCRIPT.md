# Short synthetic demonstration script

Preparation: local Node 24 / Docker stack; run `TRACE_SAMPLE_RATE=1 npm run start:demo`. Use operator-provided local seeded role credentials; never display passwords or publish the local backend. The separate frontend preview is read-only and disconnected. All patients and criteria shown are fictional/illustrative.

1. Open the encounter queue at 1440/1920. Explain that priority is evidence-linked demonstration triage, not validated clinical accuracy.
2. Run synthetic intake for an allowlisted case. Show FHIR Patient/Encounter/Observation/Condition evidence and version/source lineage.
3. Review inpatient versus observation advice. Keep source clinical status unchanged; show the evidence and human review boundary.
4. Update only the provided synthetic vitals and run continued-stay review. Show stale assessment invalidation and new source versions.
5. Open Authorization and demonstrate the local payer simulator and notification history. Explicitly state no insurer is contacted and no real coverage determination is made.
6. Open Authorization Review, click Review risk evidence, and show missing-document/authorization flags with published policy citations. Explain that no risk identified is limited to the illustrative rules and is not a prediction of payer approval/denial.
7. Escalate to physician advisor, switch to the advisor role using operator credentials, and record a reasoned human advisory decision.
8. Show Operations, service alerts, audit timeline and aggregate Grafana reporting. Explain the measured test scope and remaining production gaps.

Optional policy governance: clerk requests a versioned synthetic correction; admin verifies evidence/conflicts/tests and supervisor approval; distinct advisor approves; admin publishes. Show pending edits do not affect another clerk; then show authorized suspension/rollback and immutable history. No real medical policy is activated.

Optional interoperability proof: show the Synthea generation manifest and the 16 derived fictional histories, 64 actual local Medplum resource reads and eight HAPI base validations. Distinguish actual local tests and public Epic SMART discovery from authenticated Epic sandbox testing, which requires an authorized client and has not occurred.

Close with the readiness ledger: ENGINEERING VERIFIED / SYNTHETIC ONLY / EXTERNAL VALIDATION REQUIRED. Do not state HIPAA compliance, clinical validation, insurer connectivity, JPS integration, an enterprise SLA or a submitted bid.
