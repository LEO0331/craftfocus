import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { useI18n } from '@/hooks/useI18n';

export default function NotFoundScreen() {
  const { t } = useI18n();
  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View style={styles.container}>
        <Text style={styles.title}>{t('notFound.body')}</Text>
        <Link href="/" style={styles.link}>
          {t('notFound.back')}
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    padding: 20,
    gap: 10,
  },
  title: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 20,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
