# Desktop hospital workspace — Issue #1

Source: [GitHub Issue #1](https://github.com/keon11/jps-urt-mvp/issues/1), updated 2026-10-21. Work branch: `dev/desktop-hospital-workspace`, based on the unchanged five-phase `dev/autonomous-mvp` history at `b71b6e6c6bda67b8434182ecac63b968c13bfdf9`. No merge to `main`.

## Scope and concrete design review

This is desktop hospital software: minimum 1280px, primary review at 1440px and 1920px. Mobile implementation, mobile tests and the mobile screenshot are removed from the active deliverable. The original five commits remain intact.

| Observed baseline issue | Implemented correction |
|---|---|
| 8–11px worklist labels, pale metadata | 14px table/body text; metadata 12–13px; dark navy text and restrained teal controls |
| Large decorative metric cards pushed work below the fold | Compact count strip driven by the existing case state |
| Case details below the complete queue | Focused encounter workspace with an explicit Back to worklist control |
| Decorative initials, marketing login and oversized rounded cards | Plain clinical worklist, restrained borders and functional navigation |
| No structured filtering; insufficient payer context | Search plus priority and workflow filters; payer beside authorization state; descending current review priority |
| Hidden reasoning and difficult source inspection | Expanded rule expressions, rule version, source resource versions, provenance and human-review boundary |
| Generic update inputs could look like the selected case's values | Inputs initialize from selected encounter observations, including expected nights; no backend rule change |
| Public password displayed and prefilled by frontend | Empty manual sign-in; local test helper reads existing local realm configuration; no credential values in preview artifacts |
| Active navigation hover became low contrast during screenshot review | Explicit active/hover contrast treatment |
| Authorization history grew with every demonstration run | Bounded keyboard-focusable event history with every stored event retained |
| Audit page expanded hundreds of records into an unusable long page | Newest-first pagination, bounded keyboard-focusable records region and expandable event details |

Loading, error and empty states are explicit. Native controls have labels, visible keyboard focus and a skip link. Intake has dialog focus, a keyboard focus loop, Escape dismissal and focus restoration. Functional icons are retained sparingly. Color is accompanied by text labels. These checks do not constitute a full accessibility certification or hospital usability validation.

## Backend separation and preview behavior

The live local UI uses the existing `/api` contract, Keycloak session/RBAC, Medplum FHIR records, CQF criteria, local inference, PostgreSQL workflow/audit and separate Grafana reporting. No clinical rule, model, API or server implementation changed for this redesign.

`npm run build` produces `dist/` for the existing local stack. `npm run build:preview` produces **only static frontend files** in `dist-preview/`. The latter uses an explicitly read-only snapshot of the six existing allowlisted fictional cases. Its banner states: **Frontend preview — fictional fixtures**. It does not sign in, call an API, run AI, submit payer events, persist changes or verify the live audit chain. Recorded AI/rule results and audit excerpts are sample data, not a new execution. Mutation controls are disabled or omitted. Every live service is shown as disconnected. No local Grafana link is exposed by this mode.

All eight interactive demonstrations remain available through the separate local stack and are verified by the end-to-end browser walkthrough. The fixture preview is presentation review only; it is not a deployed end-to-end clinical system.

The snapshot contains fictional source/version and historical demonstration workflow values. It intentionally does not reproduce every historical audit record. Counts are derived from the same captured state; they are not model accuracy or clinical quality metrics. Full source lineage and audit validation require the local backend.

## Vercel configuration and unresolved permission blocker

**No Vercel URL or successful Git connection is claimed.** On 2026-10-21 the connector listed the Hobby team `kevionkt111-1687` (`team_uA8zCRulxC46h0tgXFv9F1kj`) and no projects. A link-only attempt for `clarity-ur-desktop-preview`, repository `keon11/jps-urt-mvp`, failed with HTTP **403 forbidden: You don't have permission to create the project**. The link-only sequence was chosen so deployment protection could be verified before any build was published. The tool reported no mapped CLI fallback. No Vercel CLI credential store or `VERCEL_TOKEN` was available; GitHub credentials are not repurposed as Vercel credentials. Repeating an unchanged denied mutation cannot resolve this blocker.

The repository contains tested `vercel.json` settings: Vite, `npm ci`, `npm run build:preview`, static `dist-preview`, no functions or backend rewrites, no source maps, restrictive browser headers, no indexing, `main` deployment disabled and an ignore command that accepts only the selected development branch in the preview environment. `.vercelignore` excludes backend, infrastructure, test, runtime and documentation material from CLI uploads. Project-level protection and Git permissions cannot be set by a repository file and remain unverified.

Once an authorized Vercel connection can create/link the project, complete these steps without a production deployment:

1. Link this **existing repository** to `clarity-ur-desktop-preview` in the identified team. Do not import another repository or deploy the default branch.
2. Enable Vercel Authentication for preview deployments; keep source visibility private. Confirm the effective project ID, team, repository link, root directory (repository root), build/output commands and protection settings before deploying.
3. Create a **preview** from `dev/desktop-hospital-workspace` at the pushed commit. Supply no credentials or backend environment variables. Do not use `--prod` or a production alias.
4. Check build logs and READY state; verify reported Git SHA/branch, anonymous access protection, security headers, fixture banner, no API requests, and desktop screenshots against that actual URL. Use authenticated preview access, not public bypass URLs.
5. Record the real URL and deployment ID here. Until then, deployment acceptance remains **BLOCKED**, even though the local build and isolated preview tests pass.

A live backend may be connected only after HTTPS, authentication, CORS/CSRF behavior, secure cookies and synthetic isolation are separately established. No backend tunnel, identity service, clinical service or default credential was published.

## Reproduce verification

Start the separate backend with the documented local startup. Run data-mutating suites **sequentially**:

```sh
npm test
npm run build
npm run test:integration
npm run test:browser
npm run test:preview
npm run verify:audit
```

`test:preview` builds and scans static output, then starts a loopback-only preview server and checks that no `/api` or external requests occur. It does not need the backend. Live browser tests read local fixture credentials at runtime; nothing from that helper is imported into the frontend. CI also builds/scans the preview.

## Actual screenshots

These are Chromium captures of running software, not renderings. The screenshots intentionally contain only fictional data. The live screenshot test signs in as an administrator to expose advisor controls; the separate eight-scenario test verifies reviewer/advisor restrictions.

Baseline: [queue](../artifacts/desktop-redesign/before/00-review-queue.png), [AI review](../artifacts/desktop-redesign/before/02-ai-review.png).

| Screen | 1440px | 1920px |
|---|---|---|
| Prioritized queue | [Capture](../artifacts/desktop-redesign/1440/queue.png) | [Capture](../artifacts/desktop-redesign/1920/queue.png) |
| Source FHIR evidence | [Capture](../artifacts/desktop-redesign/1440/evidence.png) | [Capture](../artifacts/desktop-redesign/1920/evidence.png) |
| AI review / reasoning | [Capture](../artifacts/desktop-redesign/1440/ai-review.png) | [Capture](../artifacts/desktop-redesign/1920/ai-review.png) |
| Authorization | [Capture](../artifacts/desktop-redesign/1440/authorization.png) | [Capture](../artifacts/desktop-redesign/1920/authorization.png) |
| Physician advisor | [Capture](../artifacts/desktop-redesign/1440/advisor.png) | [Capture](../artifacts/desktop-redesign/1920/advisor.png) |
| Operations | [Capture](../artifacts/desktop-redesign/1440/operations.png) | [Capture](../artifacts/desktop-redesign/1920/operations.png) |
| Audit | [Capture](../artifacts/desktop-redesign/1440/audit.png) | [Capture](../artifacts/desktop-redesign/1920/audit.png) |

[Isolated fixture preview](../artifacts/desktop-redesign/fixture-preview.png). See [test results](TEST-RESULTS.md) for executed outcomes and limits.
