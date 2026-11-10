import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { theme } from '@/constants/theme';
import { useI18n } from '@/hooks/useI18n';

export function OnlineModeNotice() {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <Card>
        <Text>{t('local.onlineOnly')}</Text>
        <Button label={t('notFound.back')} onPress={() => router.replace('/(tabs)/home')} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
});
