import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listRoom: vi.fn(),
  listPlacements: vi.fn(),
  listItems: vi.fn(),
  t: (key: string) => key,
}));

vi.mock('react-native', () => {
  const React = require('react');
  return {
    ScrollView: ({ children, ...props }: any) => React.createElement('ScrollView', props, children),
    Text: ({ children, ...props }: any) => React.createElement('Text', props, children),
    View: ({ children, ...props }: any) => React.createElement('View', props, children),
    StyleSheet: { create: (styles: unknown) => styles },
  };
});
vi.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: 'friend-1' }) }));
vi.mock('@/hooks/useI18n', () => ({ useI18n: () => ({ t: mocks.t }) }));
vi.mock('@/lib/rooms', () => ({ listPublicRoomLayout: mocks.listRoom }));
vi.mock('@/lib/gallery', () => ({
  listPublicGalleryPlacements: mocks.listPlacements,
  listPublicGalleryItems: mocks.listItems,
}));
vi.mock('@/components/AppLoading', () => ({ AppLoading: (props: any) => React.createElement('AppLoading', props) }));
vi.mock('@/components/Button', () => ({ Button: (props: any) => React.createElement('Button', props) }));
vi.mock('@/components/Card', () => ({ Card: ({ children }: any) => React.createElement('Card', null, children) }));
vi.mock('@/components/IsometricRoom', () => ({ IsometricRoom: (props: any) => React.createElement('IsometricRoom', props) }));
vi.mock('@/components/CollectibleGalleryBoard', () => ({ CollectibleGalleryBoard: (props: any) => React.createElement('CollectibleGalleryBoard', props) }));

import UserRoomScreen from '@/app/users/[id]/room';

describe('friend room loading flow', () => {
  let renderer: any;
  let resolveRoom: (value: unknown) => void;
  let resolvePlacements: (value: unknown) => void;
  let resolveItems: (value: unknown) => void;

  beforeEach(() => {
    mocks.listRoom.mockReset();
    mocks.listPlacements.mockReset();
    mocks.listItems.mockReset();
    mocks.listRoom.mockReturnValue(new Promise((resolve) => { resolveRoom = resolve; }));
    mocks.listPlacements.mockReturnValue(new Promise((resolve) => { resolvePlacements = resolve; }));
    mocks.listItems.mockReturnValue(new Promise((resolve) => { resolveItems = resolve; }));
  });

  afterEach(() => act(() => renderer?.unmount()));

  it('does not render the default bedroom before the persisted gym loads', async () => {
    act(() => { renderer = TestRenderer.create(<UserRoomScreen />); });
    expect(renderer.root.findAllByType('AppLoading' as React.ElementType)).toHaveLength(1);
    expect(renderer.root.findAllByType('IsometricRoom' as React.ElementType)).toHaveLength(0);

    await act(async () => {
      resolveRoom({ roomType: 'gym', placements: [] });
      resolvePlacements([]);
      resolveItems([]);
      await Promise.resolve();
    });

    const room = renderer.root.findByType('IsometricRoom' as React.ElementType);
    expect(room.props.roomType).toBe('gym');
    expect(renderer.root.findAllByType('AppLoading' as React.ElementType)).toHaveLength(0);
  });
});
