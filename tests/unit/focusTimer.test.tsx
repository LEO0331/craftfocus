import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('@/components/Button', () => ({ Button: 'Button' }));
vi.mock('@/components/Card', () => ({ Card: 'Card' }));
vi.mock('@/components/AsciiPet', () => ({ AsciiPet: 'AsciiPet' }));

import { FocusTimer } from '@/components/FocusTimer';

describe('FocusTimer completion', () => {
  let renderer: any;
  const onCompleted = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    onCompleted.mockClear();
  });

  afterEach(() => {
    act(() => renderer?.unmount());
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function render(development: boolean) {
    vi.stubGlobal('__DEV__', development);
    act(() => {
      renderer = TestRenderer.create(
        <FocusTimer totalSeconds={60} onCompleted={onCompleted} onStop={vi.fn()}
          asciiArt="cat" activityLabel="Sewing" title="Focus" subtitle="Stay focused"
          stopLabel="Stop" />
      );
    });
    return renderer.root.findAllByType('Button' as React.ElementType);
  }

  it('offers only Stop in production and completes once after the full duration', () => {
    const buttons = render(false);
    expect(buttons.map((button: any) => button.props.label)).toEqual(['Stop']);
    act(() => vi.advanceTimersByTime(59_999));
    expect(onCompleted).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onCompleted).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(60_000));
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  it('does not bypass server timing in development either', () => {
    const buttons = render(true);
    const shortcut = buttons.find((button: any) => button.props.label === 'Dev: Complete Now');
    expect(shortcut).toBeUndefined();
    expect(onCompleted).not.toHaveBeenCalled();
  });
});
