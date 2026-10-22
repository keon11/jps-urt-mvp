# Phase 6 stable synthetic demonstration and restoration

Keep main and all prior development checkpoints. The verified Phase 5 source is f121f8fd53dae9f787bdd36f47807930ec75eba4; Phase 6 uses dev/phase-6-submission-acceptance. Exact product/fixture/dependency hashes are in artifacts/phase-6/source-fingerprint.json. Final branch SHA is verified against origin at delivery. The technical package manifest hashes its included public demo files.

## Present the working demonstration

Use Node 24 and Docker Compose on an isolated machine with adequate memory/disk. Clone the existing repository, select the verified Phase 6 commit and run `npm ci`, then `TRACE_SAMPLE_RATE=1 npm run start:demo`. Do not publish default local identity/backend services. Obtain authorized local account values privately; never embed them in presentations or URLs. Open http://localhost:3000 at 1440px or 1920px. Follow docs/ISSUE-5-DEMO-CHECKLIST.md and docs/submission/SYNTHETIC-DEMO-SCRIPT.md for all eight workflows, including illustrative criteria and simulated payer boundaries.

`npm run test:preview` builds and tests the read-only fixture frontend separately. Run `npx vite preview --mode preview --host 127.0.0.1 --port 4173` to show it. It has no backend/sign-in/AI/payer connection. A ZIP does not establish a hosted Vercel deployment or verified protection. No public backend is authorized.

## Restore source without overwriting a working installation

Use a separate directory/checkout of the existing repository at the delivered commit. A private `.runtime/phase6-source.bundle` preserves reachable source history and can be checked with `git bundle verify`; it is not included in public demo packages. For offline transfer, clone that bundle into a new directory and select dev/phase-6-submission-acceptance if present, or its recorded HEAD. Do not reset another project or reuse a production database.

The source checkpoint is independently useful: `npm run start:demo` provisions synthetic services and fixtures on a fresh isolated installation. Full service downloads/startup require network/resources. It does not restore all clinical/identity/model service volume state from the application database dump.

## Private application database checkpoint

`npx tsx scripts/final-checkpoint.ts --phase-6` creates `.runtime/phase6-final-checkpoint.dump`, restores it into a NEW loopback `ur_issue2_final_<timestamp>` database, verifies all table row hashes/counts and audit chain, and starts an authenticated read-only application against that restored database. See artifacts/phase-6/final-restore-proof.json for exact dump SHA, table hashes, events and elapsed time. Keep the dump private and verify its SHA before use; it is intentionally not committed or included in public archives.

The proof leaves the original application database untouched. It covers the application tables and a restored worklist. It does NOT claim coordinated backup/restore of Medplum, HAPI/CQF, Keycloak, Grafana, model files or all Docker volumes. Source FHIR versions referenced by an application dump still require matching source services; a fresh-machine restore of every service has not been claimed. Production requires encrypted/off-host coordinated backups, retention, HA/DR and representative recovery drills.

Stop API writers before taking a new application checkpoint. Never run state-changing tests, fault injection, intake, policy publication or UI mutations while taking/rechecking a checkpoint. The verification command restores to a new isolated DB rather than overwriting live data. A manual overwrite of an existing database requires separate authorization and is not a routine restore step.
