import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '@supabase/supabase-js/cors';

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};

const MAX_BATCHES_PER_REQUEST = 10;
const headers = { ...corsHeaders, 'Access-Control-Allow-Methods': 'POST, OPTIONS' };

type Configuration = { url?: string; anonKey?: string; serviceKey?: string };
type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type StorageObject = { bucket_id: string; object_name: string };
type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      list_account_storage_objects: { Args: { p_user_id: string }; Returns: StorageObject[] };
      delete_my_account: { Args: Record<string, never>; Returns: undefined };
    };
  };
};

function fail(message: string, status: number) {
  return Response.json({ error: message }, { headers, status });
}

export function createDeleteAccountHandler({ url, anonKey, serviceKey }: Configuration, fetchImpl: Fetch = fetch) {
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') return new Response(null, { headers, status: 204 });
    if (request.method !== 'POST') return fail('Method not allowed', 405);

    const authorization = request.headers.get('Authorization');
    const accessToken = authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!accessToken) return fail('Sign in before deleting your account', 401);
    if (!url || !anonKey || !serviceKey) return fail('Account deletion is unavailable', 503);

    const auth = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };
    const caller = createClient<Database>(url, anonKey, {
      auth,
      global: { fetch: fetchImpl, headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: { user }, error: authError } = await caller.auth.getUser(accessToken);
    if (authError || !user?.id) return fail('Sign in before deleting your account', 401);

    const admin = createClient<Database>(url, serviceKey, { auth, global: { fetch: fetchImpl } });

    // Always take the first page: successfully removed objects disappear from the
    // next query. A retry resumes on the remaining objects without an offset.
    for (let batch = 0; ; batch += 1) {
      const { data: objects, error: listError } = await admin.rpc('list_account_storage_objects', { p_user_id: user.id });
      if (listError || !objects) return fail('Could not list account files. Please try again.', 503);

      if (objects.length === 0) {
        const { error } = await caller.rpc('delete_my_account');
        return error
          ? fail('Could not finish deleting your account. Please try again.', 409)
          : Response.json({ success: true }, { headers });
      }
      if (batch === MAX_BATCHES_PER_REQUEST) {
        return fail('Some files remain. Please try deleting your account again.', 409);
      }

      const pathsByBucket = new Map<string, string[]>();
      for (const object of objects) {
        const paths = pathsByBucket.get(object.bucket_id) ?? [];
        paths.push(object.object_name);
        pathsByBucket.set(object.bucket_id, paths);
      }
      for (const [bucket, paths] of pathsByBucket) {
        const { error } = await admin.storage.from(bucket).remove(paths);
        if (error) return fail('Could not remove account files. Please try again.', 503);
      }
    }
  };
}

if (typeof Deno !== 'undefined') {
  Deno.serve(createDeleteAccountHandler({
    url: Deno.env.get('SUPABASE_URL'),
    anonKey: Deno.env.get('SUPABASE_ANON_KEY'),
    serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  }));
}
