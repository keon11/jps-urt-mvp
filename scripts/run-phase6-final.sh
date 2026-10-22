#!/usr/bin/env bash
# Final sequential acceptance; caller first completes Phase 6 performance diagnostics.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p artifacts/phase-6
python3 - <<'PY'
import json
for label in ['baseline','candidate','extended']:
 r=json.load(open('artifacts/phase-6/performance-'+label+'/benchmark-results.json'))
 assert r['load']['seconds']>=(600 if label=='extended' else 120)
 assert r['liveMvpUnchanged']
PY
python3 scripts/verify-soak-measurements.py --phase6=extended > artifacts/phase-6/raw-verification.txt
python3 scripts/compress-performance-proof.py extended --phase6
npx tsx scripts/queue-dataset-proof.ts end --phase-6 > artifacts/phase-6/dataset-end.txt 2>&1
python3 scripts/prepare-performance-baseline.py
npx tsx scripts/verify-queue-equivalence.ts --phase-6 > artifacts/phase-6/query-equivalence.txt 2>&1
# No further load while state-mutating suites/drills execute.
api_pid=$(fuser -n tcp 3000 2>/dev/null || true)
if [ -n "$api_pid" ]; then kill -TERM $api_pid; fi
for i in $(seq 1 30); do if ! fuser -n tcp 3000 >/dev/null 2>&1; then break; fi; sleep 1; done
python3 scripts/start-local-api.py
node scripts/wait-api.mjs
npm test > artifacts/phase-6/final-unit.txt 2>&1
npm run build > artifacts/phase-6/final-build.txt 2>&1
npm run test:integration > artifacts/phase-6/final-integration.txt 2>&1
npm run test:policy-correctness -- --phase-6 > artifacts/phase-6/final-policy.txt 2>&1
npm run test:denial-correctness -- --phase-6 > artifacts/phase-6/final-denial.txt 2>&1
npm run test:epic-conformance -- --phase-6 > artifacts/phase-6/final-epic-conformance.txt 2>&1
npx tsx scripts/reconcile-proof.ts --phase-6 > artifacts/phase-6/reconciliation.txt 2>&1
npx tsx scripts/fault-recovery.ts --phase-6 > artifacts/phase-6/fault-recovery.txt 2>&1
npm run capture:preview > artifacts/phase-6/preview-capture.txt 2>&1
node scripts/source-fingerprint.mjs --phase-6
SCREENSHOT_RUN="phase6-live-$(date -u +%Y%m%dT%H%M%SZ)"; export SCREENSHOT_RUN
printf '%s' "$SCREENSHOT_RUN" > .runtime/phase6-live-run
npm run test:browser > artifacts/phase-6/final-browser.txt 2>&1
node scripts/screenshot-manifest.mjs "$SCREENSHOT_RUN"
node scripts/screenshot-manifest.mjs "$SCREENSHOT_RUN" --phase-6
SCREENSHOT_RUN="phase6-fixture-1440-$(date -u +%Y%m%dT%H%M%SZ)" npm run test:preview > artifacts/phase-6/final-preview-1440.txt 2>&1
cp artifacts/issue-2/phase-e-preview-browser-results.json artifacts/phase-6/final-preview-1440-results.json
SCREENSHOT_RUN="phase6-fixture-1920-$(date -u +%Y%m%dT%H%M%SZ)" PREVIEW_WIDTH=1920 npx playwright test --config playwright.preview.config.ts > artifacts/phase-6/final-preview-1920.txt 2>&1
cp artifacts/issue-2/phase-e-preview-browser-results.json artifacts/phase-6/final-preview-1920-results.json
node scripts/verify-deployment-config.mjs > artifacts/phase-6/final-deployment-config.txt
npm run verify:audit > artifacts/phase-6/final-audit.txt 2>&1
npx tsx scripts/final-checkpoint.ts --phase-6 > artifacts/phase-6/final-restore-proof.txt 2>&1
npm audit --json > artifacts/phase-6/final-npm-audit.json
node scripts/source-fingerprint.mjs --phase-6 --check
python3 scripts/package-preview.py --phase-6 > artifacts/phase-6/frontend-package.txt
python3 scripts/phase6-traceability.py > artifacts/phase-6/traceability-build.txt
python3 scripts/phase6-proposal.py > artifacts/phase-6/proposal-pricing-build.txt
touch .runtime/phase6-final-stage.done
printf 'Final suites completed; review evidence and images before reporting.\n'
