import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppLoading } from '@/components/AppLoading';
import { Button } from '@/components/Button';
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      setLoadError(t('userRoom.invalid'));
      return;
    }
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [data, publicGalleryPlacements, publicGalleryItems] = await Promise.all([
        listPublicRoomLayout(userId),
        listPublicGalleryPlacements(userId),
        listPublicGalleryItems(userId),
      ]);
      if (requestId !== requestIdRef.current) return;
      setRoomType(data.roomType);
      setPlacements(data.placements);
      setGalleryPlacements(publicGalleryPlacements);
      setGalleryItems(publicGalleryItems);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setLoadError(error instanceof Error ? error.message : t('common.unknownError'));
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [t, userId]);

  useEffect(() => {
    void load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  if (isLoading) {
    return <AppLoading message={t('userRoom.loading')} />;
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <Card>
          <Text style={styles.errorText}>{loadError}</Text>
          <Button label={t('userRoom.retry')} onPress={() => void load()} />
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('userRoom.title')}</Text>
      <Card>
        <Text style={styles.label}>{t('userRoom.theme', { theme: roomType })}</Text>
        <IsometricRoom
          roomType={roomType}
          placements={placements}
          selectedAnchorId={null}
          onSelectAnchor={() => {}}
          readOnly
          i18n={{
            anchorEmpty: (anchorId) => t('room.anchorEmpty', { anchorId }),
            anchorFilled: (anchorId, itemId) => t('room.anchorFilled', { anchorId, itemId }),
            anchorHintEditable: t('room.anchorHintEditable'),
            anchorHintReadonly: t('room.anchorHintReadonly'),
            daylight: t('room.daylight'),
            evening: t('room.evening'),
            viewHint: t('room.viewHint'),
          }}
        />
      </Card>
      <Card>
        <Text style={styles.label}>{t('room.galleryTitle')}</Text>
        <CollectibleGalleryBoard
          placements={galleryPlacements}
          collectibles={galleryItems}
          selectedListingId={null}
          readOnly
          i18n={{
            a11yEmpty: (x, y) => t('room.galleryCellEmpty', { x, y }),
            a11yFilled: (x, y, title) => t('room.galleryCellFilled', { x, y, title }),
            a11yHintPlace: t('room.galleryCellHint'),
            a11yHintReadonly: t('room.galleryCellReadonly'),
            imageLabel: (title) => t('room.collectibleImage', { title }),
          }}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg, backgroundColor: theme.colors.background },
  errorText: { color: theme.colors.danger, fontFamily: theme.typography.body, fontWeight: '700' },
});
