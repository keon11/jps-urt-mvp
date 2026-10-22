# Phase 6 final engineering acceptance and submission preparation

[Development branch](https://github.com/keon11/jps-urt-mvp/tree/dev/phase-6-submission-acceptance). Starting verified source: f121f8fd53dae9f787bdd36f47807930ec75eba4. Prior MVP phases remain ancestors; main is unchanged. [Machine proof](../artifacts/phase-6/acceptance-summary.json).

## Verified engineering result

All eight synthetic hospital demonstrations and the unnamed desktop workstation are preserved. Final results: **45 unit, 25 live integration, 10 browser tests passed**, plus fixture checks at 1440/1920. Build, policy/denial synthetic correctness, six synthetic FHIR mappings, query equivalence (32), deployment configuration, audit and npm audit (zero reported vulnerabilities) passed. None establishes clinical accuracy, complete regulatory/payer correctness, real Epic/payer connectivity, HIPAA compliance or production readiness.

Reused existing pg/Prometheus/Playwright and installed document tools; no new hospital runtime dependency, infrastructure or engine. Worklist now acquires one connection for the unchanged page/count statements and releases it even after either failure. Exact current counts, parameterized escaping, ordering, auth and the separate eight-connection clinical/write pool are preserved. Read-pool max remains two; request deadlines remain five seconds. Fixed-cardinality stage metrics contain no identity, query text or clinical content. Isolated read-only benchmark metrics collect process registry values without loading every clinical bundle via operational reporting; normal app reporting is unchanged.

## Actual performance and remaining failures

| Configuration | Seconds | Responses | Req/s | p95 ms | Max ms | Errors | Sampled peak API MiB |
|---|---:|---:|---:|---:|---:|---|---:|
| Current Phase 5 source baseline | 120.051 | 28,371 | 236.32 | 178.97 | 559.45 | {} | 253.28 |
| Single checkout + stage instrumentation | 120.107 | 31,619 | 263.26 | 132.24 | 510.45 | {} | 336.66 |
| Extended diagnostic (additional driver instrumentation) | 600.111 | 136,459 | 227.39 | 156.35 | 4446.40 | {} | 337.39 |

The controlled pair changes throughput by +11.40% and p95 by -26.11%. Sampled memory increased; one paired shared-host trial is not a statistical guarantee. The 600s follow-up includes extra driver instrumentation and token renewal, so it is not another identical A/B sample. All requests/statuses remain losslessly retained and independently recomputed. Full case-row hashes match over the follow-up snapshot interval; read-only enforcement and audit/live-MVP checks passed.

Final measured average stages (ms): acquire 96.698, page 6.299, count 2.071. Pool queueing is the measured dominant average at this bounded concurrency. Renewal calls: 50, maximum 2759.87ms. Driver event-loop p99/max: 143.79/903.87ms. Error-stage details are in stage-diagnostics.json. These observations do not explain every historical outage. Host quota/scheduling, driver/auth delays and pool acquisition remain distinctions to measure on dedicated resources.

**Timeout elimination remains unproven.** The prior Phase 5 final hour recorded 45 timeouts and 11 HTTP 502s; that failure is not replaced by a shorter zero-error interval. No one-hour Phase 6 reliability pass, hospital capacity, WAN/clinical inference throughput, HA or SLA is claimed. A representative sustained run with dedicated load generation and correlated outage evidence remains necessary.

## Recovery and desktop evidence

Actual FHIR/CQF/AI readiness recovery: 12.11/73.61/1.52s. Failed FHIR/rule reviews preserved prior assessment without false success audit; labeled AI fallback and real inference recovery verified. Reconciliation retained one FHIR receipt and one logical committed event after retries; altered replay rejected.

[Stable source/private transfer proof](../artifacts/phase-6/checkpoint-transfer.json) records the exact verified product commit and hashes; private files are excluded from the public ZIP. Private application restore verified 10 table hashes, 1001 audit events and an authenticated restored worklist in 3.48s. It is not a coordinated/off-host restore of every FHIR/identity/model volume. [Restoration procedure](PHASE-6-RESTORE.md). Fresh [workstation manifest](../artifacts/issue-2/phase6-live-20261022T063549Z/manifest.json) and [risk/Synthea manifest](../artifacts/phase-6/phase6-live-20261022T063549Z/manifest.json); [Selected visual inspection and limits](../artifacts/phase-6/visual-verification.json).

## Draft submission deliverables — not ready to submit

The official public RFP and seven linked attachments were refreshed; retained RFP/Addendum 1 hashes matched. [Complete source-paragraph matrix](submission/PHASE-6-TRACEABILITY.md) inventories **379 nonempty source paragraphs**, including administrative/forms/background, sentence subclauses and compound capability facets. Zero unmapped source paragraphs means inventory completeness, not legal compliance or that all minimum requirements are implemented. Owner/counsel review governs all compound/legal obligations.

[Proposal draft](submission/PHASE-6-PROPOSAL-DRAFT.md), [editable DOCX](../artifacts/phase-6/RFP20261404054_OWNER-REQUIRED_PROPOSAL-DRAFT.docx), [8-page PDF](../artifacts/phase-6/RFP20261404054_OWNER-REQUIRED_PROPOSAL-DRAFT.pdf), [internal costing workbook](../artifacts/phase-6/RFP20261404054_INTERNAL-PRICING_OWNER-INPUT.xlsx), and [original unfilled Exhibit A](../artifacts/phase-6/RFP20261404054_Exhibit-A_ORIGINAL-UNFILLED.xlsx). The original bytes remain unchanged. Template zeros are not vendor prices; internal actual inputs are blank and formulas conditional. Formula structure verified; spreadsheet application recalculation and DOCX pagination were not executed. PDF summary is one page; PDF has draft/entity-placeholder footer on every page. Owner must replace placeholders and verify final formats/page counts.

[Required forms and founder actions](submission/PHASE-6-VENDOR-FORMS.md): B/D/F are embedded in original RFP; C and both G forms are separate public attachments; E not used. Signature, corporate facts, actual prices, three references, HUB evidence, registration, insurance/legal/BAA, questionnaire evidence and authorized addendum/contract review are outstanding. No organizational questionnaire answer is an attestation. Form 1295 is a post-award step as described in the RFP.

Deadline retained from Addendum 1: **November 3, 2026, 2:00 p.m. CST**, as written. Owner must recheck all addenda immediately before any separately authorized submission. RFP requires the prescribed upload portal, genuine entity/file naming, editable contract/redline and response formats. No registration, outreach, payment, signature, contact, submission or contractual acceptance occurred.

## Preview and stable package

Vercel config selects only the Phase 6 development branch and keeps main/prior branches disabled. Fixture frontend uses no credentials/backend/AI/payer service. Authenticated team inspection returned zero projects; no linked preview/protection was verified and no deployment attempted. Prior create-project 403 is historical, not a new attempt. Founder must import/link the existing repository and configure approved access/protection. [Actual inspection](../artifacts/phase-6/vercel-status.json). Backend remains separate on loopback. Vercel deployment skill used: skill://plugin_connector_690a90ec05c881918afb6a55dc9bbaa1/deployments-cicd/SKILL.md.

[Technical demonstration transfer](../artifacts/phase-6/RFP20261404054_TECHNICAL-DEMONSTRATION_DRAFT.zip) and manifest contain allowlisted drafts, actual test/benchmark evidence, screenshots and disconnected fixture assets. They exclude runtime secrets, account values, private dumps and the private Git bundle. This ZIP is an engineering transfer, not automatically an accepted bid attachment. [Exact execution/limits](PHASE-6-EXECUTION.md), [predeclared gates](PHASE-6-ACCEPTANCE.md).

Remaining founder actions: authentic company/signatory/reference/HUB/vendor facts; approved prices and legal/insurance/BAA/official forms; Epic/JPS and payer/criteria permissions; independent clinical validation; Vercel import/protection; production security, sustained performance and coordinated recovery acceptance. Engineering checks passed within stated scope; production requirements and submission readiness remain **false**.
