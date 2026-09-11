# Session Progress Log

## Current State

**Last Updated:** 2026-09-08 Asia/Taipei
**Active Feature:** none
**Last Completed Feature:** feat-010 - Pixel preview and navigation flow polish

## What's Done

- README and docs were refreshed for current CraftFocus V2/PWA/login-preview behavior.
- Minimal agent harness files were generated and tailored for this project:
  - `AGENTS.md`
  - `feature_list.json`
  - `progress.md`
  - `init.sh`
  - `session-handoff.md`
- Harness scope documents project rules, canonical areas, verification commands, scope boundaries, and done criteria.
- Harness validation reached 100/100.

## What's In Progress

- No active feature.

## What's Next

1. For production QA, start `feat-005` and run deployed authenticated E2E with env-provided credentials.
2. For feature work, add or select one `feature_list.json` item and keep scope limited to that item.
3. Run `./init.sh` for full baseline verification when changing code paths.

## Blockers / Risks

- Full authenticated Supabase E2E requires valid backend env and credentials.
- Lighthouse can fail for local browser/server reasons; capture exact failure if used.

## Decisions Made

- Keep harness files at repo root for discoverability by Codex/Claude-style agents.
- Use one active feature in `feature_list.json` unless future work requires explicit multi-agent ownership boundaries.
- Keep `./init.sh` as the full verification path; allow smaller targeted checks for docs-only changes when documented.

## Files Modified This Session

- `README.md` - refreshed public project documentation.
- `docs/ARCHITECTURE_DEEP_DIVE_EN.md` - updated architecture notes.
- `docs/ARCHITECTURE_DEEP_DIVE_ZH-TW.md` - updated Traditional Chinese architecture notes.
- `docs/E2E_REPORT.md` - updated E2E scope and commands.
- `AGENTS.md` - added project agent harness instructions.
- `feature_list.json` - added feature state tracker.
- `progress.md` - added session continuity log.
- `session-handoff.md` - added restart handoff.
- `init.sh` - added full verification script.

## Evidence of Completion

- Harness validation: `node /Users/Leo/.agents/skills/harness-creator/scripts/validate-harness.mjs --target /Users/Leo/Documents/craftfocus` -> `Overall: 100/100`.
- Unit tests: `npm test` -> `10` test files passed, `32` tests passed.
- Docs link check: custom Node local-link check -> all README/docs links resolved before harness creation.

## Notes for Next Session

Start by reading `AGENTS.md`, then `feature_list.json`, then this file. Do not rely on chat history for feature state.

## 2026-09-07/08 Whole-Project Review

- Made focus rewards server-authoritative, elapsed-time checked, concurrency safe, and idempotent. The UI preserves failed finishes for retry.
- Fixed room replacement item loss and concurrent removal refunds.
- Closed forged official listings, friendship/exchange consent bypasses, and companion ownership/selection bypasses with additive migrations.
- Added working web alerts/confirmations and removed the production focus-completion shortcut.
- Bounded extreme-aspect-ratio pixel previews and hardened the static preview server against traversal and unrelated-port reuse.
- Made the Lighthouse command cross-platform and fixed reported login autocomplete and preview contrast failures.
- Applied compatible dependency patches; the remaining audit findings require an Expo SDK major upgrade.
- Added deployment hardening: one-minute minimum abandonment reward, immutable/atomic daily upload accounting, and quarantine plus explicit provenance for historical catalog rows.
- Aligned Async Storage and Secure Store with Expo SDK 54 and enabled the Secure Store config plugin.

Evidence:

- `npx tsc --noEmit` passed.
- `npm test` passed: 16 files / 56 tests.
- `npm run e2e:build` passed: 21 static routes under `/craftfocus`.
- `PORT=4194 npm run test:e2e` passed: 2 smoke tests / 2 credential-gated tests skipped.
- All migrations applied from scratch to disposable PostgreSQL 18; database regression and two-client concurrency scripts passed, including concurrent upload quota enforcement.
- `npx expo-doctor` passed all 18 checks; `npx expo install --check` reports dependencies compatible with SDK 54.
- `PORT=4191 npm run lighthouse:web` completed and wrote JSON/HTML reports: performance 67, accessibility 100, best practices 100, SEO 100.
- `npm audit`: 0 critical, 8 high, 17 moderate; all remaining fixes proposed by npm require a breaking Expo SDK upgrade.

Remaining risks:

- Hosted Supabase/PostgREST and authenticated deployed E2E still require project configuration and credentials.
- Quarantined catalog rows must be reviewed before legitimate historical rows are reactivated with `official_source = true`.
- Server elapsed time cannot prove that a user remained focused during the session.

## 2026-09-08 Production Signup Diagnosis

- Confirmed `https://leo0331.github.io/craftfocus/auth/signup` and its JavaScript bundle return HTTP 200.
- Confirmed the deployed bundle uses `https://zhiuvtldfgbqmydgrksh.supabase.co`.
- That Supabase hostname returns DNS NXDOMAIN, which causes the browser's `Failed to fetch` signup error.
- No replacement Supabase URL or public key is configured in the local workspace.
- Added localized backend-unavailable errors and a deployment preflight that refuses to publish when Supabase Auth is missing or unreachable.
- Added `docs/SUPABASE_DEPLOYMENT_RECOVERY.md` with the remaining recovery procedure.

Evidence:

- `npx tsc --noEmit` passed.
- `npm test` passed: 18 files / 63 tests.
- `npm run e2e:build` passed: 21 static routes.
- `PORT=4195 npm run test:e2e` passed: 2 smoke tests / 2 credential-gated tests skipped.

Recovery completed:

- Project `dotbjffrepidvlmokhgl` is healthy and all 25 migrations were applied successfully in one transaction. Critical REST tables return HTTP 200.
- Saved Supabase Auth Site URL and redirect URL as `https://leo0331.github.io/craftfocus/`.
- Replaced both GitHub Actions Supabase secrets and completed Pages deployment #72 successfully.
- Verified the live HTTP 200 bundle contains the new project URL and no reference to the deleted project.
- Verified Auth health HTTP 200, email signup enabled, signup enabled globally, and normal signup validation responses.
- Diagnosed the subsequent `Database error saving new user` from PostgreSQL logs: the new-user trigger granted `plant`, but `item_catalog` did not contain that manually seeded row.
- Added and deployed `20260908120000_seed_required_item_catalog.sql`, then applied the catalog repair to the hosted project.
- Ran a hosted signup-trigger simulation inside `BEGIN`/`ROLLBACK`; profile, room, wallet, starter plant, and cat creation all passed without leaving a test account.
- GitHub Pages deployment #74 for commit `02e2380` completed successfully.
- Reapplied all migrations from scratch in disposable PostgreSQL 18 and passed the complete database regression suite with the required-item assertion enabled.
- Diagnosed `email rate limit exceeded` as Supabase's built-in mailer quota of two messages per hour.
- Disabled **Confirm email** until production SMTP is configured, avoiding the built-in mailer for signup.
- Updated signup to route auto-confirmed sessions directly into the app and added localized mail-quota guidance.
- Deployment #76 for commit `1b90aa8` passed; live verification confirmed `AUTO_CONFIRM=true`, signup enabled, the new bundle active, and the starter plant present.

## 2026-09-09 Isometric Room Redesign

- Added a continuous diamond floor, subtle tile grid, floor shadow, and warm bedroom palette.
- Removed built-in floor furniture collisions so player-owned items define the editable room contents.
- Kept theme character in wall fixtures while separating gym equipment from placement anchors.
- Reduced empty-anchor size and contrast, enlarged placed sprites, and redistributed bedroom placement zones.
- Framed the collectible gallery and widened desktop scene/gallery proportions while retaining the stacked mobile layout.

Evidence:

- Visual-verdict: 92 / pass after bedroom desktop, bedroom 390px mobile, and gym desktop renders.
- `npx tsc --noEmit` passed.
- `npm test` passed: 18 files / 64 tests.
- `npm run e2e:build` passed: 21 static routes.

## 2026-09-10 Pixel Preview and Flow Polish

- Increased generated preview resolution from 48px to 96px while keeping the output bounded at 384px.
- Increased persistent collectible fallback from 8×8 with 8 colors to 16×16 with up to 12 colors; the database accepts both legacy and new grids.
- Replaced the oversized single preview with labeled original/generated comparison frames and explicit generation/publishing status.
- Prevented own and friend rooms from rendering a default bedroom before persisted room data arrives.
- Added stale-request protection and retry feedback for friend rooms and listing details.
- Made room-type switching optimistic with rollback, blocked duplicate detail actions, disabled empty comments, and made successful publishing replace the completed form in history.
- Added auth forward/back and publish/detail/creator-room/back flow coverage.

Evidence:

- Visual-verdict: 91 / pass on the real upload screen after image selection and generation.
- `npx tsc --noEmit` passed.
- `npm test` passed: 19 files / 66 tests.
- `PORT=4201 npm run test:e2e` passed: 3 smoke flows / 2 credential-gated flows skipped.
- All migrations and database regressions passed from scratch in disposable PostgreSQL 18.
- Hosted `v23_is_valid_pixel_grid` migration applied successfully.

## 2026-09-11 Cozy Room and Themed Collectibles

- Continued the cozy isometric scene with original artwork informed by the cutaway composition and readable silhouettes of Unpacking (https://www.unpackinggame.com/) and Cozy Room Decorator (https://store.steampowered.com/app/2615130/Cozy_Room_Decorator/). No game assets were copied.
- Added original 16x16 miniatures for 12 existing furniture IDs, with warm bedroom and sage/teal gym palettes. Larger inventory cards, catalog thumbnails, room sprites, and owner/visitor gallery frames share theme colors.
- Reused PixelSprite's renderer and inventory IDs; custom artwork remains intact. No dependencies or database changes.
- Preserved placement IDs while separating small-screen touch targets. Verified every placement target, show/hide spots, day/evening, and empty visitor rooms at 1200, 390, and 320 pixels using real room/gallery components in a local browser fixture.
- Corrected an existing randomized test's whitespace assumption: search trims edges while the text sanitizer collapses interior whitespace. Production validation is unchanged.

Verification: TypeScript passed; 21 unit files / 71 tests passed; 21-route web export passed; browser smoke passed (3 tests, 2 credential-gated skips). Visual review passed at 92, recorded in .omx/state/cozy-room/ralph-progress.json. No standalone lint command is configured; git diff --check passed.

Remaining limits: local Supabase configuration is absent, so authenticated live flows were not reverified; native-device visual QA and production deployment were not performed in this pass. Browser fixture screenshots are in the session visualization directory (cozy-bedroom-1200-day.png and cozy-gym-390-evening.png).

## 2026-06-11 API Review Pass

- Applied Stripe-style API review to the internal Supabase service layer.
- Added shared API helpers for list limits and Supabase error formatting.
- Added idempotent `setPostLike(postId, userId, liked)` and switched craft detail UI away from retry-unsafe toggle behavior.
- Added explicit limits to room, gallery, friendship, comment, and craft-feed reads.
- Added `docs/API_DESIGN_REVIEW.md` and linked it from README.

Evidence:

- `npx tsc --noEmit` passed.
- `npm test` passed: 11 files / 36 tests.
- `npm run e2e:build` passed after API review changes.
- `npm run test:e2e` passed: 2 passed / 2 skipped credential-gated specs.
- README/API doc links resolved.
