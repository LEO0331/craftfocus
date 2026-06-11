# CraftFocus API Design Review

Date: 2026-06-11

## Assumptions

- CraftFocus does not expose a public REST API today.
- The API surface reviewed here is the app service layer over Supabase tables and RPCs.
- Critical transactional workflows are focus rewards, official inventory claims, custom listing claims, room placement, gallery placement, likes, comments, and friend requests.
- Auth is Supabase user-session based; RLS and security-definer RPCs are the main authorization boundaries.

## Findings And Fixes

### Medium: Retry-unsafe like mutation

**Area:** Idempotency

**Finding:** `toggleLike(postId, userId)` represented a state-changing toggle. Repeating the same request could undo the previous result.

**Why it matters:** Toggle-style APIs are hard to retry safely. If a client retries after a timeout, the user can end in the opposite state.

**Fix applied:** Added `setPostLike(postId, userId, liked)` and changed the listing detail screen to call the explicit setter with the intended target state. The older `toggleLike` remains for compatibility but new UI code should prefer `setPostLike`.

### Low: List bounds were implicit or scattered

**Area:** Pagination / list safety

**Finding:** Some list calls had fixed limits while others had no explicit service-level bound.

**Why it matters:** Even internal APIs should avoid accidental unbounded reads as usage grows.

**Fix applied:** Added shared `API_LIMITS` and `normalizeListLimit(...)` in `lib/api.ts`. Added explicit limits to craft feed, comments, room placements, gallery lists, and friendships.

### Low: Error formatting was duplicated

**Area:** Errors / developer experience

**Finding:** Supabase error messages were formatted inline in `lib/crafts.ts`.

**Why it matters:** Mutation errors should be predictable and easy to debug without leaking raw objects.

**Fix applied:** Added shared `formatSupabaseError(...)` and `mutationError(...)` helpers in `lib/api.ts`.

## Current API Posture

Strengths:

- Transaction-sensitive seed/claim/placement workflows use Supabase RPCs.
- RLS remains the primary authorization layer.
- Critical mutation functions are resource-oriented in the client service layer.
- Claim RPCs avoid client-side wallet mutation on failure.

Known limitations:

- Supabase/PostgREST does not provide a custom Stripe-style response envelope or `Request-Id` header from the app layer.
- Public API versioning is not needed yet because this is not a third-party developer API.
- Idempotency-key persistence is not implemented because external API clients do not exist; RPCs rely on unique constraints and transactional semantics instead.
- Cursor pagination is not implemented yet; bounded list reads are sufficient for current MVP UI scale.

## Forward Rules

- Prefer explicit state-setting mutations over toggles.
- Add explicit limits to all new list reads.
- Use cursor pagination before exposing public list APIs or high-volume feeds.
- Keep transaction-critical workflows inside RPCs or database constraints.
- If CraftFocus ever exposes a public API, add versioned endpoints, request IDs, idempotency keys for unsafe mutations, standardized error envelopes, and API documentation examples.
