import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const platform = { OS: 'web' as 'web' | 'ios' | 'android' };
  const alertMock = vi.fn();
  const emitTopStatusRefreshMock = vi.fn();
  const submitFocusSessionMock = vi.fn(async (input: { status: string }) => ({
    coins: input.status === 'given_up' ? 5 : 25,
    seedsBalance: input.status === 'given_up' ? 105 : 125,
  }));
  const navigationAddListenerMock = vi.fn();
  const appStateAddEventListenerMock = vi.fn();

  return {
    platform,
    alertMock,
    emitTopStatusRefreshMock,
    submitFocusSessionMock,
    navigationAddListenerMock,
    appStateAddEventListenerMock,
  };
});

vi.mock('react-native', () => {
  const React = require('react');
  return {
    Alert: { alert: mocks.alertMock },
    AppState: {
      addEventListener: mocks.appStateAddEventListenerMock,
    },
    Platform: mocks.platform,
    ScrollView: ({ children, ...props }: any) => React.createElement('ScrollView', props, children),
    Text: ({ children, ...props }: any) => React.createElement('Text', props, children),
    StyleSheet: { create: (styles: unknown) => styles },
  };
});

vi.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({
      addListener: mocks.navigationAddListenerMock,
      canGoBack: () => true,
      goBack: vi.fn(),
    }),
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(() => callback(), [callback]);
    },
  };
});

vi.mock('@/components/Button', () => {
  const React = require('react');
  return {
    Button: ({ label, onPress, disabled }: any) =>
      React.createElement('Button', { label, onPress, disabled }),
  };
});

vi.mock('@/components/Card', () => {
  const React = require('react');
  return { Card: ({ children }: any) => React.createElement('Card', null, children) };
});

vi.mock('@/components/CategoryPicker', () => {
  const React = require('react');
  return { CategoryPicker: (props: any) => React.createElement('CategoryPicker', props) };
});

vi.mock('@/components/FocusTimer', () => {
  const React = require('react');
  return {
    FocusTimer: (props: any) => React.createElement('FocusTimer', props),
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'codex@test.com' } }),
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ profile: { display_name: 'Codex', username: 'codex', active_animal_id: 'dog' } }),
}));

vi.mock('@/hooks/useFocusSession', () => ({
  useFocusSession: () => ({
    submitFocusSession: mocks.submitFocusSessionMock,
    isSaving: false,
  }),
}));

vi.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const map: Record<string, string> = {
        'focus.start': 'Start Focus',
        'focus.result.completed': 'Great focus. +{coins} seeds. Balance: {balance}',
        'focus.result.stopped': 'Focus stopped. +{coins} seeds. Balance: {balance}',
        'focus.result.autoStoppedHint': 'Session stopped because focus view was left.',
        'focus.title': 'Focus Session',
        'focus.duration': 'Duration',
        'focus.timer.title': 'Focus In Progress',
        'focus.timer.subtitle': 'Do not interrupt me',
        'focus.timer.stop': 'Stop Focus',
        'focus.timer.devComplete': 'Dev: Complete Now',
        'focus.activity.sewingWithName': '{name} is sewing',
        'focus.activity.trainingWithName': '{name} is training',
        'profile.title': 'Profile',
        'focus.error.save': 'Could not save session',
        'common.unknownError': 'Unknown error',
      };
      let out = map[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          out = out.replaceAll(`{${k}}`, String(v));
        });
      }
      return out;
    },
  }),
}));

vi.mock('@/lib/animals', () => ({
  getActiveAnimal: vi.fn(async () => ({ sprite_key: 'dog' })),
  resolveAnimalSpecies: vi.fn((key: string) => (key.startsWith('dog') ? 'dog' : 'cat')),
}));

vi.mock('@/lib/topStatusBus', () => ({
  emitTopStatusRefresh: mocks.emitTopStatusRefreshMock,
}));

import FocusScreen from '@/app/(tabs)/focus';

function createDocumentStub() {
  const listeners = new Map<string, Set<() => void>>();

  return {
    hidden: false,
    addEventListener: (event: string, cb: () => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)?.add(cb);
    },
    removeEventListener: (event: string, cb: () => void) => {
      listeners.get(event)?.delete(cb);
    },
    dispatch: (event: string) => {
      listeners.get(event)?.forEach((cb) => cb());
    },
  };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

function findButtonByLabel(root: any, label: string) {
  return root.findAllByType('Button').find((node: { props: { label?: string } }) => node.props.label === label);
}

describe('Focus auto-stop policy', () => {
  let blurHandler: (() => void) | null;
  let appStateHandler: ((state: string) => void) | null;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.platform.OS = 'web';
    blurHandler = null;
    appStateHandler = null;

    mocks.navigationAddListenerMock.mockImplementation((event: string, cb: () => void) => {
      if (event === 'blur') blurHandler = cb;
      return () => {
        if (blurHandler === cb) blurHandler = null;
      };
    });

    mocks.appStateAddEventListenerMock.mockImplementation((_event: string, cb: (state: string) => void) => {
      appStateHandler = cb;
      return { remove: vi.fn(() => { appStateHandler = null; }) };
    });

    delete (globalThis as { document?: unknown }).document;
  });

  it('auto-stops on route blur while running', async () => {
    const doc = createDocumentStub();
    (globalThis as { document?: unknown }).document = doc;

    let renderer: any;
    await act(async () => {
      renderer = TestRenderer.create(<FocusScreen />);
    });

    const start = findButtonByLabel(renderer!.root, 'Start Focus');
    expect(start).toBeTruthy();

    await act(async () => {
      start?.props.onPress();
      await flush();
    });

    expect(blurHandler).toBeTypeOf('function');
    await act(async () => {
      blurHandler?.();
      await flush();
    });

    expect(mocks.submitFocusSessionMock).toHaveBeenCalledTimes(1);
    expect(mocks.submitFocusSessionMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'given_up' }));
  });

  it('auto-stops on browser visibility hidden while running', async () => {
    const doc = createDocumentStub();
    (globalThis as { document?: unknown }).document = doc;

    let renderer: any;
    await act(async () => {
      renderer = TestRenderer.create(<FocusScreen />);
    });

    await act(async () => {
      findButtonByLabel(renderer!.root, 'Start Focus')?.props.onPress();
      await flush();
    });

    doc.hidden = true;
    await act(async () => {
      doc.dispatch('visibilitychange');
      await flush();
    });

    expect(mocks.submitFocusSessionMock).toHaveBeenCalledTimes(1);
    expect(mocks.submitFocusSessionMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'given_up' }));
  });

  it('auto-stops on native app background while running', async () => {
    mocks.platform.OS = 'ios';

    let renderer: any;
    await act(async () => {
      renderer = TestRenderer.create(<FocusScreen />);
    });

    await act(async () => {
      findButtonByLabel(renderer!.root, 'Start Focus')?.props.onPress();
      await flush();
    });

    expect(appStateHandler).toBeTypeOf('function');
    await act(async () => {
      appStateHandler?.('background');
      await flush();
    });

    expect(mocks.submitFocusSessionMock).toHaveBeenCalledTimes(1);
    expect(mocks.submitFocusSessionMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'given_up' }));
  });

  it('stops only once when multiple leave events fire quickly', async () => {
    const doc = createDocumentStub();
    (globalThis as { document?: unknown }).document = doc;

    let renderer: any;
    await act(async () => {
      renderer = TestRenderer.create(<FocusScreen />);
    });

    await act(async () => {
      findButtonByLabel(renderer!.root, 'Start Focus')?.props.onPress();
      await flush();
    });

    doc.hidden = true;
    await act(async () => {
      blurHandler?.();
      doc.dispatch('visibilitychange');
      blurHandler?.();
      await flush();
    });

    expect(mocks.submitFocusSessionMock).toHaveBeenCalledTimes(1);
    expect(mocks.submitFocusSessionMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'given_up' }));
  });

  it('does nothing on leave events when not running', async () => {
    const doc = createDocumentStub();
    (globalThis as { document?: unknown }).document = doc;

    await act(async () => {
      TestRenderer.create(<FocusScreen />);
    });

    await act(async () => {
      blurHandler?.();
      doc.hidden = true;
      doc.dispatch('visibilitychange');
      appStateHandler?.('background');
      await flush();
    });

    expect(mocks.submitFocusSessionMock).toHaveBeenCalledTimes(0);
  });
});
