import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ platform: { OS: 'web' }, alert: vi.fn() }));
vi.mock('react-native', () => ({ Platform: mocks.platform, Alert: { alert: mocks.alert } }));
import { Alert } from '@/lib/alert';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  mocks.platform.OS = 'web';
});

describe('cross-platform alerts', () => {
  it('shows browser informational alerts', () => {
    const alert = vi.fn();
    vi.stubGlobal('window', { alert });
    Alert.alert('Saved', 'Your profile was updated');
    expect(alert).toHaveBeenCalledWith('Saved\n\nYour profile was updated');
  });

  it.each([true, false])('runs only the selected confirmation callback (%s)', (confirmed) => {
    const remove = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal('window', { confirm: vi.fn(() => confirmed) });
    Alert.alert('Delete account?', 'This is permanent', [
      { text: 'Cancel', style: 'cancel', onPress: cancel },
      { text: 'Delete', style: 'destructive', onPress: remove },
    ]);
    expect(remove).toHaveBeenCalledTimes(confirmed ? 1 : 0);
    expect(cancel).toHaveBeenCalledTimes(confirmed ? 0 : 1);
  });

  it('preserves native alerts and button options', () => {
    mocks.platform.OS = 'ios';
    const buttons = [{ text: 'OK', onPress: vi.fn() }];
    Alert.alert('Title', 'Message', buttons, { cancelable: false });
    expect(mocks.alert).toHaveBeenCalledWith('Title', 'Message', buttons, { cancelable: false });
  });
});
