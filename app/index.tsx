import { Redirect } from 'expo-router';

import { AppLoading } from '@/components/AppLoading';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoading message="Opening CraftFocus..." />;
  }

  if (session) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/auth/login" />;
}
