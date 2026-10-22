# Startup and local deployment

## Prerequisites

- Node.js 24.2+ (tested with 24.19), npm, Python 3, Docker Engine and Docker Compose.
- Recommended 12–16 GiB RAM and 40 GiB free Docker/workspace storage. Docker's VFS driver can consume close to 30 GiB; overlay drivers usually need less. The pinned model is approximately 469 MiB. No GPU is required.
- Outbound access for npm, container registries and the revision-pinned public model download. Preserve your environment's proxy and certificate trust settings. Never disable TLS verification to install dependencies.
- Ports 3000, 3001, 5433, 8080, 8081, 8103 and 11434 available on loopback. No paid services or external credentials are needed.

## One-command local startup

From the dedicated repository:

```sh
npm run start:demo
```

This installs locked dependencies, verifies/downloads the model, starts infrastructure, waits for readiness, runs real foundation probes, seeds the six fictional cases, builds the UI, assesses any new/stale cases and starts the application in the foreground. Initial Medplum initialization can take several minutes. Local-model review latency ranged from several seconds to roughly a minute under shared CPU load; allow time for each review. A failed step stops the script and reports failure.

Open **http://localhost:3000** in a browser on the same machine. This loopback URL is not a public deployment URL. For a remote workstation, use an approved SSH tunnel to loopback; do not expose the default demo credentials on the Internet.

Local account roles are `reviewer`, `advisor`, and `admin`. Obtain the seeded password through the local operator from `infra/realm.json`; the UI requires manual entry. Grafana and Keycloak administration remain local-only; operators inspect the corresponding local Compose configuration. These historical defaults are demonstration values, present in the original commit history, and must never be used on a public service.

The frontend preview contains no credential values and does not connect to these services. See [preview configuration and limitations](DESKTOP-REDESIGN.md).

## Individual commands

```sh
npm ci
python3 scripts/download-model.py
chmod 644 infra/init.sql infra/medplum.json infra/realm.json infra/prometheus.yml
chmod -R a+rX infra/observability
docker compose up -d
npm run bootstrap
npm run seed
npm run build
npm run demo
npm start
```

`npm run seed` is idempotent and preserves existing work. `npm run demo` evaluates only missing/stale assessments. To restore the six fictional source bundles and initial workflows, preserving all prior audit records and FHIR history:

```sh
npm run demo -- --reset
```

This reset changes only synthetic demo records in this dedicated stack. It appends reset events rather than deleting history. Assessments and workflow decisions are recreated through the same application services; no fixed recommendation values are seeded.

To stop, use Ctrl+C for the app, then `docker compose down`. Persistent FHIR/workflow/identity volumes remain. Restarting preserves cases and audit. No volume-deletion command is needed for normal operation.

## Automated verification

With services and the application running:

```sh
npm test
npm run build
npm run test:integration
npx playwright install chromium
npm run test:browser
npm run verify:audit
npm audit
```

Tests require the six seeded fixtures. Integration tests run serially against real local services and modify fictional workflow records. They preserve audit history. Browser tests also update synthetic observations, authorization state and advisor decisions; reset afterward if preparing a fresh walkthrough. JSON browser results, phase test transcripts and screenshots are retained in `artifacts/`.

## Configuration and deployment boundary

Environment overrides: `PORT`, `BIND_HOST`, `DATABASE_URL`, `MEDPLUM_URL`, `MEDPLUM_CLIENT_ID`, `MEDPLUM_CLIENT_SECRET`, `CQF_URL`, `KEYCLOAK_URL`, `LOCAL_MODEL_URL`, `LOCAL_MODEL_NAME`, `DEMO_NOW`, `COOKIE_SECURE`. Defaults are in `services/api/src/config.ts`. Do not commit real secret values. Keycloak issuer must match the JWT issuer seen by the API; do not casually substitute a container hostname for the browser-facing issuer.

The fixed clinical clock defaults to `2026-10-20T12:00:00Z`; event/audit timestamps use actual wall time. The clock makes fixture aging/deadlines reproducible. Changing `DEMO_NOW` may intentionally make fixture observations stale.

This deploys as a local Node application plus modular Compose services on a developer workstation or isolated VM. It is not a production deployment manifest. Public/cloud deployment requires hardened identity, real secret provisioning, TLS, private networking, storage controls, backup/restore and the reviews listed in `SECURITY-AND-PRODUCTION-GAPS.md`; no paid/cloud resources were provisioned.

Prometheus exposition is available at `http://localhost:3000/metrics`. The optional `prometheus` Compose profile targets a private host listener; default loopback binding deliberately prevents the container from scraping it. Configure a reviewed private interface/container deployment before enabling that profile. Grafana's default SQL dashboard does not depend on Prometheus.

## Troubleshooting

- `docker compose ps` and `docker compose logs --tail 50 medplum cqf keycloak` identify startup failures. Medplum must finish its definitions/value-set initialization before probes can pass.
- Configuration mounts must be readable by container users. The startup script applies read permissions only to intentionally public local-demo configurations.
- If an earlier failed initialization created only part of a database, inspect the specific initialization error; do not delete volumes containing review history as a routine fix.
- A model download with the wrong digest is rejected. Rerun the downloader; it writes to a temporary file and verifies before replacing the model.
- A missing/unavailable model is visibly labeled rules-only fallback. CQF/Medplum failures return errors rather than fabricated success.
- The existing GitHub repository is `keon11/jps-urt-mvp`. Current work uses `dev/phase-5-performance`; prior checkpoints remain preserved. Never merge the default branch as a startup or test step.

## Issue #4 engineering proof

Current branch: `dev/phase-4-enterprise-proof`. See [readiness](ISSUE-4-REPORT.md) and [restore boundaries](ISSUE-4-RESTORE.md). The committed derived Synthea corpus is usable without Java/downloads. Regeneration requires Java 21: `npm run generate:synthea`. With services ready, `npm run test:synthea` performs full local generated-resource import and HAPI base validations; it does not contact authenticated Epic. `npm run test:denial-correctness` checks the synthetic workflow-flag corpus. `npm run test:hour` takes a real hour; run it separately from case-mutating tests and fault drills. `npm run prepare:readiness` preserves owner input and never submits a bid. All measured results retain synthetic/local scope.

## Issue #5 performance proof

Current branch: `dev/phase-5-performance`. See [performance architecture](ISSUE-5-ARCHITECTURE.md), [predeclared targets](ISSUE-5-ACCEPTANCE.md) and [demonstration checklist](ISSUE-5-DEMO-CHECKLIST.md). `WORKLIST_POOL_MAX` bounds the separate queue-read pool (default 2, allowed 1–8); the existing clinical/write pool remains eight. Graceful shutdown drains requests before closing both pools. This does not establish production sizing. The comparative campaign takes more than three hours and must not overlap integration/browser/fault tests. Isolated fixture maintenance is restricted to its local synthetic database. Raw failures remain evidence even when broad benchmark gates pass.
