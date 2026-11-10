# Supabase Deployment Recovery

The September 8, 2026 signup outage was caused by a deleted or obsolete
Supabase project URL. Recovery completed using project `dotbjffrepidvlmokhgl`,
with all migrations applied, Auth URLs configured, GitHub secrets replaced, and
GitHub Pages deployment #76 verified. Keep this procedure as the recovery
runbook for future backend replacements.

The Pages workflow currently exports Local Demo Mode. Use this runbook when
planning a return to Supabase Mode.

The first recovery attempt exposed a missing catalog seed: new-user creation
grants a starter `plant`, but that row previously lived only in the optional
manual seed file. Migration `20260908120000_seed_required_item_catalog.sql`
now installs all required official items during every fresh deployment.

The project currently uses immediate signup because Supabase's built-in test
mailer is limited to two emails per hour. **Confirm email** is disabled until a
production SMTP provider is configured.

## Restore the backend

First check the existing project in the Supabase dashboard. A paused project
can stop resolving in DNS even though its database, backups, and storage are
retained. If the dashboard shows **Project is paused**, choose **Resume
project** and wait for its services to become healthy. Keep the same project
URL and public key, then rerun the failed deployment. Do not create a new
project or reapply migrations solely because a paused hostname is unreachable.

If the existing project cannot be resumed, use the replacement procedure:

1. Create or recover a Supabase project.
2. Apply every migration in `supabase/migrations` in filename order. With a
   linked Supabase CLI project, run `supabase db push`.
   The Supabase deploy preflight calls `deployment_contract_version` and
   requires the expected version.
3. In Supabase Auth URL Configuration, use:
   - Site URL: `https://leo0331.github.io/craftfocus/`
   - Redirect URL: `https://leo0331.github.io/craftfocus/`
4. In the GitHub repository's Actions secrets, replace:
   - `EXPO_PUBLIC_SUPABASE_URL` with the project URL.
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` with the project's public anon or
     publishable key. Never use the service-role key.
5. In `.github/workflows/deploy-pages.yml`, set both jobs'
   `EXPO_PUBLIC_DATA_MODE` to `supabase` and pass the two public secrets into
   the deploy job's preflight and export steps. Keep
   `npm run verify:deployment-env` ahead of the export. If Lighthouse should
   audit the online build, mirror the mode and secret inputs in
   `.github/workflows/lighthouse.yml`.
6. Review and run the **Deploy Web (GitHub Pages)** workflow. It validates the
   online Auth endpoint and schema contract, and its quality job verifies
   TypeScript, unit/browser tests, fresh migrations, and regression and
   concurrency checks.
7. Test signup with an inbox you control and complete email confirmation when
   confirmation is enabled.

Set the Actions repository variable `SUPABASE_HEALTH_ENABLED=true` to resume
scheduled health checks. To return Pages to the demo build, restore `local` in
the workflow jobs, remove the secret inputs from the preflight and export
steps, and unset the health-check variable. Demo backups remain browser-local.

If the old project was deleted, its database and users cannot be recovered from
this frontend repository. A new project starts with an empty database after the
migrations are applied.
