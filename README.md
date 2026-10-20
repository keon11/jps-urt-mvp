# Hospital Utilization Review AI — synthetic demonstration

Functional advisory MVP for the workflow capabilities described by JPS RFP #20261404054. All patients are fictional. All clinical/payer rules are illustrative and unvalidated. Never use this demo for patient care, coverage determinations or PHI.

Implementation is in progress on `dev/autonomous-mvp`. See [execution record](docs/STATUS.md), [architecture](docs/ARCHITECTURE.md), and [RFP traceability](docs/RFP-TRACEABILITY.md).

Requires Node 24, npm, Docker Compose, approximately 8 GiB RAM for services and sufficient Docker storage (VFS drivers require substantially more disk).

```sh
npm ci
docker compose up -d
npm run bootstrap
```

Full startup and demonstration instructions will be added after application acceptance.
