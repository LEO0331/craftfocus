import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { theme } from '@/constants/theme';

function TabBarIcon(props: { name: ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={20} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.text,
        tabBarStyle: { backgroundColor: theme.colors.card },
        tabBarActiveTintColor: theme.colors.primary,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} /> }}
      />
      <Tabs.Screen
        name="focus"
        options={{ title: 'Focus', tabBarIcon: ({ color }) => <TabBarIcon name="clock-o" color={color} /> }}
      />
      <Tabs.Screen
        name="room"
        options={{ title: 'Room', tabBarIcon: ({ color }) => <TabBarIcon name="th-large" color={color} /> }}
      />
      <Tabs.Screen
        name="crafts"
        options={{ title: 'Crafts', tabBarIcon: ({ color }) => <TabBarIcon name="camera" color={color} /> }}
      />
      <Tabs.Screen
        name="friends"
        options={{ title: 'Friends', tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} /> }}
      />
    </Tabs>
  );
}
