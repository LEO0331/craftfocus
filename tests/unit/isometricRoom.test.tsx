import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (choices: any) => choices.default },
  StyleSheet: { create: (styles: unknown) => styles, absoluteFill: { position: 'absolute' } },
  View: 'View', Text: 'Text', Pressable: 'Pressable',
  useWindowDimensions: () => ({ width: 390, height: 844 }),
}));
vi.mock('@/components/PixelSprite', () => ({ PixelSprite: 'PixelSprite' }));
import { IsometricRoom } from '@/components/IsometricRoom';

describe('room viewing and placement', () => {
  let renderer: any;
  afterEach(() => act(() => renderer?.unmount()));
  const placement = { id: 'owned', anchor_id: 'bed_left', item_id: 'plant' };
  const anchors = () => renderer.root.findAllByType('Pressable').filter((item: any) => item.props.testID?.startsWith('room-anchor-'));
  const button = (label: string) => renderer.root.findAllByType('Pressable').find((item: any) => item.findAllByType('Text').some((text: any) => text.props.children === label));

  it('hides editing spots without removing owned items and restores the original selection callbacks', () => {
    const select = vi.fn();
    act(() => { renderer = TestRenderer.create(<IsometricRoom roomType="bedroom" placements={[placement]} selectedAnchorId="bed_left" onSelectAnchor={select} />); });
    expect(anchors()).toHaveLength(10);
    act(() => anchors()[0].props.onPress());
    expect(select).toHaveBeenCalledWith('bed_left');
    act(() => button('Hide spots').props.onPress());
    expect(anchors()).toHaveLength(1);
    expect(anchors()[0].props.disabled).toBe(true);
    act(() => button('Show spots').props.onPress());
    expect(anchors()).toHaveLength(10);
    expect(anchors()[0].props.accessibilityState.selected).toBe(true);
  });

  it('keeps visitor rooms free of editing controls while allowing lighting changes', () => {
    act(() => { renderer = TestRenderer.create(<IsometricRoom roomType="bedroom" readOnly placements={[placement]} selectedAnchorId={null} onSelectAnchor={vi.fn()} />); });
    expect(anchors()).toHaveLength(1);
    expect(button('Hide spots')).toBeUndefined();
    const evening = renderer.root.findAllByType('Pressable').find((item: any) => item.props.accessibilityLabel === 'Evening');
    act(() => evening.props.onPress());
    expect(evening.props.accessibilityState.selected).toBe(true);
  });
});
