# Demonstration walkthrough

Start with `npm run start:demo`. If returning to a modified demonstration, stop the app briefly or leave it idle and run `npm run demo -- --reset` to restore fictional source values and initial workflow state while retaining history.

All criteria and payer deadlines below are illustrative. The model is a small local pipeline demonstration, not a clinically validated predictor. Source encounter status never changes automatically.

| Scenario | Actions in the running workspace | Expected observable behavior |
|---|---|---|
| 1. Synthetic intake/FHIR | Sign in as reviewer. Open **Synthetic intake**, download a fixture or ingest `respiratory`. Open **Clinical evidence**. | New intake persists a FHIR transaction; repeated intake returns the existing encounter. Evidence cards expose actual Medplum resource IDs/versions. Unknown or modified uploads are rejected. |
| 2. AI prioritization | Open **Maya Fictional**, select **Overview**, run initial review. | CQF evaluates criteria, local AI selects grounded urgency/citation, and the queue sorts by the resulting score. A failed AI result explicitly shows rules-only fallback. |
| 3. Inpatient/observation | Compare Maya with **Noah Fictional**. | Maya's fictional hypoxia leads to inpatient review; Noah's stable short-stay example suggests observation review. Both show illustrative criteria, source versions and human-review warnings. |
| 4. Continued stay | Open **Avery Fictional**, save oxygen 86, systolic 84 and expected nights 3, then run continued-stay review. | The old assessment clears, new FHIR observation versions are created, and the continued-stay recommendation changes. Restore 95/114/1 and rerun to demonstrate reassessment after recovery. |
| 5. Authorization/notification | Open **Isla Fictional → Authorization**. Simulate submission, pending information, resubmission, approval and notification. Approved/partial cases can simulate expiration. | State, internal deadline flags, event history and real synthetic Claim/ClaimResponse receipts update. No insurer is contacted. Rerun review to refresh stale priority after payer changes. |
| 6. Denial risk | Open **Leo Fictional → Overview**. | Missing fictional physician documentation raises an explained illustrative signal. No validated denial probability is displayed. |
| 7. Advisor/human review | Open **Rowan Fictional → Advisor review** and escalate. Sign out, sign in as advisor, open the physician advisor queue and Rowan. Choose Observation with **Clinical judgment override**, then record the decision. | The reviewer cannot finalize the decision. Advisor override is reasoned, tied to the assessment source hash, persisted and audited. FHIR encounter class stays unchanged. |
| 8. Reporting/audit | Open **Operations**, **Audit trail**, source-lineage details and the local Grafana dashboard. | Current counts, aging, authorization states, AI modes, human outcomes and real audit events appear. Audit hashes can be independently checked with `npm run verify:audit`. |

Actual browser captures are in `../artifacts/`: `00-review-queue.png` through `09-mobile.png`, plus `login.png` and the Grafana capture. The automated browser walkthrough covers all eight scenarios; see `browser-results.json` and `phase-5-browser-tests.txt` for executed results.
