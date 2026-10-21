# Issue #2 execution record

Branch: `dev/issue-2-execution`, based on the existing tested desktop branch. Original MVP phases and `main` are preserved. This is a synthetic demonstration, not clinical validation or production certification.

## Phase A — materially different clinical workstation

Replaced the full-height branded sidebar and metric cards with horizontal task navigation, a compact census strip, a persistent encounter rail, a focused chart/review workspace, and source evidence alongside review actions. Neutral Utilization Review labels replace visible branding, including the browser title, Grafana title and newly created FHIR service attribution. Historic audit/source records are preserved; legacy service labels are neutralized in rendered audit details only.

No Epic proprietary UI/source/assets are copied. Official resources inspected: https://open.epic.com/ and https://github.com/epic-open-source. That organization exposes Seismometer, evaluation-instruments, seismometer-data and seismometer-rfcs, not verified EHR workstation UI code. Seismometer's LICENSE.txt is BSD-3-Clause, useful for evaluation rather than this narrow UI slice; adding its Python runtime is not justified here. Existing React (MIT), native semantic controls and lucide (ISC) are reused. No new visual engine is required for six encounter rows.

The screenshot hash audit identifies unchanged inherited `login.png` and `10-grafana.png`; nine original workflow images differed between the two older branches. None of those inherited images constitutes this sprint's fresh screenshot evidence. The audit is in `artifacts/issue-2/inherited-screenshot-audit.json`.

The first live integration attempt ran before CQF completed cold startup: 9 passed, 5 failed. Its full failure log is preserved as `phase-a-integration-attempt1.txt`. A bounded readiness probe precedes the complete rerun; only a passing rerun is accepted.

Phase results and new capture paths are recorded after verification. Founder visual acceptance is separate from automated layout/browser acceptance.

Phase A verified: build passed; unit 14/14; live integration rerun 14/14; browser 5/5 including all eight demonstrations and both desktop widths. New captures: `artifacts/issue-2/phase-a-e0785ee-20261021T1403Z/`; manifest records source base, working-source hashes, dimensions and image hashes. Actual clinical workbench capture was visually inspected for new encounter rail, top navigation, source evidence, controls and text wrapping. Side-by-side comparison is linked from the issue-2 artifact folder. Automated visual checks pass; founder approval is not claimed.

## Phase B — policy evidence and candidate comparison

Added an immutable policy-document store, two owned synthetic HTML policy revisions, exact source citations, original byte SHA-256, publication/effective dates, extraction provenance, table extraction and candidate comparison. Recognized predicates are allowlisted; official page text never becomes executable rules automatically. Missing dates and uncertain applicability remain explicit null/uncertainty values.

The first current CMS OPD page retrieval succeeded (201,477 bytes; hash recorded in stored evidence). A subsequent robots.txt check returned 403, so further source retrieval is blocked rather than bypassed. No authentic previous official revision was established. Two explicitly fictional, repository-owned documents demonstrate the version change; their criteria are not attributed to CMS or a real payer. Original official bytes remain private to the local runtime/database, outside the frontend output. Access agreement tokens were not requested or accepted.

Reused Cheerio, jsdiff and robots-parser with verified licenses. HTML does not justify Crawl4AI, Docling, PDF models or another rules engine. Initial TypeScript build found missing robots-parser declarations; the suggested @types package did not exist (404). Added the narrow typed adapter declaration and reran the build. Failure logs remain available. Unit suite expanded from 14 to 17; evidence integration adds anonymous-access, source-hash and database immutability checks.

Phase B verified: 17/17 unit tests, 16/16 live integration tests, and TypeScript/production build passed. Official policy retrieval/revision completeness remains explicitly limited as above. No clinical publication occurred.

## Phase C — policy governance and internal authorization

Implemented Policy Management Center and server-side lifecycle controls: draft, evidence verification, conflict analysis, testing, independent supervisor approval, separate clinical-authority approval, publication/monitoring, rejection, evidence request, suspension and rollback. Existing Keycloak identities map reviewer to clerk, admin to supervisor/publisher, advisor to clinical authority. These are synthetic demonstration roles, not qualified clinical sign-off. Admin cannot substitute for the distinct clinical authority. Self-approval is rejected.

Policy originals, publication events, command receipts and internal authorization decisions are append-only. Drafts reference immutable source hashes. Optimistic version checks reject stale transitions, competing publications conflict, UUID command receipts reject altered replays, and identical retries return the committed result. Pending proposals do not change active evaluations. The original CQF clinical criteria are unchanged; the new published policy controls only a clearly labeled synthetic documentation review.

The encounter's separate Authorization Review panel shows active requirements, missing evidence, source citations and decision history. Authorized reviewers can request information, escalate to the advisor workflow, or approve an internal next step. An approval requires a current assessment, refreshed FHIR source hash, current policy revision and complete unsuspended requirements. Internal decisions never imply payer approval or change the source encounter status. Historical decisions are marked stale after source/policy changes. An information request works even before assessment, and reassessment of unchanged evidence preserves the pending request.

New API routes (authenticated): GET `/api/policy-center`; POST `/api/policy-changes`; POST `/api/policy-changes/:id/actions`; POST `/api/policy-suspension`; GET/POST `/api/cases/:id/authorization-review`. Existing routes remain compatible. All mutation schemas reject unknown fields and require event IDs; transitions additionally require the expected version/revision.

Phase C verified: build passed, unit 20/20, live integration 20/20, browser 6/6. Browser tests execute the entire multi-role policy proposal/approval/publication/rollback flow through real buttons, plus an internal case authorization decision. All original eight scenarios, session recovery and Grafana remain passing. Fresh 1440/1920 policy and internal-authorization captures join the seven existing workstation screen types in `phase-c-101a501-20261021T1415Z`. Reliability thresholds were written before benchmark execution in `docs/RELIABILITY-ACCEPTANCE.md`.
