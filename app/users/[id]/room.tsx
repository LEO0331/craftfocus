import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { CollectibleGalleryBoard } from '@/components/CollectibleGalleryBoard';
import { IsometricRoom } from '@/components/IsometricRoom';
import { theme } from '@/constants/theme';
import { useI18n } from '@/hooks/useI18n';
import { listPublicGalleryItems, listPublicGalleryPlacements } from '@/lib/gallery';
import { listPublicRoomLayout, type RoomPlacement } from '@/lib/rooms';
import type { CustomGalleryPlacement, GalleryItem, RoomType } from '@/types/models';

export default function UserRoomScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const { t } = useI18n();
  const userId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);
  const [roomType, setRoomType] = useState<RoomType>('bedroom');
  const [placements, setPlacements] = useState<RoomPlacement[]>([]);
  const [galleryPlacements, setGalleryPlacements] = useState<CustomGalleryPlacement[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  const load = useCallback(async () => {
    if (!userId) {
      return;
    }
    const data = await listPublicRoomLayout(userId);
    const [publicGalleryPlacements, publicGalleryItems] = await Promise.all([
      listPublicGalleryPlacements(userId),
      listPublicGalleryItems(userId),
    ]);
    setRoomType(data.roomType);
    setPlacements(data.placements);
    setGalleryPlacements(publicGalleryPlacements);
    setGalleryItems(publicGalleryItems);
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
      <Card>
        <Text style={styles.label}>{t('room.galleryTitle')}</Text>
        <CollectibleGalleryBoard
          placements={galleryPlacements}
          collectibles={galleryItems}
          selectedListingId={null}
          readOnly
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
