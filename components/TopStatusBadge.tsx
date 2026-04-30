import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AsciiPet } from '@/components/AsciiPet';
import { theme } from '@/constants/theme';
import { useI18n } from '@/hooks/useI18n';
import { useTopStatus } from '@/hooks/useTopStatus';

export function TopStatusBadge() {
  const { badgeText, seedsBalance, activeAnimal } = useTopStatus();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const compact = width < 560;
  const ultraCompact = width < 430;
  const merged = compact;

  return (
    <View style={styles.row} accessibilityLabel={t('topStatus.a11y', { animal: activeAnimal, count: seedsBalance })}>
      {merged ? (
        <View style={[styles.pill, compact ? styles.pillCompact : null, ultraCompact ? styles.pillUltraCompact : null]}>
          <Text style={[styles.seedText, compact ? styles.seedTextCompact : null]}>
            {ultraCompact ? '' : `${badgeText} `}
            🌱 {t('topStatus.seeds', { count: seedsBalance })}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.pill}>
            <AsciiPet art={badgeText} compact />
          </View>
          <View style={styles.pill}>
            <Text style={styles.seedText}>🌱 {t('topStatus.seeds', { count: seedsBalance })}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 14,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  pillCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillUltraCompact: {
    paddingHorizontal: 7,
  },
  seedText: {
    fontFamily: theme.typography.body,
    color: theme.colors.text,
    fontWeight: '700',
  },
  seedTextCompact: {
    fontSize: 12,
  },
});
