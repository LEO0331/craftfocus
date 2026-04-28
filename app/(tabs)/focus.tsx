import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryPicker } from '@/components/CategoryPicker';
import { FocusTimer } from '@/components/FocusTimer';
import { BUILD_TARGETS, FOCUS_CATEGORIES, FOCUS_DURATIONS } from '@/constants/categories';
import { theme } from '@/constants/theme';
import { useFocusSession } from '@/hooks/useFocusSession';
import type { BuildTargetId, FocusCategory } from '@/types/models';

const TARGET_IDS = BUILD_TARGETS.map((target) => target.id);
const TARGET_LABELS = new Map(BUILD_TARGETS.map((target) => [target.id, target.label] as const));

export default function FocusScreen() {
  const [duration, setDuration] = useState<(typeof FOCUS_DURATIONS)[number]>(25);
  const [category, setCategory] = useState<FocusCategory>('craft');
  const [buildTarget, setBuildTarget] = useState<BuildTargetId>('leather_wallet');
  const [isRunning, setIsRunning] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);

  const { submitFocusSession, isSaving } = useFocusSession();

  const durationSeconds = useMemo(() => duration * 60, [duration]);

  const handleFinish = async (status: 'completed' | 'given_up') => {
    try {
      const reward = await submitFocusSession({
        durationMinutes: duration,
        category,
        buildTarget,
        status,
      });

      setResultText(
        status === 'completed'
          ? `Great job! +${reward.coins} coins, +${reward.progress} progress`
          : `Saved partial build: +${reward.coins} coins, +${reward.progress} progress`
      );
      setIsRunning(false);
    } catch (error) {
      Alert.alert('Could not save session', error instanceof Error ? error.message : 'Unknown error');
      setIsRunning(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Focus Session</Text>

      {!isRunning ? (
        <Card>
          <CategoryPicker
            label="Duration"
            options={FOCUS_DURATIONS.map((value) => `${value}` as `${number}`)}
            selected={`${duration}`}
            onSelect={(value) => setDuration(Number(value) as (typeof FOCUS_DURATIONS)[number])}
          />

          <CategoryPicker label="Category" options={FOCUS_CATEGORIES} selected={category} onSelect={setCategory} />

          <CategoryPicker
            label="Build Target"
            options={TARGET_IDS}
            selected={buildTarget}
            onSelect={setBuildTarget}
            renderLabel={(option) => TARGET_LABELS.get(option as BuildTargetId) ?? option}
          />

          <Button label="Start Focus" onPress={() => setIsRunning(true)} disabled={isSaving} />
          {resultText ? <Text style={styles.result}>{resultText}</Text> : null}
        </Card>
      ) : (
        <FocusTimer
          totalSeconds={durationSeconds}
          onCompleted={() => {
            handleFinish('completed');
          }}
          onGiveUp={() => {
            handleFinish('given_up');
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  result: {
    color: theme.colors.info,
    fontWeight: '700',
  },
});
