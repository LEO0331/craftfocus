import React, { useEffect, useMemo, useState } from 'react';
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
  animationSpriteId?: any;
  mode: FocusMode;
}

export function FocusTimer({ totalSeconds, onCompleted, onStop, animationSpriteId, mode }: FocusTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (remaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRemaining((current) => {
        const next = current - 1;
        if (next <= 0) {
          clearInterval(timer);
          onCompleted();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onCompleted, remaining]);

  const clockLabel = useMemo(() => {
    const mins = Math.floor(remaining / 60)
      .toString()
      .padStart(2, '0');
    const secs = (remaining % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, [remaining]);

  return (
    <Card>
      <Text style={styles.title}>Focus In Progress</Text>
      <Text style={styles.sub}>Don\'t interrupt me</Text>

      <View style={styles.timerBox}>
        <Text style={styles.timerText}>⌛ {clockLabel}</Text>
      </View>

      <View style={styles.animationPanel}>
        {animationSpriteId ? <PixelSprite spriteId={animationSpriteId} size={88} /> : null}
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
