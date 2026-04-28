import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { theme } from '@/constants/theme';

interface FocusTimerProps {
  totalSeconds: number;
  onCompleted: () => void;
  onGiveUp: () => void;
}

export function FocusTimer({ totalSeconds, onCompleted, onGiveUp }: FocusTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setRemaining(totalSeconds);
    setIsPaused(false);
  }, [totalSeconds]);

  useEffect(() => {
    if (isPaused || remaining <= 0) {
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
  }, [isPaused, onCompleted, remaining]);

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
      <View style={styles.timerBox}>
        <Text style={styles.timerText}>{clockLabel}</Text>
      </View>

      <View style={styles.row}>
        <Button label={isPaused ? 'Resume' : 'Pause'} onPress={() => setIsPaused((prev) => !prev)} variant="secondary" />
        <Button label="Give Up" onPress={onGiveUp} variant="danger" />
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
  timerBox: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#EEF7EC',
  },
  timerText: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 2,
    color: theme.colors.primaryDark,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
