import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

export function Avatar({ uri, label, size = 42 }: { uri?: string | null; label?: string; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.letter}>{(label?.trim()?.[0] ?? '?').toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#DED8CA',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7DFC9',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  letter: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});
