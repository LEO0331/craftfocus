import { describe, expect, it, vi } from 'vitest';

import { createDeleteAccountHandler } from '../../supabase/functions/delete-my-account';

type Fetch = NonNullable<Parameters<typeof createDeleteAccountHandler>[1]>;
const config = { url: 'https://example.supabase.co', anonKey: 'public-key', serviceKey: 'server-key' };
const callerId = '10000000-0000-0000-0000-000000000001';
const userToken = 'caller-token';
const body = { userId: '10000000-0000-0000-0000-000000000002' };

function post() {
  return new Request('https://example.supabase.co/functions/v1/delete-my-account', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('delete-my-account Edge Function', () => {
  it('supports browser preflight and requires an authenticated request for deletion', async () => {
    const fetchImpl = vi.fn<Fetch>();
    const handler = createDeleteAccountHandler(config, fetchImpl);
    const preflight = await handler(new Request(post().url, { method: 'OPTIONS' }));
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('Access-Control-Allow-Headers')).toContain('authorization');
    expect(preflight.headers.get('Access-Control-Allow-Methods')).toContain('POST');

    const result = await handler(new Request(post().url, { method: 'POST' }));
    expect(result.status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('removes the authenticated caller’s objects from consecutive pages before deleting their account', async () => {
    const paths = ['user/first.jpg', 'user/nested/second.png'];
    const fetchImpl = vi.fn<Fetch>()
      .mockResolvedValueOnce(Response.json({ id: callerId }))
      .mockResolvedValueOnce(Response.json([{ bucket_id: 'craft-images', object_name: paths[0] }]))
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json([{ bucket_id: 'craft-images', object_name: paths[1] }]))
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await createDeleteAccountHandler(config, fetchImpl)(post());
    expect(result.status).toBe(200);

    const requests = fetchImpl.mock.calls.map(([url, init]) => new Request(url, init));
    expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
      '/auth/v1/user',
      '/rest/v1/rpc/list_account_storage_objects',
      '/storage/v1/object/craft-images',
      '/rest/v1/rpc/list_account_storage_objects',
      '/storage/v1/object/craft-images',
      '/rest/v1/rpc/list_account_storage_objects',
      '/rest/v1/rpc/delete_my_account',
    ]);
    for (const index of [1, 3, 5]) {
      expect(requests[index].headers.get('apikey')).toBe(config.serviceKey);
      expect(await requests[index].json()).toEqual({ p_user_id: callerId });
    }
    for (const [page, index] of [2, 4].entries()) {
      expect(requests[index].method).toBe('DELETE');
      expect(await requests[index].json()).toEqual({ prefixes: [paths[page]] });
    }
    expect(requests[6].headers.get('apikey')).toBe(config.anonKey);
    expect(requests[6].headers.get('authorization')).toBe(`Bearer ${userToken}`);
  });

  it('retains the account when Storage removal fails', async () => {
    const fetchImpl = vi.fn<Fetch>()
      .mockResolvedValueOnce(Response.json({ id: callerId }))
      .mockResolvedValueOnce(Response.json([{ bucket_id: 'craft-images', object_name: 'user/photo.jpg' }]))
      .mockResolvedValueOnce(Response.json({ message: 'Storage failed' }, { status: 400 }));

    const result = await createDeleteAccountHandler(config, fetchImpl)(post());
    expect(result.status).toBe(503);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});
