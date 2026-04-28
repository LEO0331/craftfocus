import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EXCHANGE_FILTER_OPTIONS, type ExchangeFilter } from '@/constants/filterOptions';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { listMyExchangeRequests, updateExchangeStatus, type ExchangeListItem } from '@/lib/exchanges';

export default function ExchangesScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ExchangeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [incomingFilter, setIncomingFilter] = useState<ExchangeFilter>('all');
  const [outgoingFilter, setOutgoingFilter] = useState<ExchangeFilter>('all');

  const loadRequests = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await listMyExchangeRequests(user.id);
      setRequests(data);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const incoming = useMemo(() => requests.filter((item) => item.owner_id === user?.id), [requests, user?.id]);
  const outgoing = useMemo(() => requests.filter((item) => item.requester_id === user?.id), [requests, user?.id]);

  const incomingPendingCount = incoming.filter((item) => item.status === 'pending').length;
  const outgoingPendingCount = outgoing.filter((item) => item.status === 'pending').length;

  const incomingVisible = useMemo(
    () => (incomingFilter === 'all' ? incoming : incoming.filter((item) => item.status === incomingFilter)),
    [incoming, incomingFilter]
  );

  const outgoingVisible = useMemo(
    () => (outgoingFilter === 'all' ? outgoing : outgoing.filter((item) => item.status === outgoingFilter)),
    [outgoing, outgoingFilter]
  );

  const handleUpdate = async (id: string, next: 'accepted' | 'rejected' | 'cancelled') => {
    if (!user?.id) {
      return;
    }
    try {
      await updateExchangeStatus(id, next, user.id);
      await loadRequests();
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Exchange Requests</Text>

      <Card>
        <Text style={styles.subheading}>Notifications</Text>
        <Text style={styles.text}>Incoming pending: {incomingPendingCount}</Text>
        <Text style={styles.text}>Outgoing pending: {outgoingPendingCount}</Text>
      </Card>

      <Card>
        <Text style={styles.subheading}>Incoming</Text>
        <FilterRow value={incomingFilter} onChange={setIncomingFilter} />

        {!incomingVisible.length ? <Text style={styles.text}>No incoming requests for this filter.</Text> : null}
        {incomingVisible.map((item) => (
          <View key={item.id} style={styles.requestCard}>
            <Text style={styles.title}>{item.craft_title}</Text>
            <Text style={styles.text}>from: {item.requester_name}</Text>
            {item.message ? <Text style={styles.text}>message: {item.message}</Text> : null}
            <Text style={styles.text}>status: {item.status}</Text>

            {item.status === 'pending' ? (
              <View style={styles.actions}>
                <Button label="Accept" onPress={() => handleUpdate(item.id, 'accepted')} />
                <Button label="Reject" onPress={() => handleUpdate(item.id, 'rejected')} variant="danger" />
              </View>
            ) : null}
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.subheading}>Outgoing</Text>
        <FilterRow value={outgoingFilter} onChange={setOutgoingFilter} />

        {!outgoingVisible.length ? <Text style={styles.text}>No outgoing requests for this filter.</Text> : null}
        {outgoingVisible.map((item) => (
          <View key={item.id} style={styles.requestCard}>
            <Text style={styles.title}>{item.craft_title}</Text>
            <Text style={styles.text}>to: {item.owner_name}</Text>
            {item.message ? <Text style={styles.text}>message: {item.message}</Text> : null}
            <Text style={styles.text}>status: {item.status}</Text>

            {item.status === 'pending' ? (
              <Button label="Cancel" onPress={() => handleUpdate(item.id, 'cancelled')} variant="secondary" />
            ) : null}
          </View>
        ))}
      </Card>

      {isLoading ? <Text style={styles.text}>Refreshing…</Text> : null}
    </ScrollView>
  );
}

function FilterRow({ value, onChange }: { value: ExchangeFilter; onChange: (next: ExchangeFilter) => void }) {
  return (
    <View style={styles.filterRow}>
      {EXCHANGE_FILTER_OPTIONS.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.filterChip, active ? styles.filterChipActive : null]}
          >
            <Text style={[styles.filterLabel, active ? styles.filterLabelActive : null]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
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
  subheading: { fontSize: 16, fontWeight: '700', color: theme.colors.text, fontFamily: theme.typography.body },
  title: { fontSize: 15, fontWeight: '700', color: theme.colors.text, fontFamily: theme.typography.body },
  text: { color: theme.colors.muted, fontFamily: theme.typography.body },
  requestCard: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    gap: 4,
  },
  actions: {
    flexDirection: 'row',
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
});
