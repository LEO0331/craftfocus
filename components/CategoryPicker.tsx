import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { theme } from '@/constants/theme';

interface CategoryPickerProps<T extends string> {
  label: string;
  options: T[];
  selected: T;
  onSelect: (next: T) => void;
  renderLabel?: (option: T) => string;
}

export function CategoryPicker<T extends string>({
  label,
  options,
  selected,
  onSelect,
  renderLabel,
}: CategoryPickerProps<T>) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((option) => {
          const active = option === selected;
          const labelText = renderLabel ? renderLabel(option) : option;
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${labelText}`}
              accessibilityState={{ selected: active }}
              style={[styles.chip, active ? styles.chipActive : null]}
            >
              <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>
                {labelText}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  row: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ECE6D8',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  chipLabel: {
    color: theme.colors.text,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chipLabelActive: {
    color: '#fff',
  },
});
