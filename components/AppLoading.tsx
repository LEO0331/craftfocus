import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

export function AppLoading({ message = 'Preparing your focus room...' }: { message?: string }) {
  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel={message}>
      <View style={styles.card}>
        <Text style={styles.mark}>CF</Text>
        <Text style={styles.title}>CraftFocus</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.barTrack}>
          <View style={styles.barFill} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    width: 54,
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.primary,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 54,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '900',
    fontFamily: theme.typography.display,
  },
  message: {
    color: theme.colors.muted,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: theme.typography.body,
  },
  barTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E8D8C5',
    overflow: 'hidden',
  },
  barFill: {
    width: '58%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
  },
});
