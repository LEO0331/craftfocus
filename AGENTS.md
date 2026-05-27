# CraftFocus Agent Harness

This repository is an Expo React Native + TypeScript + Expo Router app backed by Supabase. It targets iOS, Android, and Web/GitHub Pages under `/craftfocus`.

## Startup Workflow

Before editing:

1. Confirm location: `pwd` should be `/Users/Leo/Documents/craftfocus` or this repo root.
2. Read `README.md` for product/setup context.
3. Read `docs/ARCHITECTURE_DEEP_DIVE_EN.md` or `docs/ARCHITECTURE_DEEP_DIVE_ZH-TW.md` for system tradeoffs when touching architecture, database, claims, focus, room, or PWA behavior.
4. Read `feature_list.json` and `progress.md` for current state.
5. Check worktree state with `git status --short`; do not overwrite unrelated user changes.
6. For a full baseline, run `./init.sh`. For small documentation-only changes, run the smallest relevant checks and record why full verification was skipped.

## Project Rules

- One feature at a time: choose exactly one active `feature_list.json` item unless the task explicitly defines independent ownership boundaries.
- Preserve cross-platform behavior: code must remain compatible with iOS, Android, and Web unless the change is explicitly web-only.
- Keep Supabase service-role keys and private credentials out of frontend code, docs, and commits.
- Treat `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` as the only public frontend env vars.
- Keep GitHub Pages base path `/craftfocus` working for exported web builds.
- Do not make destructive database migrations; prefer safe additive migrations and documented deprecations.
- Do not add paid services, Stripe/payments, full chat, video upload, realtime multiplayer, or AI image generation unless explicitly requested.
- Prefer small, reversible diffs. Reuse existing hooks/components/services before adding new layers.
- Use `apply_patch` for hand-authored single-file edits when practical.

## Scope Boundaries

- Stay inside the selected feature's files and direct dependencies.
- Do not refactor unrelated screens, database functions, or workflows while implementing a feature.
- Do not change reward rules, claim rules, auth behavior, storage policies, or deployment behavior unless the selected feature explicitly requires it.
- If a bug is discovered outside the current scope, record it in `progress.md` or add a new `feature_list.json` item instead of silently expanding scope.

## Canonical Areas

- Auth/profile/session: `hooks/useAuth.tsx`, `hooks/useProfile.ts`, `app/auth/*`, `app/(tabs)/profile.tsx`
- Focus economy: `app/(tabs)/focus.tsx`, `hooks/useFocusSession.ts`, `lib/focusRewards.ts`, Supabase reward RPC migrations
- Crafts/claims: `app/(tabs)/crafts.tsx`, `app/crafts/*`, `lib/crafts.ts`, `lib/officialInventory.ts`
- Room/gallery: `app/(tabs)/room.tsx`, `components/IsometricRoom.tsx`, `components/CollectibleGalleryBoard.tsx`, room/gallery services
- Supabase schema/RLS/RPC: `supabase/migrations/*`, `supabase/seed_*.sql`
- Web/PWA/deploy: `public/*`, `.github/workflows/*`, Expo export settings
- Documentation: `README.md`, `docs/*`

## Verification Commands

Full verification:

```bash
./init.sh
```

Individual checks:

```bash
npx tsc --noEmit
npm test
npm run e2e:build
npm run test:e2e
npm run lighthouse:web
```

Notes:

- `npm run test:e2e` has credential-gated specs that skip if E2E env vars are absent.
- `npm run lighthouse:web` can be sensitive to local port/browser state; record the exact failure if it is environment-related.
- Supabase-backed behavior must be verified against a configured project when changing RLS/RPC/claim/upload behavior.

## Definition of Done

A task is done only when:

- The requested behavior or documentation change is complete.
- Relevant tests/build checks have run and results are recorded.
- `feature_list.json`, `progress.md`, or `session-handoff.md` is updated when the task changes project state or follow-up context.
- Known risks or skipped checks are explicitly documented.
- The worktree does not contain accidental generated artifacts such as `dist/`, `test-results/`, `.lighthouse-site/`, or Supabase `.temp` files.

## End of Session Procedure

1. Run `git status --short`.
2. Remove ignored/generated verification artifacts if they were created.
3. Update `progress.md` with work completed, checks run, and next step.
4. Update `feature_list.json` status/evidence for touched features.
5. Update `session-handoff.md` for multi-session or incomplete work.
