# Restore a demonstration checkpoint

Use the final delivery commit on dev/phase-4-enterprise-proof. Keep the original MVP and earlier stage commits in Git; never reset or merge main to restore a demo. Obtain all runtime account/configuration values privately from the operator. Do not publish a database dump or reuse local defaults on a public service.

## Recreate source and fictional fixtures

In a clean checkout of the selected commit, run `npm ci`, then `TRACE_SAMPLE_RATE=1 npm run start:demo`. The startup script verifies pinned dependencies/model and initializes synthetic demonstrations. Open http://localhost:3000 on that machine. The committed Synthea projection is available without regenerating the upstream jar. To recreate its fixed-seed original exports, use `python3 scripts/generate-synthea.py` with Java 21; the manifest records upstream SHA-256 and generation parameters.

Run `npm test`, `npm run build`, `npm run test:integration`, `npm run test:browser` and `npm run verify:audit` sequentially. These tests can change fictional workflow state. Keep them separate from a presentation, soak or fault-injection drill. Fixture-only frontend reproduction is `npm run capture:preview`, `npm run build:preview`, `npm run test:preview`; it has no live backend connection.

## Preserve and verify exact application state

`npx tsx scripts/final-checkpoint.ts --issue-4` writes a private `.runtime/issue4-final-checkpoint.dump`, restores it into a new isolated PostgreSQL database, compares every public application table's sorted-row hash/count and audit chain, and serves an authenticated worklist from the restored application. It does not overwrite the working database. Proof is `artifacts/issue-4/final-restore-proof.json`, including dump hash and actual elapsed time. Re-running the script writes a new proof; retain any prior proof separately when another checkpoint is required.

Copy the dump, matching proof and necessary runtime configuration to approved private durable storage before workspace expiry if exact event history must be preserved. Verify SHA-256 against the proof before a restoration. A source checkout alone recreates fictional data; it does not restore every previous reviewer event. Restoration into an active database requires a separately reviewed operator procedure and is not performed by the verifier.

## Recovery boundaries

This tested checkpoint covers the application database, not a coordinated disaster-recovery backup of Medplum, HAPI/CQF, Keycloak, Grafana, the model and all container volumes. A same-host dump is not an off-host backup or HA. Service restart/readiness times and source reconciliation are separate measurements. Production requires coordinated encrypted backups, secrets/key custody, approved retention, isolated off-host restoration, documented RPO/RTO, capacity and failover testing. Do not infer those properties from the local restore test.
