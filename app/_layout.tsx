import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { theme } from '@/constants/theme';
import { AuthProvider, RequireAuth } from '@/hooks/useAuth';
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

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <View style={styles.container}>
        {!isSupabaseConfigured ? (
          <View style={styles.banner} accessibilityRole="alert">
            <Text style={styles.bannerText}>
              Configuration error: missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.
            </Text>
          </View>
        ) : null}
        <View style={styles.content}>
          <RequireAuth>
            <Stack screenOptions={{ headerTitleAlign: 'center' }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ title: 'Log In' }} />
              <Stack.Screen name="auth/signup" options={{ title: 'Sign Up' }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="crafts/new" options={{ title: 'New Craft Post' }} />
              <Stack.Screen name="crafts/[id]" options={{ title: 'Craft Detail' }} />
              <Stack.Screen name="users/[id]/room" options={{ title: 'Friend Room' }} />
              <Stack.Screen name="exchanges" options={{ title: 'Exchange Requests' }} />
            </Stack>
          </RequireAuth>
        </View>
      </View>
    </AuthProvider>
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
