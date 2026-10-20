# Executed verification results

Verified locally on 2026-10-20 with real modular services and entirely fictional data. These are executed local results; GitHub-hosted CI and a public deployment were not run.

| Check | Executed result | Evidence |
|---|---|---|
| Unit tests | **14 passed, 0 failed** | `artifacts/phase-5-unit-tests.txt` |
| Live integration suite | **14 passed, 0 failed** | `artifacts/final-integration-tests.txt` |
| Browser suite | **3 passed, 0 failed** | `artifacts/phase-5-browser-tests.txt`, `artifacts/browser-results.json` |
| TypeScript and production frontend build | **Passed** | `artifacts/phase-5-build.txt`, `artifacts/startup-run.txt` |
| Complete local startup orchestration | **Passed** | `artifacts/startup-run.txt` |
| Empty-data-directory PostgreSQL initialization | **Passed** | `artifacts/clean-init-results.json` |
| Medplum/CQF/Keycloak/local-model probes | **Passed** | `artifacts/foundation-results.json`, `artifacts/final-foundation-tests.txt`, startup transcript |
| Model checksum | **Matched pinned official SHA-256** | `artifacts/model-checksum.txt`, `docs/model-lock.json` |
| Full npm dependency audit | **0 reported vulnerabilities** | `artifacts/npm-audit-full.json` |
| Production npm dependency audit | **0 reported vulnerabilities** | `artifacts/npm-audit.json` |
| Audit integrity | **130 events verified** | `artifacts/audit-integrity.json` |
| Final demo readiness | **6 fictional cases with current local-model assessments; all services ready** | `artifacts/final-readiness.json` |
| Shell and Compose configuration validation | **Passed** | Executed `bash -n scripts/start-demo.sh` and `docker compose config --quiet` |

The live suite uses Medplum, HAPI/CQF, Keycloak, Valkey, PostgreSQL, local llama.cpp inference and Grafana. It covers role restrictions, idempotent intake, conflicting event/key reuse, changed FHIR versions, continued stay, source Provenance, actual authorization receipts, explicit physician overrides, preservation of source encounter class, provisional information requests, report counts and sorted priority, restricted Grafana SQL access, and real Grafana datasource queries. Isolated fault-injection API instances demonstrate that CQF and Medplum outages return an error without replacing assessment/audit history.

The main browser test performs all eight requested scenarios through the running UI. The other browser tests verify session recovery and a rendered Grafana dashboard backed by live SQL aggregates. Screenshots show actual application state during those flows, including human decisions and simulated authorization events. They are not static mockups.

The startup script was executed end to end in this environment using persistent service volumes. Fresh PostgreSQL initialization was tested independently with the actual official image entrypoint and an empty isolated tmpfs. A second complete clean-machine deployment, load tests, real payer/Epic integration, container vulnerability scanning, formal clinical validation and production security/compliance assessment were not executed or claimed.

Earlier failures and repairs are recorded in `STATUS.md`. Final successful transcripts supersede earlier/interrupted attempts. Source file hashes are retained in `artifacts/source-manifest.json`; Git history identifies the completed phase commits. Audit-chain verification and final readiness results are retained separately after the final synthetic data preparation.
