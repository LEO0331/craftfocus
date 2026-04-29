import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FRIEND_FILTER_OPTIONS, type FriendFilter } from '@/constants/filterOptions';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
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
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [friendships, setFriendships] = useState<FriendListItem[]>([]);
  const [filter, setFilter] = useState<FriendFilter>('all');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSearch = async () => {
    if (!user?.id) {
      return;
    }
    setIsLoading(true);
    try {
      const data = await searchProfilesByUsername(validateSearchQuery(query), user.id);
      setSearchResults(data);
    } catch (error) {
      Alert.alert('Search failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (profileId: string) => {
    if (!user?.id) {
      return;
    }
    try {
      await sendFriendRequest(user.id, profileId);
      Alert.alert('Done', 'Friend request sent.');
      await loadFriendships();
    } catch (error) {
      Alert.alert('Add friend failed', error instanceof Error ? error.message : 'Unknown error');
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
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Friends</Text>

      <Card>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.text}>Incoming pending: {incomingPending}</Text>
        <Text style={styles.text}>Sent pending: {sentPending}</Text>
        <Button label="Open Exchanges" onPress={() => router.push('/exchanges')} variant="secondary" />
      </Card>

      <Card>
        <Text style={styles.title}>Search Users</Text>
        <TextInput
          placeholder="Search by username"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          style={styles.input}
        />
        <Button label={isLoading ? 'Searching...' : 'Search'} onPress={handleSearch} disabled={isLoading} />

        {searchResults.map((profile) => (
          <View key={profile.id} style={styles.row}>
            <View>
              <Text style={styles.text}>@{profile.username}</Text>
              {profile.display_name ? <Text style={styles.meta}>Display: {profile.display_name}</Text> : null}
            </View>
            <Button label="Add" onPress={() => handleAddFriend(profile.id)} />
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.title}>My Friendships</Text>

        <View style={styles.filterRow}>
          {FRIEND_FILTER_OPTIONS.map((option) => {
            const active = option === filter;
            return (
              <Pressable
                key={option}
                onPress={() => setFilter(option)}
                accessibilityRole="button"
                accessibilityLabel={`Filter friendships by ${option}`}
                accessibilityState={{ selected: active }}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
              >
                <Text style={[styles.filterLabel, active ? styles.filterLabelActive : null]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        {!filteredFriendships.length ? <Text style={styles.text}>No friendships for this filter.</Text> : null}

        {filteredFriendships.map((entry) => (
          <View key={entry.friendship_id} style={styles.friendCard}>
            <Text style={styles.friendName}>{entry.display_name || entry.username}</Text>
            <Text style={styles.text}>status: {entry.status}</Text>

            {entry.status === 'accepted' ? (
              <Button label="Visit Room" onPress={() => router.push(`/users/${entry.profile_id}/room`)} variant="secondary" />
            ) : null}

            {entry.status === 'pending' && entry.role === 'addressee' ? (
              <View style={styles.actions}>
                <Button label="Accept" onPress={() => handleRespond(entry.friendship_id, 'accepted')} />
                <Button label="Reject" onPress={() => handleRespond(entry.friendship_id, 'rejected')} variant="danger" />
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
