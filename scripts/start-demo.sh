#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci --no-audit --no-fund
python3 scripts/download-model.py
chmod 644 infra/init.sql infra/medplum.json infra/realm.json infra/prometheus.yml
chmod -R a+rX infra/observability
docker compose up -d
npm run bootstrap
npm run seed
npm run build
npm run demo
exec npm start
