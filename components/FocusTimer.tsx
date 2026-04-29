import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PixelSprite } from '@/components/PixelSprite';
import { theme } from '@/constants/theme';
import type { FocusMode } from '@/types/models';

interface FocusTimerProps {
  totalSeconds: number;
  onCompleted: () => void;
  onStop: () => void;
  animationSpriteId?: string;
  mode: FocusMode;
}

export function FocusTimer({ totalSeconds, onCompleted, onStop, animationSpriteId, mode }: FocusTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [hourglassFrame, setHourglassFrame] = useState(0);
  const onCompletedRef = useRef(onCompleted);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  useEffect(() => {
    setRemaining(totalSeconds);
    setHourglassFrame(0);
  }, [totalSeconds]);

  useEffect(() => {
    if (totalSeconds <= 0) {
      return;
    }

    const endAt = Date.now() + totalSeconds * 1000;
    const timer = setInterval(() => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0) {
        clearInterval(timer);
        onCompletedRef.current();
      }
    }, 250);

    return () => clearInterval(timer);
  }, [totalSeconds]);

  useEffect(() => {
    const spinner = setInterval(() => {
      setHourglassFrame((prev) => (prev + 1) % 2);
    }, 450);
    return () => clearInterval(spinner);
  }, []);

  const hourglassGlyph = useMemo(() => (hourglassFrame === 0 ? '⌛' : '⏳'), [hourglassFrame]);

  const clockLabel = useMemo(() => {
    const mins = Math.floor(remaining / 60)
      .toString()
      .padStart(2, '0');
    const secs = (remaining % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, [remaining]);

  const resolvedSpriteId = animationSpriteId && animationSpriteId.length > 0 ? animationSpriteId : 'cat_general_0';

  return (
    <Card>
      <Text style={styles.title}>Focus In Progress</Text>
      <Text style={styles.sub}>Do not interrupt me</Text>

      <View style={styles.timerBox}>
        <Text style={styles.timerText}>
          {hourglassGlyph} {clockLabel}
        </Text>
      </View>

      <View style={styles.animationPanel}>
        <PixelSprite spriteId={resolvedSpriteId} size={88} />
        <Text style={styles.modeLabel}>{mode.toUpperCase()} MODE</Text>
      </View>

      <View style={styles.row}>
        <Button label="Stop Focus" onPress={onStop} variant="danger" />
      </View>

      <Button label="Dev: Complete Now" onPress={onCompleted} />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sub: {
    color: theme.colors.muted,
    fontWeight: '600',
  },
  timerBox: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#EEF7EC',
  },
  timerText: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 1,
    color: theme.colors.primaryDark,
  },
  animationPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F7F0E2',
    gap: 8,
    paddingVertical: 8,
  },
  modeLabel: {
    fontWeight: '700',
    color: theme.colors.accent,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
