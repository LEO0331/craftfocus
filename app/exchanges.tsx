import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EXCHANGE_FILTER_OPTIONS, type ExchangeFilter } from '@/constants/filterOptions';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { listMyExchangeRequests, updateExchangeStatus, type ExchangeListItem } from '@/lib/exchanges';

export default function ExchangesScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
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
      Alert.alert(t('ex.title'), error instanceof Error ? error.message : t('common.unknownError'));
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('ex.title')}</Text>

      <Card>
        <Text style={styles.subheading}>{t('ex.notifications')}</Text>
        <Text style={styles.text}>{t('friends.incomingPending', { count: incomingPendingCount })}</Text>
        <Text style={styles.text}>{t('friends.sentPending', { count: outgoingPendingCount })}</Text>
      </Card>

      <Card>
        <Text style={styles.subheading}>{t('ex.incoming')}</Text>
        <FilterRow value={incomingFilter} onChange={setIncomingFilter} />

        {!incomingVisible.length ? <Text style={styles.text}>{t('ex.noIncoming')}</Text> : null}
        {incomingVisible.map((item) => (
          <View key={item.id} style={styles.requestCard}>
            <Text style={styles.title}>{item.craft_title}</Text>
            <Text style={styles.text}>{t('ex.from', { name: item.requester_name })}</Text>
            {item.message ? <Text style={styles.text}>{t('ex.message', { text: item.message })}</Text> : null}
            <Text style={styles.text}>{t('ex.status', { status: item.status })}</Text>

            {item.status === 'pending' ? (
              <View style={styles.actions}>
                <Button label={t('ex.accept')} onPress={() => handleUpdate(item.id, 'accepted')} />
                <Button label={t('ex.reject')} onPress={() => handleUpdate(item.id, 'rejected')} variant="danger" />
              </View>
            ) : null}
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.subheading}>{t('ex.outgoing')}</Text>
        <FilterRow value={outgoingFilter} onChange={setOutgoingFilter} />

        {!outgoingVisible.length ? <Text style={styles.text}>{t('ex.noOutgoing')}</Text> : null}
        {outgoingVisible.map((item) => (
          <View key={item.id} style={styles.requestCard}>
            <Text style={styles.title}>{item.craft_title}</Text>
            <Text style={styles.text}>{t('ex.to', { name: item.owner_name })}</Text>
            {item.message ? <Text style={styles.text}>{t('ex.message', { text: item.message })}</Text> : null}
            <Text style={styles.text}>{t('ex.status', { status: item.status })}</Text>

            {item.status === 'pending' ? (
              <Button label={t('ex.cancel')} onPress={() => handleUpdate(item.id, 'cancelled')} variant="secondary" />
            ) : null}
          </View>
        ))}
      </Card>

      {isLoading ? <Text style={styles.text}>{t('ex.refreshing')}</Text> : null}
    </ScrollView>
  );
}

function FilterRow({ value, onChange }: { value: ExchangeFilter; onChange: (next: ExchangeFilter) => void }) {
  const { t } = useI18n();

  return (
    <View style={styles.filterRow}>
      {EXCHANGE_FILTER_OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityLabel={t('ex.filterByStatus', { status: t(option.labelKey) })}
            accessibilityState={{ selected: active }}
            style={[styles.filterChip, active ? styles.filterChipActive : null]}
          >
            <Text style={[styles.filterLabel, active ? styles.filterLabelActive : null]}>{t(option.labelKey)}</Text>
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
