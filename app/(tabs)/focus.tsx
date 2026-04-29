import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryPicker } from '@/components/CategoryPicker';
import { FocusTimer } from '@/components/FocusTimer';
import { resolveAsciiAnimalFrame } from '@/constants/asciiPets';
import { FOCUS_DURATIONS } from '@/constants/categories';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFocusSession } from '@/hooks/useFocusSession';
import { useI18n } from '@/hooks/useI18n';
import { useProfile } from '@/hooks/useProfile';
import { emitTopStatusRefresh } from '@/lib/topStatusBus';
import { getActiveAnimal, resolveAnimalSpecies } from '@/lib/animals';

export default function FocusScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { profile } = useProfile();
  const [duration, setDuration] = useState<(typeof FOCUS_DURATIONS)[number]>(25);
  const [activityMode, setActivityMode] = useState<'sewing' | 'training'>('sewing');
  const [isRunning, setIsRunning] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [animalSpecies, setAnimalSpecies] = useState<'cat' | 'dog' | 'rabbit' | 'fox'>('cat');
  const [animFrame, setAnimFrame] = useState(0);

  const { submitFocusSession, isSaving } = useFocusSession();

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    getActiveAnimal(user.id)
      .then((animal) => {
        if (animal?.sprite_key) {
          setAnimalSpecies(resolveAnimalSpecies(animal.sprite_key));
        }
      })
      .catch(() => {
        setAnimalSpecies('cat');
      });
  }, [user?.id]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const timer = setInterval(() => setAnimFrame((prev) => (prev + 1) % 3), 500);
    return () => clearInterval(timer);
  }, [isRunning]);

  const durationSeconds = useMemo(() => duration * 60, [duration]);
  const asciiArt = useMemo(
    () => resolveAsciiAnimalFrame(animalSpecies, activityMode, animFrame),
    [animalSpecies, activityMode, animFrame]
  );

  const activityLabel = useMemo(
    () => {
      const name =
        profile?.display_name?.trim() ||
        profile?.username?.trim() ||
        user?.email?.split('@')[0] ||
        t('profile.title');
      return activityMode === 'sewing'
        ? t('focus.activity.sewingWithName', { name })
        : t('focus.activity.trainingWithName', { name });
    },
    [activityMode, profile?.display_name, profile?.username, t, user?.email]
  );

  const handleFinish = async (status: 'completed' | 'given_up') => {
    try {
      const reward = await submitFocusSession({
        durationMinutes: duration,
        mode: activityMode === 'sewing' ? 'sewing' : 'crafting',
        status,
      });

      setResultText(
        status === 'completed'
          ? t('focus.result.completed', { coins: reward.coins, balance: reward.seedsBalance })
          : t('focus.result.stopped', { coins: reward.coins, balance: reward.seedsBalance })
      );
      emitTopStatusRefresh();
      setIsRunning(false);
    } catch (error) {
      Alert.alert(t('focus.error.save'), error instanceof Error ? error.message : t('common.unknownError'));
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

          <Button
            label={t('focus.start')}
            onPress={() => {
              setActivityMode(Math.random() > 0.5 ? 'sewing' : 'training');
              setIsRunning(true);
            }}
            disabled={isSaving}
          />
          {resultText ? <Text style={styles.result}>{resultText}</Text> : null}
        </Card>
      ) : (
        <FocusTimer
          totalSeconds={durationSeconds}
          activityLabel={activityLabel}
          asciiArt={asciiArt}
          title={t('focus.timer.title')}
          subtitle={t('focus.timer.subtitle')}
          stopLabel={t('focus.timer.stop')}
          devCompleteLabel={t('focus.timer.devComplete')}
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
