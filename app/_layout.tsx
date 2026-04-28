import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, RequireAuth } from '@/hooks/useAuth';

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
    </AuthProvider>
  );
}
