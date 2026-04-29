import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FRIEND_FILTER_OPTIONS, type FriendFilter } from '@/constants/filterOptions';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import {
  type FriendSearchResult,
  listFriendships,
  respondToFriendRequest,
  searchProfilesByUsername,
  sendFriendRequest,
  type FriendListItem,
} from '@/lib/friends';
import { validateSearchQuery } from '@/lib/validation';

export default function FriendsScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [friendships, setFriendships] = useState<FriendListItem[]>([]);
  const [filter, setFilter] = useState<FriendFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [addingIds, setAddingIds] = useState<Record<string, boolean>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const loadFriendships = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    const data = await listFriendships(user.id);
    setFriendships(data);
  }, [user?.id]);

  useEffect(() => {
    loadFriendships();
  }, [loadFriendships]);

  const incomingPending = useMemo(
    () => friendships.filter((entry) => entry.status === 'pending' && entry.role === 'addressee').length,
    [friendships]
  );

  const sentPending = useMemo(
    () => friendships.filter((entry) => entry.status === 'pending' && entry.role === 'requester').length,
    [friendships]
  );

  const filteredFriendships = useMemo(() => {
    if (filter === 'all') {
      return friendships;
    }
    return friendships.filter((entry) => entry.status === filter);
  }, [filter, friendships]);

  const connectedProfileIds = useMemo(() => {
    const next: Record<string, boolean> = {};
    friendships.forEach((entry) => {
      next[entry.profile_id] = true;
    });
    return next;
  }, [friendships]);

  const handleSearch = async () => {
    if (!user?.id) {
      return;
    }
    setIsLoading(true);
    try {
      const data = await searchProfilesByUsername(validateSearchQuery(query), user.id);
      setSearchResults(data);
    } catch (error) {
      Alert.alert(t('friends.searchUsers'), error instanceof Error ? error.message : t('common.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (profileId: string) => {
    if (!user?.id) {
      return;
    }
    setAddingIds((prev) => ({ ...prev, [profileId]: true }));
    try {
      await sendFriendRequest(user.id, profileId);
      setAddedIds((prev) => ({ ...prev, [profileId]: true }));
      await loadFriendships();
    } catch (error) {
      Alert.alert(t('friends.add'), error instanceof Error ? error.message : t('common.unknownError'));
    } finally {
      setAddingIds((prev) => ({ ...prev, [profileId]: false }));
    }
  };

  const handleRespond = async (friendshipId: string, next: 'accepted' | 'rejected') => {
    if (!user?.id) {
      return;
    }
    try {
      await respondToFriendRequest(friendshipId, next, user.id);
      await loadFriendships();
    } catch (error) {
      Alert.alert(t('friends.title'), error instanceof Error ? error.message : t('common.unknownError'));
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('friends.title')}</Text>

      <Card>
        <Text style={styles.title}>{t('friends.notifications')}</Text>
        <Text style={styles.text}>{t('friends.incomingPending', { count: incomingPending })}</Text>
        <Text style={styles.text}>{t('friends.sentPending', { count: sentPending })}</Text>
        <Button label={t('friends.openExchanges')} onPress={() => router.push('/exchanges')} variant="secondary" />
      </Card>

      <Card>
        <Text style={styles.title}>{t('friends.searchUsers')}</Text>
        <TextInput
          placeholder={t('friends.searchByUsername')}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          style={styles.input}
          accessibilityLabel={t('friends.searchByUsername')}
        />
        <Button label={isLoading ? t('common.searching') : t('friends.search')} onPress={handleSearch} disabled={isLoading} />

        {searchResults.map((profile) => (
          <View key={profile.id} style={styles.row}>
            <View>
              <Text style={styles.text}>{profile.display_name || profile.username}</Text>
              <Text style={styles.meta}>@{profile.username}</Text>
            </View>
            <Button
              label={connectedProfileIds[profile.id] || addedIds[profile.id] ? t('friends.added') : t('friends.add')}
              onPress={() => handleAddFriend(profile.id)}
              disabled={Boolean(connectedProfileIds[profile.id] || addedIds[profile.id] || addingIds[profile.id])}
            />
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.title}>{t('friends.myFriendships')}</Text>

        <View style={styles.filterRow}>
          {FRIEND_FILTER_OPTIONS.map((option) => {
            const active = option.value === filter;
            return (
              <Pressable
                key={option.value}
                onPress={() => setFilter(option.value)}
                accessibilityRole="button"
                accessibilityLabel={t('friends.filterByStatus', { status: t(option.labelKey) })}
                accessibilityState={{ selected: active }}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
              >
                <Text style={[styles.filterLabel, active ? styles.filterLabelActive : null]}>{t(option.labelKey)}</Text>
              </Pressable>
            );
          })}
        </View>

        {!filteredFriendships.length ? <Text style={styles.text}>{t('friends.noFilterItems')}</Text> : null}

        {filteredFriendships.map((entry) => (
          <View key={entry.friendship_id} style={styles.friendCard}>
            <Text style={styles.friendName}>{entry.display_name || entry.username}</Text>
            {entry.display_name ? <Text style={styles.meta}>@{entry.username}</Text> : null}
            <Text style={styles.text}>{t('friends.status', { status: entry.status })}</Text>

            {entry.status === 'accepted' ? (
              <Button label={t('friends.visitRoom')} onPress={() => router.push(`/users/${entry.profile_id}/room`)} variant="secondary" />
            ) : null}

            {entry.status === 'pending' && entry.role === 'addressee' ? (
              <View style={styles.actions}>
                <Button label={t('friends.accept')} onPress={() => handleRespond(entry.friendship_id, 'accepted')} />
                <Button label={t('friends.reject')} onPress={() => handleRespond(entry.friendship_id, 'rejected')} variant="danger" />
              </View>
            ) : null}
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  heading: { fontSize: 30, fontWeight: '800', color: theme.colors.text, fontFamily: theme.typography.display },
  title: { fontSize: 16, fontWeight: '700', color: theme.colors.text, fontFamily: theme.typography.body },
  text: { color: theme.colors.muted, fontFamily: theme.typography.body },
  meta: { color: theme.colors.muted, fontSize: 12, fontFamily: theme.typography.body },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#ECE6D8',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  filterLabel: {
    color: theme.colors.text,
    textTransform: 'capitalize',
    fontWeight: '600',
    fontFamily: theme.typography.body,
  },
  filterLabelActive: {
    color: '#fff',
  },
  friendCard: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    gap: 8,
  },
  friendName: {
    color: theme.colors.text,
    fontWeight: '700',
    fontFamily: theme.typography.body,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
});
