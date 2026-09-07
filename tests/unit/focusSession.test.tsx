import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase', () => ({ supabase: { rpc } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
import { useFocusSession } from '@/hooks/useFocusSession';

let renderer: any;
let hook: ReturnType<typeof useFocusSession>;
function Harness() { hook = useFocusSession(); return null; }
afterEach(() => { act(() => renderer?.unmount()); rpc.mockReset(); });

describe('server-authoritative focus sessions', () => {
  it('starts on the server and submits only the issued ID and final status', async () => {
    act(() => { renderer = TestRenderer.create(<Harness />); });
    rpc.mockResolvedValueOnce({ data: 'session-1', error: null });
    const id = await hook.startFocusSession(25, 'sewing');
    expect(rpc).toHaveBeenLastCalledWith('start_focus_session', { p_duration_minutes: 25, p_mode: 'sewing' });
    rpc.mockResolvedValueOnce({ data: [{ coins: 25, seeds_balance: 100 }], error: null });
    await act(async () => {
      expect(await hook.submitFocusSession({ sessionId: id, status: 'completed' })).toEqual({ coins: 25, seedsBalance: 100 });
    });
    expect(rpc).toHaveBeenLastCalledWith('award_seeds_for_session', { p_session_id: 'session-1', p_status: 'completed' });
  });

  it('does not invent rewards when the server returns no result', async () => {
    act(() => { renderer = TestRenderer.create(<Harness />); });
    rpc.mockResolvedValue({ data: [], error: null });
    await act(async () => {
      await expect(hook.submitFocusSession({ sessionId: 'session-1', status: 'completed' })).rejects.toThrow('did not return');
    });
    expect(hook.isSaving).toBe(false);
  });
});
