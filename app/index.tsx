import { Redirect } from 'expo-router';

import { AppLoading } from '@/components/AppLoading';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { player, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoading message="Opening CraftFocus..." />;
  }

  if (player) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/auth/login" />;
}
