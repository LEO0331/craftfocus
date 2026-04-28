import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { RoomGrid } from '@/components/RoomGrid';
import { resolveSpriteId } from '@/constants/spriteUtils';
import { theme } from '@/constants/theme';
import { listPublicRoomLayout, type RoomLayoutItem } from '@/lib/rooms';

export default function UserRoomScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const userId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);

  const [items, setItems] = useState<RoomLayoutItem[]>([]);

  const load = useCallback(async () => {
    if (!userId) {
      return;
    }
    const data = await listPublicRoomLayout(userId);
    setItems(data);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Friend Room</Text>
      <Card>
        <Text style={styles.label}>User ID: {userId}</Text>
        <RoomGrid
          items={items.map((item) => ({
            id: item.id,
            x: item.x,
            y: item.y,
            spriteId: resolveSpriteId(item.item_id),
          }))}
        />
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
