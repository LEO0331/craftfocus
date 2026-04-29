import { StyleSheet, Text } from 'react-native';

interface AsciiPetProps {
  art: string;
  compact?: boolean;
}

export function AsciiPet({ art, compact = false }: AsciiPetProps) {
  return (
    <Text
      style={[styles.base, compact ? styles.compact : null]}
      accessibilityLabel="ASCII animal companion"
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

