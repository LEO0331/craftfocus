# Session Handoff

## Current Objective

- Goal: ship the credential-free browser demo for review as feat-018.
- Branch: `codex/indexeddb-local-demo`. GitHub Pages and Lighthouse exports use local mode. Native bundles and explicit online web builds use Supabase.
- Gameplay saves to `craftfocus-local-demo` IndexedDB. Profile provides versioned JSON backup, restore, and reset. See the latest entry in `progress.md` for verification.
- Deployment and rollback steps are in `README.md` and `docs/SUPABASE_DEPLOYMENT_RECOVERY.md`. The inactive Supabase project is outside this change.

## Latest Recovery Evidence (2026-10-02)

- Both reported URI decoder/image-size Dependabot alerts cleared; regression tests and GitHub quality gates passed.
- DNS NXDOMAIN was caused by a paused Supabase project. Resume the project before considering replacement; follow `docs/SUPABASE_DEPLOYMENT_RECOVERY.md`.
- Existing database/storage were preserved, and Pages deployment passed after resumption. Authenticated signup/E2E was not rerun.

## Completed This Session

- [x] Completed frontend, service, database, PWA, build, and dependency review passes.
- [x] Fixed focus reward authority and retry, room inventory races, and database authorization gaps.
- [x] Fixed web alerts, pixel preview sizing, preview-server isolation/security, and Lighthouse portability.
- [x] Added unit and disposable PostgreSQL regression coverage.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Docs links | custom Node link check | PASS | README/docs local links resolved before harness creation. |
| TypeScript | `npx tsc --noEmit` | PASS | No type errors. |
| Unit tests | `npm test` | PASS | 21 files / 73 tests passed. |
| Web export | `npm run e2e:build` | PASS | 21 static routes. |
| Browser smoke | `PORT=4201 npm run test:e2e` | PASS | 3 passed / 2 credential-gated skipped. |
| Production SCA | `npm audit --omit=dev --json` | PASS | 0 vulnerabilities. |
| Database | GitHub Actions run #87 disposable PostgreSQL | PASS | Fresh migrations, regressions, and concurrency checks. |
| Lighthouse | `PORT=4191 npm run lighthouse:web` | PASS | Performance 67; accessibility, best practices, and SEO 100. |
| Expo compatibility | `npx expo-doctor` | PASS | 18/18 checks passed after SDK package alignment. |

## Files Changed

- Application focus/auth screens, focus hook/timer, alert and pixel utilities.
- Four additive `supabase/migrations/202609*.sql` migrations.
- Unit, browser, and disposable database regression tests.
- Static preview/Lighthouse tooling and dependency lockfile.
- Expo SDK-compatible native storage packages and Secure Store config plugin.
- `docs/PROJECT_REVIEW_BACKEND.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `README-zh.md`
- All `docs/*.md` files and `AGENTS.md` were audited/refreshed on 2026-09-14.
- Feed aggregation, UGC database limits, remote deployment contract, and CI quality/database gates were added for feat-012.

## Decisions Made

- Harness stays minimal and repo-root visible.
- Full verification is centralized in `./init.sh`.
- Future agents should record skipped checks and evidence in `progress.md`.

## Blockers / Risks

- Authenticated deployed E2E and hosted Supabase verification require valid project credentials.
- Production migration `20260914120000` is applied; GitHub Actions run #87 passed the remote schema contract and deployed successfully.
- Remaining npm advisories require a breaking Expo SDK upgrade.
- Quarantined historical catalog rows need administrative provenance review before reactivation.

## Recommended Next Step

- Confirm a real signup using an inbox you control, then run the credential-gated authenticated E2E suite.
