#!/usr/bin/env bash
# Sequential, restartable local proof. Never overlaps faults/mutations with load.
set -euo pipefail
cd "$(dirname "$0")/.."
repo_root=$(pwd)
python3 scripts/prepare-performance-baseline.py --first-optimized
run_first(){ (cd "$repo_root/.runtime/phase5-first-optimized"; COMPOSE_FILE="$repo_root/compose.yaml" npx tsx scripts/benchmark.ts "$@"); }
wait_run(){
 local label="$1"
 until python3 -c "import json,sys;sys.exit(0 if json.load(open('artifacts/issue-5/$label/hour-status.json')).get('state') in ['passed','failed'] else 1)" 2>/dev/null; do sleep 5; done
 python3 -c "import json;r=json.load(open('artifacts/issue-5/$label/benchmark-results.json'));assert r.get('load',{}).get('seconds',0)>=(120 if '$label'=='probe' else 3600),r"
}
if [ ! -f .runtime/issue5-baseline-stage.done ]; then
wait_run baseline
python3 scripts/verify-soak-measurements.py --performance=baseline > artifacts/issue-5/baseline/raw-verification.txt
python3 scripts/compress-performance-proof.py baseline
python3 scripts/capture-performance-traces.py baseline
npx tsx scripts/queue-dataset-proof.ts baseline
python3 - <<'PY'
import json,hashlib
from pathlib import Path
m=json.load(open('artifacts/issue-5/baseline-source.json'))
for name,digest in m['sha256'].items():assert hashlib.sha256((Path('.runtime/phase5-baseline')/name).read_bytes()).hexdigest()==digest
PY
git add artifacts/issue-5/baseline artifacts/issue-5/baseline-run.txt
if ! git diff --cached --quiet; then git commit -m 'Issue 5: retain independently recomputed one-hour original-source baseline'; fi
git push origin dev/phase-5-performance
touch .runtime/issue5-baseline-stage.done
fi
if [ ! -f .runtime/issue5-measurement-stage.done ]; then
npx tsx scripts/profile-queue.ts --label=idle-original > artifacts/issue-5/profile-idle-original.txt
npx tsx scripts/profile-queue.ts --after --label=query-only > artifacts/issue-5/profile-query-only.txt
run_first --performance=probe > artifacts/issue-5/probe-query-only.txt 2>&1 || true
wait_run probe
python3 scripts/compress-performance-proof.py probe
mv artifacts/issue-5/probe artifacts/issue-5/probe-query-only
npx tsx scripts/maintain-synthetic-queue.ts > artifacts/issue-5/maintenance.txt
npx tsx scripts/queue-dataset-proof.ts maintained
npx tsx scripts/profile-queue.ts --label=maintained-original > artifacts/issue-5/profile-maintained-original.txt
npx tsx scripts/profile-queue.ts --after --label=maintained-optimized > artifacts/issue-5/profile-maintained-optimized.txt
npx tsx scripts/verify-queue-equivalence.ts > artifacts/issue-5/queue-equivalence-after-maintenance.txt
run_first --performance=probe > artifacts/issue-5/probe-maintained.txt 2>&1 || true
wait_run probe
python3 scripts/compress-performance-proof.py probe
mv artifacts/issue-5/probe artifacts/issue-5/probe-maintained
# Both native profiling windows start about five minutes into their full run.
run_first --performance=optimized > artifacts/issue-5/optimized-run.txt 2>&1 &
load_pid=$!
( sleep 300; node scripts/profile-native-api.mjs optimized > artifacts/issue-5/optimized/native-profile.txt 2>&1 ) &
profile_pid=$!
wait "$load_pid" || true
wait "$profile_pid" || true
wait_run optimized
python3 scripts/verify-soak-measurements.py --performance=optimized > artifacts/issue-5/optimized/raw-verification.txt
python3 scripts/compress-performance-proof.py optimized
python3 scripts/capture-performance-traces.py optimized
npx tsx scripts/queue-dataset-proof.ts optimized
git add artifacts/issue-5
if ! git diff --cached --quiet; then git commit -m 'Issue 5: retain comparable optimized hour, diagnostic probes and maintenance attribution'; fi
git push origin dev/phase-5-performance
touch .runtime/issue5-measurement-stage.done
fi
if [ ! -f .runtime/issue5-budget-stage.done ]; then
WORKLIST_POOL_MAX=2 npx tsx scripts/verify-queue-isolation.ts > artifacts/issue-5/queue-isolation.txt 2>&1
npx tsx scripts/queue-dataset-proof.ts optimized-budgeted
WORKLIST_POOL_MAX=2 npx tsx scripts/benchmark.ts --performance=probe > artifacts/issue-5/probe-budgeted.txt 2>&1 || true
wait_run probe
python3 scripts/compress-performance-proof.py probe
mv artifacts/issue-5/probe artifacts/issue-5/probe-budgeted
python3 -c "import json;r=json.load(open('artifacts/issue-5/probe-budgeted/benchmark-results.json'));assert r['load']['p95Ms']<500 and r['load']['throughputPerSecond']>=20 and not r['load']['errors'],r"
git add services/api/src/worklist.ts services/api/src/server.ts scripts artifacts/issue-5 docs/ISSUE-5-ACCEPTANCE.md
if ! git diff --cached --quiet; then git commit -m 'Issue 5: isolate queue read concurrency within measured CPU quota; preserve clinical pool'; fi
git push origin dev/phase-5-performance
WORKLIST_POOL_MAX=2 npx tsx scripts/benchmark.ts --performance=optimized-budgeted > artifacts/issue-5/optimized-budgeted-run.txt 2>&1 &
budget_pid=$!
( sleep 300; node scripts/profile-native-api.mjs optimized-budgeted > artifacts/issue-5/optimized-budgeted/native-profile.txt 2>&1 ) &
budget_profile_pid=$!
wait "$budget_pid" || true
wait "$budget_profile_pid" || true
wait_run optimized-budgeted
python3 scripts/verify-soak-measurements.py --performance=optimized-budgeted > artifacts/issue-5/optimized-budgeted/raw-verification.txt
python3 scripts/compress-performance-proof.py optimized-budgeted
python3 scripts/capture-performance-traces.py optimized-budgeted
npx tsx scripts/queue-dataset-proof.ts optimized-budgeted
git add artifacts/issue-5
if ! git diff --cached --quiet; then git commit -m 'Issue 5: verify full CPU-budgeted hour and retain all residual failures'; fi
git push origin dev/phase-5-performance
touch .runtime/issue5-budget-stage.done
fi
# Main app stays at the previous working checkpoint until all measured intervals close.
api_pid=$(fuser -n tcp 3000 2>/dev/null || true)
if [ -n "$api_pid" ]; then kill -TERM $api_pid; fi
for i in $(seq 1 30); do if ! fuser -n tcp 3000 >/dev/null 2>&1; then break; fi; sleep 1; done
TRACE_SAMPLE_RATE=1 WORKLIST_POOL_MAX=2 npm start > .runtime/issue5-api.log 2>&1 &
node scripts/wait-api.mjs
npx tsx scripts/reconcile-proof.ts --issue-5 > artifacts/issue-5/reconciliation.txt 2>&1
npx tsx scripts/fault-recovery.ts --issue-5 > artifacts/issue-5/fault-recovery.txt 2>&1
npm run capture:preview > artifacts/issue-5/preview-capture.txt 2>&1
node scripts/source-fingerprint.mjs --issue-5
npm test > artifacts/issue-5/final-unit.txt 2>&1
npm run build > artifacts/issue-5/final-build.txt 2>&1
npm run test:integration > artifacts/issue-5/final-integration.txt 2>&1
SCREENSHOT_RUN="issue5-live-$(date -u +%Y%m%dT%H%M%SZ)"; export SCREENSHOT_RUN
printf '%s' "$SCREENSHOT_RUN" > .runtime/issue5-live-run
npm run test:browser > artifacts/issue-5/final-browser.txt 2>&1
node scripts/screenshot-manifest.mjs "$SCREENSHOT_RUN"
node scripts/screenshot-manifest.mjs "$SCREENSHOT_RUN" --issue-5
SCREENSHOT_RUN="issue5-fixture-1440-$(date -u +%Y%m%dT%H%M%SZ)" npm run test:preview > artifacts/issue-5/final-preview-1440.txt 2>&1
cp artifacts/issue-2/phase-e-preview-browser-results.json artifacts/issue-5/final-preview-1440-results.json
SCREENSHOT_RUN="issue5-fixture-1920-$(date -u +%Y%m%dT%H%M%SZ)" PREVIEW_WIDTH=1920 npx playwright test --config playwright.preview.config.ts > artifacts/issue-5/final-preview-1920.txt 2>&1
cp artifacts/issue-2/phase-e-preview-browser-results.json artifacts/issue-5/final-preview-1920-results.json
node scripts/source-fingerprint.mjs --issue-5 --check
npm run verify:audit > artifacts/issue-5/final-audit.txt 2>&1
npx tsx scripts/final-checkpoint.ts --issue-5 > artifacts/issue-5/final-restore-proof.txt 2>&1
npm audit --json > artifacts/issue-5/final-npm-audit.json
python3 scripts/package-preview.py --issue-5 > artifacts/issue-5/frontend-package.txt
touch .runtime/issue5-final-stage.done
printf 'Sequential performance and regression proof completed; inspect actual targets and images before final delivery.\n'
