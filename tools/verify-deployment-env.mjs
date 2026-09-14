import { pathToFileURL } from 'node:url';

export const EXPECTED_DEPLOYMENT_CONTRACT = '2026-09-14.1';

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

  const contractUrl = new URL('/rest/v1/rpc/deployment_contract_version', parsedUrl);
  let contractResponse;
  try {
    contractResponse = await fetchImpl(contractUrl, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${anonKey}`,
        'content-type': 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Supabase schema contract is unreachable at ${parsedUrl.origin}: ${detail}`);
  }
  if (!contractResponse.ok) {
    throw new Error(`Supabase schema contract check failed with HTTP ${contractResponse.status}. Apply pending migrations before deployment.`);
  }

  const contractVersion = await contractResponse.json();
  if (contractVersion !== EXPECTED_DEPLOYMENT_CONTRACT) {
    throw new Error(
      `Supabase schema contract mismatch: expected ${EXPECTED_DEPLOYMENT_CONTRACT}, received ${String(contractVersion)}.`
    );
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
