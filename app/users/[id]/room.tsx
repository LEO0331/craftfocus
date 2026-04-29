import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { IsometricRoom } from '@/components/IsometricRoom';
import { theme } from '@/constants/theme';
import { useI18n } from '@/hooks/useI18n';
import { listPublicRoomLayout, type RoomPlacement } from '@/lib/rooms';
import type { RoomType } from '@/types/models';

export default function UserRoomScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const { t } = useI18n();
  const userId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);
  const [roomType, setRoomType] = useState<RoomType>('bedroom');
  const [placements, setPlacements] = useState<RoomPlacement[]>([]);

  const load = useCallback(async () => {
    if (!userId) {
      return;
    }
    const data = await listPublicRoomLayout(userId);
    setRoomType(data.roomType);
    setPlacements(data.placements);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('userRoom.title')}</Text>
      <Card>
        <Text style={styles.label}>{t('userRoom.theme', { theme: roomType })}</Text>
        <IsometricRoom roomType={roomType} placements={placements} selectedAnchorId={null} onSelectAnchor={() => {}} />
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
  label: { color: theme.colors.muted, fontFamily: theme.typography.body },
});
