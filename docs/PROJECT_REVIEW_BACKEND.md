# Backend review — 2026-09-07

The review found and fixed seven authority/data-consistency defects with additive migrations. No hosted database was changed.

## Fixed

- Room replacement discarded the previous item. Placement now returns the removed row's quantity before consuming the replacement, within one transaction. Both placement RPCs lock the room first. Removal refunds only a successfully deleted row, closing concurrent double refunds.
- Friendship RLS let requesters insert accepted relationships or accept their own pending requests. Inserts now require pending, distinct participants. A trigger permits recipient acceptance/rejection and requester retry after rejection; existing identity guards remain in place.
- Authenticated uploaders could create a one-seed catalog listing granting any official inventory item. Restrictive insert/update policies limit user-created listings to custom collectibles without an official reward ID, retaining existing upload-limit policies. Administrative catalog seeding remains possible.
- The reward RPC trusted a client-supplied duration and minted a new reward on every invocation. Server-recorded starts now bind duration and mode to a session ID. Completion checks server elapsed time, concurrent/retried finishes award only once, and clients can no longer write authoritative focus history. Legacy unsafe reward execution is denied. Explicit abandonment still awards five seeds. Starting again supersedes a stranded unfinished run without awarding it, avoiding permanent lockout after a closed tab.
- Companion rows could be rewritten to locked species, and profiles could select locked companions without the intended RPC. Direct companion writes are removed and profile edits cannot change the active companion; the server function remains the selection path.
- Legacy exchange RLS let requesters submit pre-accepted requests, name the wrong craft owner, or accept their own request. Inserts now require a pending request for the craft's actual owner, and only that owner can accept/reject while the requester can cancel.

## Verification

All migrations applied from scratch on isolated PostgreSQL 18 with minimal local substitutes for Supabase auth/storage schemas. These substitutes exercise PostgreSQL policies, roles, functions, and transactions, but do not test hosted PostgREST or real JWT handling.

- `tests/database/bootstrap.sql`: disposable database fixtures only; never run against a Supabase project.
- `tests/database/review_regressions.sql`: passed actual SQL checks for replacement conservation, same-item replacement, duplicate removal, invalid inventory, requester self-acceptance denial, recipient acceptance, forged catalog insert/update denial, direct focus-history write denial, legacy reward denial, early completion denial, repeat finish, abandoned-run recovery, and the 45-minute completion reward/history.
- `tests/database/review_concurrency.sql`: passed two simultaneous authenticated removal calls queued behind a room lock, with exactly one refund. Passed two simultaneous authenticated finish calls queued behind the session lock, with exactly one 75-seed award and one history row.

To reproduce in a fresh disposable local PostgreSQL database, run bootstrap, then every `supabase/migrations/*.sql` in filename order, then both regression files with `psql -v ON_ERROR_STOP=1`. Concurrency tests require local trust authentication and the standard `dblink` extension. No project dependency was added.

## Deployment and remaining limits

- Apply the two new migrations to the configured Supabase project together with the updated client. Old clients cannot claim focus rewards after the migration, and new clients need the new start endpoint. No remote migration or hosted integration test was performed.
- The preserved five-seed immediate-abandonment rule still permits repeated start/abandon farming. Closing that requires a product decision about minimum duration, cooldown, or abandonment rewards. Server elapsed time also cannot prove that a user actually maintained focus.
- Historical catalog listings cannot be classified reliably as administrative or user-forged from the existing schema. Existing suspicious catalog rows need an administrative review; this migration does not delete or reclassify them.
- Upload limits count mutable listing timestamps and are not serialized; malicious concurrent/backdated inserts may exceed the intended daily limit. This review preserves that policy rather than claiming it is an effective anti-abuse quota.

The SQL checks demonstrate the repaired paths; they are not a complete security audit or proof that all existing data is valid.
