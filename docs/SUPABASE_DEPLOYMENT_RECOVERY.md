# Supabase Deployment Recovery

The GitHub Pages app is static and currently loads correctly. Account creation
depends on a separate Supabase project. The previously deployed project URL,
`https://zhiuvtldfgbqmydgrksh.supabase.co`, no longer resolves in DNS, so login
and signup cannot reach Supabase Auth.

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
