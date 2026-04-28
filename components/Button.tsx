import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, disabled, variant = 'primary', style }: ButtonProps) {
  const backgroundColor =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
        ? theme.colors.danger
        : theme.colors.card;

  const textColor = variant === 'secondary' ? theme.colors.text : '#FFF5EA';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          opacity: disabled ? 0.5 : pressed ? 0.84 : 1,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: variant === 'secondary' ? '#C8AE90' : 'transparent',
          transform: [{ translateY: pressed ? 1 : 0 }],
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    shadowColor: '#5B2A19',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
    fontFamily: theme.typography.body,
  },
});
