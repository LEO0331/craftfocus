import { describe, expect, it, vi } from 'vitest';
import { verifyDeploymentEnvironment } from '../../tools/verify-deployment-env.mjs';

describe('verifyDeploymentEnvironment', () => {
  it('rejects missing and placeholder configuration', async () => {
    await expect(verifyDeploymentEnvironment({ supabaseUrl: '', anonKey: '' })).rejects.toThrow('must both be configured');
    await expect(verifyDeploymentEnvironment({
      supabaseUrl: 'https://placeholder.supabase.co', anonKey: 'your_supabase_key',
    })).rejects.toThrow('placeholder');
  });

  it('rejects unreachable projects with their origin', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    await expect(verifyDeploymentEnvironment({
      supabaseUrl: 'https://project.supabase.co', anonKey: 'public-key', fetchImpl,
    })).rejects.toThrow('Supabase Auth is unreachable at https://project.supabase.co');
  });

  it('accepts a healthy Supabase Auth endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    await expect(verifyDeploymentEnvironment({
      supabaseUrl: 'https://project.supabase.co', anonKey: 'public-key', fetchImpl,
    })).resolves.toBe('https://project.supabase.co');
    expect(fetchImpl).toHaveBeenCalledWith(
      new URL('https://project.supabase.co/auth/v1/health'),
      expect.objectContaining({ headers: { apikey: 'public-key' } }),
    );
  });
});
