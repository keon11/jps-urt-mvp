# Clarity UR — Hospital Utilization Review AI MVP

A working, synthetic-only utilization review demonstration based on JPS Health Network RFP #20261404054. It includes fictional FHIR intake, local AI prioritization, illustrative admission/continued-stay review, payer simulation, advisor oversight, operational reporting and audit lineage.

**All patients are fictional. All clinical/payer rules are illustrative and unvalidated. No PHI, JPS production connection, real payer submission or clinical deployment is permitted.**

## Run locally

Requires Node 24, Python 3, Docker Compose, approximately 12–16 GiB RAM and sufficient Docker disk space. No paid model API or GPU is needed.

```sh
npm run start:demo
```

Open http://localhost:3000 on the same machine. Sign in as `reviewer`, `advisor` or `admin`; each uses the intentionally public local-demo password `Synthetic-demo-only-2026!`.

Grafana: http://localhost:3001/d/ur-synthetic-operations (`demo-admin` / `synthetic-grafana-local-only`). Never expose these defaults to untrusted networks.

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

All work is in a dedicated local repository on `dev/autonomous-mvp`. GitHub creation was rejected by the installed integration's permissions, so no remote repository or public deployment is claimed. No existing project or default branch was modified.
