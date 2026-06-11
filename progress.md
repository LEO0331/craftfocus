# Session Progress Log

## Current State

**Last Updated:** 2026-05-27 09:20 Asia/Taipei  
**Active Feature:** none  
**Last Completed Feature:** feat-001 - Agent harness baseline

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
