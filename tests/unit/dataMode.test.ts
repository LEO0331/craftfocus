import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ platform: { OS: 'web' }, createClient: vi.fn() }));
vi.mock('react-native', () => ({ Platform: mocks.platform }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
vi.mock('expo-secure-store', () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  mocks.createClient.mockReset();
  mocks.platform.OS = 'web';
});

describe('data mode selection', () => {
  it('keeps the online client disabled even when credentials exist in a local web build', async () => {
    vi.stubEnv('EXPO_PUBLIC_DATA_MODE', 'local');
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://demo.supabase.co');
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'test-key');

    const { supabase } = await import('@/lib/supabase');

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(() => supabase.auth).toThrow('requires Online Mode');
  });

  it('keeps explicit Supabase mode and surfaces initialization failures', async () => {
    vi.stubEnv('EXPO_PUBLIC_DATA_MODE', 'supabase');
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://demo.supabase.co');
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'test-key');
    mocks.createClient.mockImplementation(() => { throw new Error('Online initialization failed'); });

    await expect(import('@/lib/supabase')).rejects.toThrow('Online initialization failed');
  });

  it.each(['ios', 'android'])('retains online mode on %s when local is set', async (platform) => {
    mocks.platform.OS = platform;
    vi.stubEnv('EXPO_PUBLIC_DATA_MODE', 'local');

    const { isLocalMode } = await import('@/lib/data-mode');

    expect(isLocalMode).toBe(false);
  });
});
