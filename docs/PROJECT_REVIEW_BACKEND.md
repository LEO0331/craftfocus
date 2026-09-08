# Backend review — 2026-09-07

The review found and fixed seven authority/data-consistency defects with additive migrations. No hosted database was changed.

## Fixed

- Room replacement discarded the previous item. Placement now returns the removed row's quantity before consuming the replacement, within one transaction. Both placement RPCs lock the room first. Removal refunds only a successfully deleted row, closing concurrent double refunds.
- Friendship RLS let requesters insert accepted relationships or accept their own pending requests. Inserts now require pending, distinct participants. A trigger permits recipient acceptance/rejection and requester retry after rejection; existing identity guards remain in place.
- Authenticated uploaders could create a one-seed catalog listing granting any official inventory item. Restrictive insert/update policies limit user-created listings to custom collectibles without an official reward ID, retaining existing upload-limit policies. Administrative catalog seeding remains possible.
- The reward RPC trusted a client-supplied duration and minted a new reward on every invocation. Server-recorded starts now bind duration and mode to a session ID. Completion checks server elapsed time, concurrent/retried finishes award only once, and clients can no longer write authoritative focus history. Legacy unsafe reward execution is denied. Abandonment earns five seeds only after one server-observed minute, preventing instant start/stop farming. Starting again supersedes a stranded unfinished run without awarding it, avoiding permanent lockout after a closed tab.
- Companion rows could be rewritten to locked species, and profiles could select locked companions without the intended RPC. Direct companion writes are removed and profile edits cannot change the active companion; the server function remains the selection path.
- Legacy exchange RLS let requesters submit pre-accepted requests, name the wrong craft owner, or accept their own request. Inserts now require a pending request for the craft's actual owner, and only that owner can accept/reject while the requester can cancel.
- The upload limit trusted mutable timestamps and concurrent count queries. A server-owned daily ledger now overwrites client timestamps, counts successful creations even after deletion, and atomically admits at most ten simultaneous uploads.
- Historical catalog rows had no trustworthy provenance. Every existing catalog row is quarantined inactive; only rows explicitly reviewed and marked `official_source` can be active or grant official inventory.

## Verification

All migrations applied from scratch on isolated PostgreSQL 18 with minimal local substitutes for Supabase auth/storage schemas. These substitutes exercise PostgreSQL policies, roles, functions, and transactions, but do not test hosted PostgREST or real JWT handling.

- `tests/database/bootstrap.sql`: disposable database fixtures only; never run against a Supabase project.
- `tests/database/review_regressions.sql`: passed actual SQL checks for replacement conservation, duplicate removal, social/companion authority, catalog provenance, deletion-resistant upload quotas, direct focus-history denial, instant-abandon denial, eligible abandonment, idempotent completion, and successful custom/trusted-catalog claims.
- `tests/database/review_concurrency.sql`: passed simultaneous room removal, focus finish, and upload-at-quota-boundary checks. Each resulted in exactly one allowed state transition or reward.

To reproduce in a fresh disposable local PostgreSQL database, run bootstrap, then every `supabase/migrations/*.sql` in filename order, then both regression files with `psql -v ON_ERROR_STOP=1`. Concurrency tests require local trust authentication and the standard `dblink` extension. No project dependency was added.

## Deployment and remaining limits

- Apply all four 2026-09 migrations to the configured Supabase project together with the updated client. Old clients cannot claim focus rewards after the migration, and new clients need the new start endpoint. No remote migration or hosted integration test was performed.
- Review quarantined catalog rows administratively. Set `official_source = true` and reactivate only rows whose provenance is known.
- Server elapsed time prevents trivial reward forgery but cannot prove that a user actually maintained focus.

The SQL checks demonstrate the repaired paths; they are not a complete security audit or proof that all existing data is valid.
