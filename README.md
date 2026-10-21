# Hospital Utilization Review — Synthetic Demonstration

A working, synthetic-only utilization review demonstration based on JPS Health Network RFP #20261404054. It includes fictional FHIR intake, local AI prioritization, illustrative admission/continued-stay review, payer simulation, advisor oversight, operational reporting and audit lineage.

**All patients are fictional. All clinical/payer rules are illustrative and unvalidated. No PHI, JPS production connection, real payer submission or clinical deployment is permitted.**

## Run locally

Requires Node 24, Python 3, Docker Compose, approximately 12–16 GiB RAM and sufficient Docker disk space. No paid model API or GPU is needed.

```sh
npm run start:demo
```

Open http://localhost:3000 on the same machine at **1280px minimum; 1440px or 1920px recommended**. Sign in with an authorized local demonstration account. Local operators obtain the seeded values from the isolated realm configuration; no credentials are prefilled or displayed in the UI. Mobile development is out of scope.

Grafana remains separate at http://localhost:3001/d/ur-synthetic-operations. Keep the entire Docker backend on loopback.

For the **read-only fictional frontend preview**, run `npm run test:preview`, then `npx vite preview --mode preview --host 127.0.0.1 --port 4173`. It uses no backend or credentials. Vercel project creation is currently denied with 403; no hosted preview is claimed.

The current development branch is `dev/issue-2-execution`. The unnamed clinical workbench preserves all eight demonstrations and adds a functional Policy Management Center, separate internal Authorization Review, source provenance, independent synthetic approval roles, publication/rollback, retry reconciliation, metrics and local tracing. See [the Issue #2 report](docs/ISSUE-2-REPORT.md) for current evidence, screenshots, benchmarks, restore instructions and blockers. Founder visual approval and real clinical validation remain pending.

## Documentation and evidence

- [Startup, deployment and test commands](docs/STARTUP.md)
- [Eight-scenario demonstration walkthrough](docs/DEMO.md)
- [Architecture and compatibility decisions](docs/ARCHITECTURE.md)
- [RFP sources and traceability](docs/RFP-TRACEABILITY.md)
- [API contract](docs/API.md) and [OpenAPI](docs/openapi.json)
- [Security assessment and remaining production requirements](docs/SECURITY-AND-PRODUCTION-GAPS.md)
- [Execution record](docs/STATUS.md) and [verification results](docs/TEST-RESULTS.md)
- [Review queue screenshot](artifacts/00-review-queue.png), [AI review](artifacts/02-ai-review.png), [operations dashboard](artifacts/07-operations.png)

Medplum provides FHIR R4 storage, HAPI/CQF evaluates illustrative CQL, Keycloak provides identity, CPU llama.cpp serves the checksum-pinned Qwen model, and Grafana provides aggregate reporting. Lightweight adapters connect the services. PAS-inspired payer workflows remain entirely local and do not claim Da Vinci conformance.

The original five development phases remain on `dev/autonomous-mvp`. The previous desktop checkpoint is on `dev/desktop-hospital-workspace`; current Issue #2 work is on `dev/issue-2-execution`, in the existing repository `keon11/jps-urt-mvp`. No default-branch merge or production deployment is authorized.

Issue #3 validation work is on `dev/phase-3-validation`; see [execution evidence](docs/ISSUE-3-EXECUTION.md), [validation architecture](docs/ISSUE-3-ARCHITECTURE.md) and [draft RFP preparation](docs/submission/PROPOSAL-DRAFT.md). Run `npm run verify:deployment`, `npm run test:policy-correctness`, `npm run test:epic-conformance` and `npm run prepare:submission` for the added reproducible checks. `npm run test:soak` runs a ten-minute isolated API load test; schedule it separately from data-mutating or service-outage tests. Never submit the draft as a completed bid.
