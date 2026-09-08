import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { useI18n } from '@/hooks/useI18n';

const STEPS = [
  { key: 'focus', icon: '⏳', labelKey: 'auth.preview.focus', accent: '#2F667D' },
  { key: 'seeds', icon: '🌱', labelKey: 'auth.preview.seeds', accent: '#3E7F57' },
  { key: 'room', icon: '▦', labelKey: 'auth.preview.room', accent: '#B14C2F' },
  { key: 'friends', icon: '♡', labelKey: 'auth.preview.friends', accent: '#8A5D9C' },
] as const;

export function LoginGamePreview() {
  const { t } = useI18n();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 5200,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const petTranslate = progress.interpolate({
    inputRange: [0, 0.3, 0.62, 1],
    outputRange: [-124, -34, 54, 124],
  });

  const seedPulse = progress.interpolate({
    inputRange: [0, 0.26, 0.36, 0.7, 1],
    outputRange: [0.72, 0.72, 1.14, 0.9, 0.72],
  });

  const roomPulse = progress.interpolate({
    inputRange: [0, 0.48, 0.62, 1],
    outputRange: [0.95, 0.95, 1.08, 1],
  });

  return (
    <View style={styles.wrap} accessibilityRole="summary" accessibilityLabel={t('auth.preview.a11y')}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{t('auth.preview.eyebrow')}</Text>
        <Text style={styles.heading}>{t('auth.preview.heading')}</Text>
        <Text style={styles.body}>{t('auth.preview.body')}</Text>
      </View>

      <View style={styles.stage}>
        <View style={styles.path} />
        <Animated.View style={[styles.pet, { transform: [{ translateX: petTranslate }] }]}>
          <Text style={styles.petText}>ฅ^•ﻌ•^ฅ</Text>
          <Text style={styles.petTool}>✂</Text>
        </Animated.View>

        <Animated.View style={[styles.seedBadge, { transform: [{ scale: seedPulse }] }]}>
          <Text style={styles.seedText}>+25 🌱</Text>
        </Animated.View>

        <Animated.View style={[styles.roomCard, { transform: [{ scale: roomPulse }] }]}>
          <View style={styles.roomWall} />
          <View style={styles.roomFloor}>
            <View style={styles.pixelDesk} />
            <View style={styles.pixelPlant} />
            <View style={styles.pixelLamp} />
          </View>
        </Animated.View>

        <View style={styles.steps}>
          {STEPS.map((step) => (
            <View key={step.key} style={styles.step}>
              <View style={[styles.stepIcon, { borderColor: step.accent }]}>
                <Text style={styles.stepIconText}>{step.icon}</Text>
              </View>
              <Text style={styles.stepLabel}>{t(step.labelKey)}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  copy: {
    gap: 6,
  },
  eyebrow: {
    color: theme.colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontFamily: theme.typography.body,
  },
  heading: {
    color: theme.colors.text,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    fontFamily: theme.typography.display,
  },
  body: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: theme.typography.body,
  },
  stage: {
    minHeight: 230,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: '#FFF4DF',
    overflow: 'hidden',
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  path: {
    position: 'absolute',
    top: 72,
    left: 42,
    right: 42,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#DFC9AF',
  },
  pet: {
    alignSelf: 'center',
    minWidth: 108,
    borderWidth: 1,
    borderColor: '#C8AE90',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF9EE',
    shadowColor: '#4F2A1D',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 12,
    elevation: 3,
  },
  petText: {
    color: theme.colors.text,
    fontFamily: 'Courier New, monospace',
    fontWeight: '900',
    textAlign: 'center',
  },
  petTool: {
    color: theme.colors.primary,
    fontSize: 18,
    textAlign: 'center',
    marginTop: -2,
  },
  seedBadge: {
    position: 'absolute',
    top: 48,
    right: 22,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#E7F2D8',
    borderWidth: 1,
    borderColor: '#9FBD7E',
  },
  seedText: {
    color: '#326A48',
    fontSize: 15,
    fontWeight: '900',
    fontFamily: theme.typography.body,
  },
  roomCard: {
    alignSelf: 'center',
    width: 188,
    height: 92,
    marginTop: 40,
  },
  roomWall: {
    height: 34,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#8BC7D7',
  },
  roomFloor: {
    flex: 1,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: '#D8EFE8',
    borderWidth: 2,
    borderColor: '#6EB7C6',
  },
  pixelDesk: {
    position: 'absolute',
    left: 30,
    bottom: 16,
    width: 46,
    height: 22,
    backgroundColor: '#C88A45',
    borderBottomWidth: 5,
    borderBottomColor: '#8A5A2F',
  },
  pixelPlant: {
    position: 'absolute',
    right: 42,
    bottom: 16,
    width: 20,
    height: 34,
    borderBottomWidth: 12,
    borderBottomColor: '#B14C2F',
    borderLeftWidth: 7,
    borderLeftColor: 'transparent',
    borderRightWidth: 7,
    borderRightColor: 'transparent',
    backgroundColor: '#79B66A',
  },
  pixelLamp: {
    position: 'absolute',
    right: 78,
    bottom: 18,
    width: 10,
    height: 36,
    backgroundColor: '#2F667D',
    borderTopWidth: 12,
    borderTopColor: '#F2C14E',
  },
  steps: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF9EE',
  },
  stepIconText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  stepLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: theme.typography.body,
  },
});
