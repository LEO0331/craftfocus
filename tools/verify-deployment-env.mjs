import { pathToFileURL } from 'node:url';

export async function verifyDeploymentEnvironment({
  supabaseUrl,
  anonKey,
  fetchImpl = fetch,
}) {
  if (!supabaseUrl || !anonKey) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must both be configured.');
  }
  if (/placeholder|your[_-]?supabase/i.test(`${supabaseUrl} ${anonKey}`)) {
    throw new Error('Supabase deployment variables still contain placeholder values.');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL is not a valid URL.');
  }
  if (parsedUrl.protocol !== 'https:' || !parsedUrl.hostname.endsWith('.supabase.co')) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL must be an HTTPS Supabase project URL.');
  }

  const healthUrl = new URL('/auth/v1/health', parsedUrl);
  let response;
  try {
    response = await fetchImpl(healthUrl, {
      headers: { apikey: anonKey },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Supabase Auth is unreachable at ${parsedUrl.origin}: ${detail}`);
  }
  if (!response.ok) {
    throw new Error(`Supabase Auth health check failed with HTTP ${response.status}.`);
  }
  return parsedUrl.origin;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifyDeploymentEnvironment({
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  })
    .then((origin) => console.log(`Supabase Auth is reachable: ${origin}`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
