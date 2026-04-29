import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { theme } from '@/constants/theme';
import { AuthProvider, RequireAuth } from '@/hooks/useAuth';
import { I18nProvider, useI18n } from '@/hooks/useI18n';
import { isSupabaseConfigured } from '@/lib/supabase';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (typeof document !== 'undefined' && !document.title) {
      document.title = 'CraftFocus';
    }
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <I18nProvider>
      <AuthProvider>
        <RootNav />
      </AuthProvider>
    </I18nProvider>
  );
}

function RootNav() {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      {!isSupabaseConfigured ? (
        <View style={styles.banner} accessibilityRole="alert">
          <Text style={styles.bannerText}>{t('root.configError')}</Text>
        </View>
      ) : null}
      <View style={styles.content} accessibilityLabel="Main application content">
        <RequireAuth>
          <Stack screenOptions={{ headerTitleAlign: 'center' }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ title: t('stack.login') }} />
            <Stack.Screen name="auth/signup" options={{ title: t('stack.signup') }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="crafts/new" options={{ title: t('stack.newCraft') }} />
            <Stack.Screen name="crafts/[id]" options={{ title: t('stack.craftDetail') }} />
            <Stack.Screen name="users/[id]/room" options={{ title: t('stack.friendRoom') }} />
            <Stack.Screen name="exchanges" options={{ title: t('stack.exchanges') }} />
          </Stack>
        </RequireAuth>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  banner: {
    backgroundColor: '#FFF4E5',
    borderBottomWidth: 1,
    borderBottomColor: '#F6C26B',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bannerText: {
    color: '#7A4A00',
    fontSize: 13,
    fontWeight: '700',
  },
});
