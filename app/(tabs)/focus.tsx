import { Alert } from '@/lib/alert';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

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
  const navigation = useNavigation();
  const [duration, setDuration] = useState<(typeof FOCUS_DURATIONS)[number]>(25);
  const [startedDuration, setStartedDuration] = useState(25);
  const [activityMode, setActivityMode] = useState<'sewing' | 'training'>('sewing');
  const [isRunning, setIsRunning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [pendingFinish, setPendingFinish] = useState<{ status: 'completed' | 'given_up'; reason: 'manual' | 'left_focus' } | null>(null);
  const [animalSpecies, setAnimalSpecies] = useState<'cat' | 'dog' | 'rabbit' | 'fox'>('cat');
  const [animFrame, setAnimFrame] = useState(0);
  const isRunningRef = useRef(false);
  const isStoppingRef = useRef(false);
  const hasEndedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const startingRef = useRef(false);
  const canceledStartRef = useRef(false);

  const { startFocusSession, submitFocusSession, isSaving } = useFocusSession();

  useEffect(() => () => { canceledStartRef.current = true; }, []);

  const loadAnimalSpecies = useCallback(async () => {
    if (!user?.id) {
      setAnimalSpecies('cat');
      return;
    }
    try {
      const animal = await getActiveAnimal(user.id);
      if (animal?.sprite_key) {
        setAnimalSpecies(resolveAnimalSpecies(animal.sprite_key));
        return;
      }
      setAnimalSpecies('cat');
    } catch {
      setAnimalSpecies('cat');
    }
  }, [user?.id]);

  useEffect(() => {
    void loadAnimalSpecies();
  }, [loadAnimalSpecies]);

  useFocusEffect(
    useCallback(() => {
        void loadAnimalSpecies();
        return undefined;
      }, [loadAnimalSpecies])
  );

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const timer = setInterval(() => setAnimFrame((prev) => (prev + 1) % 3), 500);
    return () => clearInterval(timer);
  }, [isRunning]);

  const durationSeconds = useMemo(() => startedDuration * 60, [startedDuration]);
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

  const handleFinish = useCallback(async (status: 'completed' | 'given_up', reason: 'manual' | 'left_focus' = 'manual') => {
    if (hasEndedRef.current || isStoppingRef.current || !sessionIdRef.current) {
      return;
    }
    hasEndedRef.current = true;
    isStoppingRef.current = true;

    try {
      const reward = await submitFocusSession({
        sessionId: sessionIdRef.current,
        status,
      });

      const summary =
        status === 'completed'
          ? t('focus.result.completed', { coins: reward.coins, balance: reward.seedsBalance })
          : t('focus.result.stopped', { coins: reward.coins, balance: reward.seedsBalance });
      const detail = status === 'given_up' && reason === 'left_focus' ? t('focus.result.autoStoppedHint') : null;
      setResultText(detail ? `${summary}\n${detail}` : summary);
      setPendingFinish(null);
      emitTopStatusRefresh();
      setIsRunning(false);
    } catch (error) {
      hasEndedRef.current = false;
      setPendingFinish({ status, reason });
      Alert.alert(t('focus.error.save'), error instanceof Error ? error.message : t('common.unknownError'));
      setIsRunning(false);
    } finally {
      isStoppingRef.current = false;
    }
  }, [activityMode, duration, submitFocusSession, t]);

  const autoStopSession = useCallback((reason: 'left_focus') => {
    if (startingRef.current) {
      canceledStartRef.current = true;
      return;
    }
    if (!isRunningRef.current || hasEndedRef.current || isStoppingRef.current) {
      return;
    }
    void handleFinish('given_up', reason);
  }, [handleFinish]);

  useEffect(() => {
    if (!isRunning && !isStarting) {
      return;
    }

    const unsubscribeBlur = navigation.addListener('blur', () => {
      autoStopSession('left_focus');
    });

    return unsubscribeBlur;
  }, [autoStopSession, isRunning, isStarting, navigation]);

  useEffect(() => {
    if ((!isRunning && !isStarting) || Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        autoStopSession('left_focus');
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [autoStopSession, isRunning, isStarting]);

  useEffect(() => {
    if ((!isRunning && !isStarting) || Platform.OS === 'web') {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        autoStopSession('left_focus');
      }
    });

    return () => subscription.remove();
  }, [autoStopSession, isRunning, isStarting]);

  const handleStart = async () => {
    if (startingRef.current || isRunningRef.current || isSaving || pendingFinish) return;
    startingRef.current = true;
    canceledStartRef.current = false;
    setIsStarting(true);
    setStartedDuration(duration);
    setResultText(null);
    const nextMode = Math.random() > 0.5 ? 'sewing' : 'training';
    try {
      const sessionId = await startFocusSession(duration, nextMode === 'sewing' ? 'sewing' : 'crafting');
      if (canceledStartRef.current || (Platform.OS === 'web' && typeof document !== 'undefined' && document.hidden)) {
        await submitFocusSession({ sessionId, status: 'given_up' });
        return;
      }
      sessionIdRef.current = sessionId;
      hasEndedRef.current = false;
      isStoppingRef.current = false;
      setActivityMode(nextMode);
      isRunningRef.current = true;
      setIsRunning(true);
    } catch (error) {
      Alert.alert(t('focus.error.save'), error instanceof Error ? error.message : t('common.unknownError'));
    } finally {
      startingRef.current = false;
      setIsStarting(false);
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
            onPress={() => { void handleStart(); }}
            disabled={isSaving || isStarting || Boolean(pendingFinish)}
          />
          {pendingFinish ? (
            <Button label={t('focus.retrySave')} disabled={isSaving}
              onPress={() => { void handleFinish(pendingFinish.status, pendingFinish.reason); }} />
          ) : null}
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
          onCompleted={() => {
            void handleFinish('completed');
          }}
          onStop={() => {
            void handleFinish('given_up');
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
