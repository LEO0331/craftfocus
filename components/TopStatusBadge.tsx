import { StyleSheet, Text, View } from 'react-native';

import { AsciiPet } from '@/components/AsciiPet';
import { theme } from '@/constants/theme';
import { useI18n } from '@/hooks/useI18n';
import { useTopStatus } from '@/hooks/useTopStatus';

export function TopStatusBadge() {
  const { badgeText, seedsBalance, activeAnimal } = useTopStatus();
  const { t } = useI18n();

  return (
    <View style={styles.row} accessibilityLabel={t('topStatus.a11y', { animal: activeAnimal, count: seedsBalance })}>
      <View style={styles.pill}>
        <AsciiPet art={badgeText} compact />
      </View>
      <View style={styles.pill}>
        <Text style={styles.seedText}>🌱 {t('topStatus.seeds', { count: seedsBalance })}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 10,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  seedText: {
    fontFamily: theme.typography.body,
    color: theme.colors.text,
    fontWeight: '700',
  },
});
