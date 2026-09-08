# Supabase Deployment Recovery

The September 8, 2026 signup outage was caused by a deleted or obsolete
Supabase project URL. Recovery completed using project `dotbjffrepidvlmokhgl`,
with all migrations applied, Auth URLs configured, GitHub secrets replaced, and
GitHub Pages deployment #72 verified. Keep this procedure as the recovery
runbook for future backend replacements.

## Restore the backend

1. Create or recover a Supabase project.
2. Apply every migration in `supabase/migrations` in filename order. With a
   linked Supabase CLI project, run `supabase db push`.
3. In Supabase Auth URL Configuration, use:
   - Site URL: `https://leo0331.github.io/craftfocus/`
   - Redirect URL: `https://leo0331.github.io/craftfocus/`
4. In the GitHub repository's Actions secrets, replace:
   - `EXPO_PUBLIC_SUPABASE_URL` with the project URL.
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` with the project's public anon or
     publishable key. Never use the service-role key.
5. Run the **Deploy Web (GitHub Pages)** workflow. Its preflight now verifies
   that Supabase Auth is reachable before publishing the bundle.
6. Test signup with an inbox you control and complete email confirmation when
   confirmation is enabled.

If the old project was deleted, its database and users cannot be recovered from
this frontend repository. A new project starts with an empty database after the
migrations are applied.
