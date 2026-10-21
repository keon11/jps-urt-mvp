# Third-party component notices

Original MVP application code is licensed under Apache-2.0. Dependencies retain their own licenses and notices. This inventory records engineering checks; it does not replace review of component source, terminology content or distribution obligations.

| npm dependency | Installed version | Declared license |
|---|---|---|
| @medplum/core | 5.2.6 | Apache-2.0 |
| @medplum/fhirtypes | 5.2.6 | Apache-2.0 |
| express | 5.1.0 | MIT |
| jose | 6.1.0 | MIT |
| lucide-react | 0.468.0 | ISC |
| pg | 8.16.3 | MIT |
| prom-client | 15.1.3 | Apache-2.0 |
| react | 19.1.1 | MIT |
| react-dom | 19.1.1 | MIT |
| zod | 4.1.12 | MIT |
| @playwright/test | 1.56.1 | Apache-2.0 |
| @types/express | 5.0.3 | MIT |
| @types/node | 24.7.2 | MIT |
| @types/pg | 8.15.5 | MIT |
| @types/react | 19.1.16 | MIT |
| @types/react-dom | 19.1.9 | MIT |
| tsx | 4.20.6 | MIT |
| typescript | 5.9.3 | Apache-2.0 |
| vite | 7.3.7 | MIT |

Service licenses: Medplum, HAPI FHIR, CQF Clinical Reasoning and Keycloak: Apache-2.0; llama.cpp: MIT; Qwen2.5-0.5B-Instruct model: Apache-2.0; PostgreSQL: PostgreSQL License; Valkey 8.1.10: BSD-3-Clause; Grafana: AGPL-3.0; optional Prometheus: Apache-2.0. The initially selected Redis 7.4 image was replaced because its RSAL/SSPL license is not OSI-approved. The Medplum Redis protocol endpoint now uses Valkey; live compatibility checks cover persistence, cache/auth and case workflows.

Da Vinci PAS repository LICENSE identifies CC0 and links the HL7 FHIR license. The simulator follows workflow concepts only and does not embed licensed clinical/payer criteria or claim PAS conformance.

Keep bundled copyright/license notices for all dependencies. Grafana runs unmodified; distributing modifications carries AGPL obligations. Model revision and SHA-256 are in model-lock.json. Preserve model attribution and license terms when redistributing weights. Container contents and transitive dependencies need full SBOM/license review before production distribution.

Issue #2 additions: Cheerio 1.1.2 (MIT, Node >=20.18.1; current Node 24 compatible), jsdiff `diff` 8.0.2 (BSD-3-Clause), robots-parser 2.3.0 (MIT), and diff type declarations 7.0.2 (MIT). Cheerio parses permitted HTML/tables, jsdiff compares normalized text, and robots-parser handles access rules. Upstream package licenses were inspected before installation. No browser crawler or PDF/model stack was installed because the narrow source is HTML; no redundant clinical rule engine was introduced. The nonexistent @types/robots-parser package returned 404; a narrow declaration for the actual installed module supplies the missing TypeScript interface.

Issue #2 telemetry: OpenTelemetry API 1.10.0, sdk-trace 3.0.0, core 3.0.0 and context-async-hooks 3.0.0, Apache-2.0. Node 24 satisfies their >=22.15 runtime requirement and prom-client deduplicates the compatible API version. The initially investigated deprecated sdk-trace-node 2.2 was removed before delivery. Load generation reuses Node HTTP/fetch/performance APIs; isolated backup/restore uses the existing PostgreSQL utilities and Compose services. No k6/Temporal/Drools/Kubernetes stack is installed solely for dependency count.

Final dependency hardening: jsdiff updated from 8.0.2 to 8.0.4 (same BSD-3-Clause license) after npm audit reported GHSA-73rr-hh4g-fpgx in patch parsing/application. This product uses word comparison, but the compatible patched package was selected anyway. Original audit output is retained; the final audit is recorded separately.
