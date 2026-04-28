import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { listCraftPosts } from '@/lib/crafts';
import { listMyRoomLayout } from '@/lib/rooms';
import { supabase } from '@/lib/supabase';
import type { TableRow } from '@/types/database';

type FocusSessionRow = TableRow<'focus_sessions'>;

export default function HomeScreen() {
  const { user } = useAuth();
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [roomItemCount, setRoomItemCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setIsLoading(true);

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [{ data: sessions }, roomLayout, posts] = await Promise.all([
        supabase
          .from('focus_sessions')
          .select('duration_minutes,status')
          .eq('user_id', user.id)
          .gte('created_at', startOfDay.toISOString()),
        listMyRoomLayout(user.id),
        listCraftPosts(user.id),
      ]);

      const completedMinutes = (sessions ?? []).reduce(
        (sum: number, row: Pick<FocusSessionRow, 'status' | 'duration_minutes'>) => {
          if (row.status !== 'completed') {
            return sum;
          }
          return sum + Number(row.duration_minutes ?? 0);
        },
        0
      );

      setTodayMinutes(completedMinutes);
      setRoomItemCount(roomLayout.length);
      setRecentActivity(posts.slice(0, 3).map((post) => `${post.author_name} posted "${post.title}" in ${post.category}`));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadDashboard} />}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>CraftFocus Atelier</Text>
        <Text style={styles.heading}>Build A Room By Protecting Your Time</Text>
        <Text style={styles.hint}>Every focused minute becomes material. Every session leaves a visual trace.</Text>
      </View>

      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.bigValue}>{todayMinutes} min</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.title}>Room Items</Text>
          <Text style={styles.bigValue}>{roomItemCount}</Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.title}>Quick Actions</Text>
        <Button label="Start Focus Session" onPress={() => router.push('/(tabs)/focus')} />
        <Button label="Upload Craft Work" onPress={() => router.push('/crafts/new')} variant="secondary" />
      </Card>

      <Card>
        <Text style={styles.title}>Recent Friend Activity</Text>
        {!recentActivity.length ? <Text style={styles.hint}>No recent activity yet.</Text> : null}
        {recentActivity.map((line) => (
          <Text key={line} style={styles.hint}>
            • {line}
          </Text>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    maxWidth: 980,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    backgroundColor: '#F7F0E2',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: 6,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontSize: 12,
    color: theme.colors.accent,
    fontWeight: '800',
    fontFamily: theme.typography.body,
  },
  heading: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.display,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: 220,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.body,
  },
  bigValue: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.display,
  },
  hint: {
    color: theme.colors.muted,
    fontFamily: theme.typography.body,
  },
});
