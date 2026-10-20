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

| Demo role | Username | Password |
|---|---|---|
| Utilization reviewer | `reviewer` | `Synthetic-demo-only-2026!` |
| Physician advisor | `advisor` | `Synthetic-demo-only-2026!` |
| Administrator | `admin` | `Synthetic-demo-only-2026!` |

Grafana: **http://localhost:3001/d/ur-synthetic-operations**, user `demo-admin`, password `synthetic-grafana-local-only`. It reads only an aggregate SQL view. Keycloak administration is on port 8081 using `demo-admin` / `synthetic-admin-local-only`. All are intentionally public local-demo values, not production credentials.

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
- No remote GitHub repository was created: the installed integration rejected `createRepository`. Work is committed locally on `dev/autonomous-mvp`; repository creation/push requires an appropriately authorized GitHub connection. No existing project was changed and no default branch was merged.
