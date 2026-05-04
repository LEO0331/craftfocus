# CraftFocus Architecture Deep Dive

## 1) System Design Overview

### Product scope (current V2.x)
- Cross-platform focus + social craft app built from one Expo codebase.
- Core gameplay loop: complete focus sessions -> earn seeds -> claim official/custom listings -> decorate room and gallery.
- Social loop: publish custom craft listings, likes/comments, friends, visit friend rooms.

### High-level architecture
- Frontend: Expo React Native + TypeScript + Expo Router.
- Runtime targets: iOS / Android / Web (GitHub Pages as web channel).
- Backend: Supabase (Postgres + Auth + Storage + RLS + RPC).
- Data authority: Postgres + RPC for transaction-sensitive operations.
- Client fallback path: selected claim flows include client-first fallback to survive RPC drift/migration mismatch.

### Key bounded contexts
1. Auth/Profile
- Supabase Auth session persistence (web localStorage, native SecureStore).
- Profile includes display identity + active animal.

2. Focus economy
- Focus session writes through `award_seeds_for_session` RPC.
- Seeds are wallet-backed (`user_wallets`) and unlock progression.

3. Inventory + room placement
- Official inventory claims increase `user_inventory.quantity`.
- Isometric room uses anchor-based placement (`room_placements`).
- Custom collectible gallery uses fixed 5x5 cell placement (`custom_gallery_placements`).

4. Craft marketplace/feed (seed claim model)
- `craft_posts` is listing/feed source.
- Claim records in `listing_claims`; grants go to `user_inventory` or `custom_collectibles`.

5. Companion system
- Animal catalog + user unlocks + active animal selection.
- ASCII companion rendering in header/focus for lightweight cross-platform animation.

### Deployment topology
- Web static export deployed to GitHub Pages `/craftfocus`.
- Supabase hosted backend (free tier constraints).
- PWA layer is secondary channel (shell offline, online for data actions).

---

## 2) Why This Architecture vs Alternatives (Decision + Trade-off)

## D1. Single Expo codebase (RN + Expo Router)
**Chosen**
- One codebase for iOS/Android/Web.

**Why this instead of separate web + native apps**
- Faster MVP iteration and lower maintenance load.
- Shared business logic (focus rewards, claims, i18n, validation).

**Trade-offs**
- Web polish can need extra responsive passes.
- Some browser UX patterns require React Native Web-specific adaptation.

**Alternative considered**
- Next.js web + separate native app.

**Why not now**
- Higher engineering overhead, duplicate logic, slower feature velocity.

## D2. Supabase-first backend (Auth + Postgres + RLS + RPC)
**Chosen**
- Managed Postgres with built-in auth/storage/RLS.

**Why this instead of custom Node backend**
- Near-zero infra cost and fast delivery.
- Strong row-level authorization close to data.
- SQL migrations are explicit and auditable.

**Trade-offs**
- Need careful migration discipline and RPC signature stability.
- Complex workflows are expressed in PL/pgSQL, which some frontend teams are less comfortable with.

**Alternative considered**
- Custom API server (Express/Nest) + ORM.

**Why not now**
- More hosting/ops/security surface and slower MVP path.

## D3. RPC for transaction-critical actions
**Chosen**
- RPC for wallet deduction + grant operations (seed claims, focus reward writes).

**Why this instead of pure client multi-step writes**
- Better atomicity and reduced race-condition risk.
- Security and invariants enforced server-side.

**Trade-offs**
- RPC overload/signature mismatch can surface as PostgREST 400 if migrations drift.
- Requires tight DB/client version alignment.

**Alternative considered**
- Client orchestrated transactions.

**Why not now**
- More failure windows and rollback complexity in client.

## D4. Client fallback in claim flows
**Chosen**
- `claimOfficialInventoryItem` and `claimListingWithSeeds` try client fallback + multiple RPC signatures.

**Why this instead of strict RPC-only**
- Improves resiliency during mixed migration states and older deployed clients.
- Unblocks users when backend function signatures changed.

**Trade-offs**
- Duplicated logic (RPC + client fallback).
- Must carefully rollback wallet updates in client path.

**Alternative considered**
- Break hard on any RPC mismatch.

**Why not now**
- Poor UX and revenue/progression blocking in MVP.

## D5. Wallet as canonical seed source (`user_wallets`)
**Chosen**
- Dedicated wallet table keyed by user.

**Why this instead of deriving from focus session sums**
- O(1) balance reads.
- Supports non-focus economy events (claims, promotions, admin grants).

**Trade-offs**
- Need strong consistency safeguards (upserts, conflict handling, transactional updates).

**Alternative considered**
- Materialized/derived balance from event ledger only.

**Why not now**
- Simpler operationally for MVP to keep direct wallet state + audited action rows.

## D6. Anchor-based isometric room, not free drag-drop
**Chosen**
- Room placements snap to predefined anchors.

**Why this instead of fully free XY furniture editor**
- Cross-platform reliability and deterministic rendering.
- Easier collision rules and persistence model.

**Trade-offs**
- Less creative freedom than free-form placement.

**Alternative considered**
- Continuous drag-drop with collision engine.

**Why not now**
- Larger complexity for geometry, overlap resolution, and mobile touch behavior.

## D7. Separate 5x5 custom collectible gallery
**Chosen**
- Custom claims placed in a dedicated 5x5 board.

**Why this instead of mixing all custom items into room anchors**
- Keeps room furniture logic stable.
- Distinct showcase experience for user-generated collectibles.

**Trade-offs**
- Two placement systems to maintain.

**Alternative considered**
- Unified room system for all item types.

**Why not now**
- Would require asset/footprint normalization for arbitrary user-uploaded art.

## D8. ASCII companion for active status/focus animation
**Chosen**
- Lightweight ASCII companion surfaces.

**Why this instead of high-fidelity sprite animation everywhere**
- Very low render/storage cost, consistent on web/native.
- Clear personality feedback in headers/focus view.

**Trade-offs**
- Lower visual richness than full sprite animation.

**Alternative considered**
- Sprite sheets/Lottie/video animations.

**Why not now**
- Increased asset weight/perf constraints and more complex animation pipeline.

## D9. Safe deprecate of legacy model
**Chosen**
- Keep legacy tables physically; shift app usage to V2 canonical entities.

**Why this instead of destructive drops**
- Lower migration risk and easier rollback.

**Trade-offs**
- Schema carries legacy footprint longer.

**Alternative considered**
- Immediate hard drop and rewrite.

**Why not now**
- Higher production risk for active users/data.

## D10. PWA as secondary web channel
**Chosen**
- Static shell caching only; no offline write sync.

**Why this instead of full offline-first sync architecture**
- Installability benefits with minimal risk.
- Avoids data conflicts and stale auth-sensitive content.

**Trade-offs**
- Core social/economy actions still require network.

**Alternative considered**
- Offline queue + replay sync.

**Why not now**
- High complexity for conflict handling and wallet/claim correctness.

---

## 3) Canonical V2 Data Model (Interview-friendly)

## Core tables
- Identity: `profiles`, `user_animals`, `animal_catalog`
- Economy: `user_wallets`, `focus_sessions`
- Item ownership: `user_inventory`, `listing_claims`, `custom_collectibles`
- Placement: `rooms`, `room_placements`, `custom_gallery_placements`
- Social feed: `craft_posts`, `likes`, `comments`, `friendships`

## Core invariants
- Seed spend must not grant without deduction.
- Official claim -> increments inventory quantity.
- Custom claim -> collectible row exists.
- One user claim per listing (`listing_claims` unique).
- Gallery cell uniqueness and ownership checks.

## Security posture
- RLS on user-owned data.
- Security-definer RPC for critical state transitions.
- Storage policies scoped by ownership prefix.

---

## 4) Architecture Deep-Dive Interview Question Bank (English)

### A. Product/Architecture Narrative
1. “Walk me through CraftFocus architecture in 2 minutes.”
- Strong answer: one-codebase cross-platform app, Supabase backend, seed economy with transactional claims, isometric room + collectible gallery, social feed.

2. “Why was Expo chosen for this product?”
- Strong answer: speed, shared UI/business logic, easier MVP staffing/cost.

3. “Why is Supabase a fit for early-stage product?”
- Strong answer: Auth/RLS/Postgres/Storage bundled, low ops, faster delivery.

### B. Data & Consistency
4. “How do you guarantee seeds are not lost/duplicated during claims?”
- Strong answer: prefer RPC transaction path; fallback path includes rollback logic and uniqueness constraints.

5. “How do you avoid duplicate claims?”
- Strong answer: unique `(user_id, listing_id)` + client precheck + backend enforcement.

6. “How do you handle wallet race/conflicts?”
- Strong answer: server-side updates and conflict-aware create (`23505` handling).

### C. Security
7. “What does RLS protect here?”
- Strong answer: user-owned rows, claim visibility boundaries, owner-only mutations.

8. “What are key risks in client fallback path?”
- Strong answer: partial write risk; mitigated by rollback attempts + moving priority back to canonical server path when stable.

9. “Why avoid storing sensitive secrets in app bundle?”
- Strong answer: only publish anon key; service role stays server-side.

### D. UX + Gameplay
10. “Why strict focus auto-stop on visibility loss?”
- Strong answer: aligns product promise (focus), reduces exploitability, simple deterministic rule.

11. “Why separate room and collectible gallery?”
- Strong answer: preserves room placement simplicity while enabling UGC showcase.

12. “Why ASCII companion?”
- Strong answer: low cost, clear feedback loop, platform-safe animation.

### E. Scalability / Future Evolution
13. “How would you evolve to marketplace/payments later?”
- Strong answer: keep listing domain, add order/payment entities + server-side payment verification; keep claim flow isolated for easy extension.

14. “How would you move media storage off Supabase?”
- Strong answer: keep `storage.ts` abstraction and switch adapter to R2/S3 while preserving app APIs.

15. “How would you reduce fallback complexity later?”
- Strong answer: enforce migration gating + RPC versioning + remove legacy signature fallbacks once all clients are updated.

### F. Reliability / Delivery
16. “How do you prevent schema drift from breaking web claims?”
- Strong answer: migration discipline, CI smoke tests, idempotent/sequenced `supabase db push`, explicit function versioning (`_v2`).

17. “How did you keep release risk low with many redesigns?”
- Strong answer: safe-deprecate strategy, additive migrations, focused e2e and regression checks.

### G. Resume-level “why this over alternatives”
18. “What was your biggest design trade-off?”
- Strong answer: speed/resilience (fallbacks) vs purity (single canonical backend path).

19. “What did you intentionally not build?”
- Strong answer: full chat, payments, heavy AI generation, real-time multiplayer; explained by cost and MVP focus.

20. “If given one month, what’s your first architectural hardening?”
- Strong answer: remove duplicated client-fallback claims after backend stabilization; improve observability and migration contract checks.

---

## 5) Resume Story Framing Template

Use this format in interviews:
1. Problem
- We needed a low-cost cross-platform social focus MVP with economic actions and user-generated content.

2. Constraints
- Free-tier backend, no expensive AI generation, small team velocity, web + mobile parity.

3. Architecture choice
- Expo single codebase + Supabase RLS/RPC + additive migrations.

4. Hard problem solved
- Claim reliability across migration drift via guarded fallback and rollback logic.

5. Outcome
- End-to-end flow from focus -> seeds -> claims -> room/gallery display with social feed.

6. Next step
- Consolidate to stricter server-authoritative claim path and stronger contract testing.

---

## 6) “Why this method instead of others” quick-answer table

| Topic | Chosen method | Main reason | Alternative | Trade-off accepted |
|---|---|---|---|---|
| Cross-platform | Expo RN + Router | single codebase speed | split web/native stacks | less web-native customization |
| Backend | Supabase | low ops + RLS | custom API server | SQL/RPC operational discipline |
| Claims | RPC + fallback | resilience during migration drift | RPC-only hard fail | duplicated logic temporarily |
| Room placement | Anchor snap | deterministic UX | free drag-drop | lower placement freedom |
| Companion | ASCII loops | tiny payload + compatibility | heavy sprite animation | lower visual detail |
| Migration strategy | Safe deprecate | low-risk rollout | destructive cleanup | legacy schema footprint |
| Offline | PWA shell only | minimal risk installability | offline write sync | online required for core actions |

