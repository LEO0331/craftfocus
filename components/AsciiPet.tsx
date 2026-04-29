import { StyleSheet, Text } from 'react-native';

interface AsciiPetProps {
  art: string;
  compact?: boolean;
  accessibilityLabel?: string;
}

export function AsciiPet({ art, compact = false, accessibilityLabel }: AsciiPetProps) {
  return (
    <Text
      style={[styles.base, compact ? styles.compact : null]}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    >
      {art}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'SpaceMono',
    color: '#2A1E17',
    lineHeight: 16,
    includeFontPadding: false,
  },
  compact: {
    fontSize: 10,
    lineHeight: 12,
  },
});
