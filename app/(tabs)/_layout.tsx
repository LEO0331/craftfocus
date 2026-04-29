import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { TopStatusBadge } from '@/components/TopStatusBadge';
import { theme } from '@/constants/theme';
import { useI18n } from '@/hooks/useI18n';

function TabBarIcon(props: { name: ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={20} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.text,
        tabBarStyle: { backgroundColor: theme.colors.card },
        tabBarActiveTintColor: theme.colors.primary,
        headerRight: () => <TopStatusBadge />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t('tabs.home'), tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} /> }}
      />
      <Tabs.Screen
        name="focus"
        options={{ title: t('tabs.focus'), tabBarIcon: ({ color }) => <TabBarIcon name="clock-o" color={color} /> }}
      />
      <Tabs.Screen
        name="room"
        options={{ title: t('tabs.room'), tabBarIcon: ({ color }) => <TabBarIcon name="th-large" color={color} /> }}
      />
      <Tabs.Screen
        name="crafts"
        options={{ title: t('tabs.crafts'), tabBarIcon: ({ color }) => <TabBarIcon name="camera" color={color} /> }}
      />
      <Tabs.Screen
        name="friends"
        options={{ title: t('tabs.friends'), tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} /> }}
      />
    </Tabs>
  );
}
