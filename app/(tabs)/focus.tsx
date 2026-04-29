import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryPicker } from '@/components/CategoryPicker';
import { FocusTimer } from '@/components/FocusTimer';
import { FOCUS_DURATIONS, FOCUS_MODES } from '@/constants/categories';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFocusSession } from '@/hooks/useFocusSession';
import { useI18n } from '@/hooks/useI18n';
import { getActiveAnimal, resolveAnimalVariant } from '@/lib/animals';
import type { FocusMode } from '@/types/models';

export default function FocusScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [duration, setDuration] = useState<(typeof FOCUS_DURATIONS)[number]>(25);
  const [mode, setMode] = useState<FocusMode>('general');
  const [isRunning, setIsRunning] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [animalSpriteKey, setAnimalSpriteKey] = useState('cat');
  const [animFrame, setAnimFrame] = useState(0);

  const { submitFocusSession, isSaving } = useFocusSession();

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    getActiveAnimal(user.id)
      .then((animal) => {
        if (animal?.sprite_key) {
          setAnimalSpriteKey(animal.sprite_key);
        }
      })
      .catch(() => {
        setAnimalSpriteKey('cat');
      });
  }, [user?.id]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const timer = setInterval(() => setAnimFrame((prev) => (prev + 1) % 2), 900);
    return () => clearInterval(timer);
  }, [isRunning]);

  const durationSeconds = useMemo(() => duration * 60, [duration]);
  const activeSprite = useMemo(() => resolveAnimalVariant(animalSpriteKey, mode, animFrame), [animalSpriteKey, mode, animFrame]);

  const handleFinish = async (status: 'completed' | 'given_up') => {
    try {
      const reward = await submitFocusSession({ durationMinutes: duration, mode, status });

      setResultText(
        status === 'completed'
          ? t('focus.result.completed', { coins: reward.coins, balance: reward.seedsBalance })
          : t('focus.result.stopped', { coins: reward.coins, balance: reward.seedsBalance })
      );
      setIsRunning(false);
    } catch (error) {
      Alert.alert(t('focus.error.save'), error instanceof Error ? error.message : 'Unknown error');
      setIsRunning(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('focus.title')}</Text>

      {!isRunning ? (
        <Card>
          <CategoryPicker
            label={t('focus.duration')}
            options={FOCUS_DURATIONS.map((value) => `${value}` as `${number}`)}
            selected={`${duration}`}
            onSelect={(value) => setDuration(Number(value) as (typeof FOCUS_DURATIONS)[number])}
          />

          <CategoryPicker label={t('focus.mode')} options={FOCUS_MODES} selected={mode} onSelect={(next) => setMode(next as FocusMode)} />

          <Button label={t('focus.start')} onPress={() => setIsRunning(true)} disabled={isSaving} />
          {resultText ? <Text style={styles.result}>{resultText}</Text> : null}
        </Card>
      ) : (
        <FocusTimer
          totalSeconds={durationSeconds}
          mode={mode}
          title={t('focus.timer.title')}
          subtitle={t('focus.timer.subtitle')}
          stopLabel={t('focus.timer.stop')}
          devCompleteLabel={t('focus.timer.devComplete')}
          animationSpriteId={activeSprite}
          onCompleted={() => {
            handleFinish('completed');
          }}
          onStop={() => {
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
