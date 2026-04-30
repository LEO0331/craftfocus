import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CollectibleGalleryBoard } from '@/components/CollectibleGalleryBoard';
import { IsometricRoom } from '@/components/IsometricRoom';
import { PixelGridSprite } from '@/components/PixelGridSprite';
import { PixelSprite } from '@/components/PixelSprite';
import { ROOM_SPRITES } from '@/constants/roomSprites';
import { resolveSpriteId } from '@/constants/spriteUtils';
import { theme } from '@/constants/theme';
import { useRoom } from '@/hooks/useRoom';
import { useI18n } from '@/hooks/useI18n';
import type { BuildTargetId, RoomType } from '@/types/models';

const ROOM_TYPES: RoomType[] = ['bedroom', 'gym'];
const GALLERY_CELL_SIZE_WEB = 60;
const GALLERY_CELL_SIZE_MOBILE = 54;
const SPLIT_LAYOUT_MIN_WIDTH = 1180;

export default function RoomScreen() {
  const {
    roomType,
    placements,
    inventory,
    inventoryByItem,
    collectibles,
    galleryPlacements,
    placeAtAnchor,
    removePlacementAtAnchor,
    switchRoomType,
    placeCollectibleAtCell,
    removeCollectibleFromGallery,
  } = useRoom();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const splitRoomGallery = Platform.OS === 'web' && width >= SPLIT_LAYOUT_MIN_WIDTH;
  const galleryCellSize = Platform.OS === 'web' ? (splitRoomGallery ? GALLERY_CELL_SIZE_WEB : 54) : GALLERY_CELL_SIZE_MOBILE;
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<BuildTargetId>('plant');
  const [selectedCollectibleId, setSelectedCollectibleId] = useState<string | null>(null);
  const [collectibleSearch, setCollectibleSearch] = useState('');
  const [collectiblePage, setCollectiblePage] = useState(1);
  const COLLECTIBLE_PAGE_SIZE = 6;

  const selectedPlacement = useMemo(
    () => (selectedAnchorId ? placements.find((entry) => entry.anchor_id === selectedAnchorId) ?? null : null),
    [placements, selectedAnchorId]
  );

  const quantity = inventoryByItem.get(selectedItemId) ?? 0;
  const placedCollectibleIds = useMemo(
    () => new Set(galleryPlacements.map((entry) => entry.listingId)),
    [galleryPlacements]
  );
  const selectedCollectiblePlacement = useMemo(
    () => galleryPlacements.find((entry) => entry.listingId === selectedCollectibleId) ?? null,
    [galleryPlacements, selectedCollectibleId]
  );
  const selectedCollectible = useMemo(
    () => collectibles.find((entry) => entry.listingId === selectedCollectibleId) ?? null,
    [collectibles, selectedCollectibleId]
  );
  const visibleCollectibles = useMemo(() => {
    const keyword = collectibleSearch.trim().toLowerCase();
    if (!keyword) return collectibles;
    return collectibles.filter((entry) => entry.title.toLowerCase().includes(keyword));
  }, [collectibleSearch, collectibles]);
  const collectibleTotalPages = Math.max(1, Math.ceil(visibleCollectibles.length / COLLECTIBLE_PAGE_SIZE));
  const pagedCollectibles = useMemo(() => {
    const start = (collectiblePage - 1) * COLLECTIBLE_PAGE_SIZE;
    return visibleCollectibles.slice(start, start + COLLECTIBLE_PAGE_SIZE);
  }, [collectiblePage, visibleCollectibles]);

  useEffect(() => {
    if (collectiblePage > collectibleTotalPages) {
      setCollectiblePage(collectibleTotalPages);
    }
  }, [collectiblePage, collectibleTotalPages]);

  const handlePlace = async () => {
    if (!selectedAnchorId) {
      return;
    }
    try {
      await placeAtAnchor(selectedItemId, selectedAnchorId);
    } catch (error) {
      Alert.alert(t('room.placeFailed'), error instanceof Error ? error.message : t('common.unknownError'));
    }
  };

  const handleRemove = async () => {
    if (!selectedAnchorId) {
      return;
    }
    try {
      await removePlacementAtAnchor(selectedAnchorId);
    } catch (error) {
      Alert.alert(t('room.removeFailed'), error instanceof Error ? error.message : t('common.unknownError'));
    }
  };

  const handleGalleryCellPress = async (x: number, y: number, listingIdAtCell: string | null) => {
    if (!selectedCollectibleId) {
      setSelectedCollectibleId(listingIdAtCell);
      return;
    }

    try {
      await placeCollectibleAtCell(selectedCollectibleId, x, y);
    } catch (error) {
      Alert.alert(t('room.galleryPlaceFailed'), error instanceof Error ? error.message : t('common.unknownError'));
    }
  };

  const handleRemoveFromGallery = async () => {
    if (!selectedCollectibleId) {
      return;
    }
    try {
      await removeCollectibleFromGallery(selectedCollectibleId);
    } catch (error) {
      Alert.alert(t('room.galleryRemoveFailed'), error instanceof Error ? error.message : t('common.unknownError'));
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('room.title')}</Text>

      <Card>
        <Text style={styles.label}>{t('room.roomType')}</Text>
        <View style={styles.switchRow}>
          {ROOM_TYPES.map((entry) => (
            <Button
              key={entry}
              label={entry === roomType ? `${entry} ✓` : entry}
              onPress={() => switchRoomType(entry)}
              variant={entry === roomType ? 'primary' : 'secondary'}
            />
          ))}
        </View>
      </Card>

      <Card>
        <View style={[styles.roomGalleryWrap, splitRoomGallery ? styles.roomGalleryWrapRow : styles.roomGalleryWrapColumn]}>
          <View style={[styles.sceneWrap, splitRoomGallery ? styles.sceneWrapRow : styles.sceneWrapColumn]}>
            <Text style={styles.panelTitle}>{t('room.isometric')}</Text>
            <IsometricRoom
              roomType={roomType}
              placements={placements}
              selectedAnchorId={selectedAnchorId}
              onSelectAnchor={setSelectedAnchorId}
              i18n={{
                anchorEmpty: (anchorId) => t('room.anchorEmpty', { anchorId }),
                anchorFilled: (anchorId, itemId) => t('room.anchorFilled', { anchorId, itemId }),
                anchorHintEditable: t('room.anchorHintEditable'),
                anchorHintReadonly: t('room.anchorHintReadonly'),
              }}
            />
          </View>
          <View style={[styles.galleryWrap, splitRoomGallery ? styles.galleryWrapRow : styles.galleryWrapColumn]}>
            <Text style={styles.panelTitle}>{t('room.galleryTitle')}</Text>
            <CollectibleGalleryBoard
              placements={galleryPlacements}
              collectibles={collectibles}
              selectedListingId={selectedCollectibleId}
              cellSize={galleryCellSize}
              i18n={{
                a11yEmpty: (x, y) => t('room.galleryCellEmpty', { x, y }),
                a11yFilled: (x, y, title) => t('room.galleryCellFilled', { x, y, title }),
                a11yHintPlace: t('room.galleryCellHint'),
                a11yHintReadonly: t('room.galleryCellReadonly'),
                imageLabel: (title) => t('room.collectibleImage', { title }),
              }}
              onCellPress={(x, y, listingIdAtCell) => void handleGalleryCellPress(x, y, listingIdAtCell)}
            />
          </View>
        </View>
        <Text style={styles.text}>
          {t('room.selectedAnchor', {
            anchor: selectedAnchorId ?? t('common.none'),
            state: selectedPlacement ? t('room.hasItem', { item: selectedPlacement.item_id }) : t('room.empty'),
          })}
        </Text>
      </Card>

      <Card>
        <Text style={styles.label}>{t('room.inventory')}</Text>
        <View style={styles.inventoryWrap}>
          {inventory.map((item) => {
            const spriteId = resolveSpriteId(item.item_id);
            const active = selectedItemId === item.item_id;
            return (
              <View key={item.item_id} style={[styles.inventoryCard, active ? styles.inventoryCardActive : null]}>
                <PixelSprite spriteId={spriteId} size={34} />
                <Text style={styles.inventoryName}>{ROOM_SPRITES[spriteId].name}</Text>
                <Text style={styles.inventoryMeta}>{t('room.owned', { count: item.quantity })}</Text>
                <Button
                  label={active ? t('room.selected') : t('room.select')}
                  onPress={() => setSelectedItemId(item.item_id as BuildTargetId)}
                  variant={active ? 'primary' : 'secondary'}
                />
              </View>
            );
          })}
        </View>
        <Button
          label={t('room.place', { count: quantity })}
          onPress={handlePlace}
          disabled={!selectedAnchorId || quantity <= 0}
        />
        <Button label={t('room.remove')} onPress={handleRemove} variant="danger" disabled={!selectedPlacement} />
      </Card>

      <Card>
        <Text style={styles.label}>{t('room.collectibles')}</Text>
        <Button
          label={selectedCollectibleId ? t('room.clearSelection') : t('room.noSelection')}
          onPress={() => setSelectedCollectibleId(null)}
          variant="secondary"
        />
        <TextInput
          value={collectibleSearch}
          onChangeText={(value) => {
            setCollectibleSearch(value);
            setCollectiblePage(1);
          }}
          placeholder={t('room.collectibleSearch')}
          style={styles.searchInput}
          accessibilityLabel={t('room.collectibleSearch')}
        />
        {!collectibles.length ? <Text style={styles.text}>{t('room.noCollectibles')}</Text> : null}
        <View style={styles.collectibleWrap}>
          {pagedCollectibles.map((collectible) => {
            const isPlaced = placedCollectibleIds.has(collectible.listingId);
            const isActive = selectedCollectibleId === collectible.listingId;
            const previewUri = collectible.pixelImageUrl ?? collectible.imageUrl;
            return (
              <View key={collectible.listingId} style={[styles.collectibleCard, isActive ? styles.collectibleCardActive : null]}>
                <View style={styles.collectibleHead}>
                  {previewUri ? <Image source={{ uri: previewUri }} style={styles.collectibleThumb} accessibilityLabel={t('room.collectibleImage', { title: collectible.title })} /> : null}
                  {!previewUri && collectible.pixelPalette && collectible.pixelGrid ? (
                    <View style={styles.collectibleThumbSprite}>
                      <PixelGridSprite palette={collectible.pixelPalette} grid={collectible.pixelGrid} size={30} />
                    </View>
                  ) : null}
                  <Text style={styles.collectibleTitle}>{collectible.title}</Text>
                </View>
                <Text style={styles.collectibleMeta}>{isPlaced ? t('room.galleryPlaced') : t('room.galleryUnplaced')}</Text>
                <Button
                  label={isActive ? t('room.selected') : t('room.select')}
                  onPress={() => setSelectedCollectibleId((prev) => (prev === collectible.listingId ? null : collectible.listingId))}
                  variant={isActive ? 'primary' : 'secondary'}
                />
              </View>
            );
          })}
        </View>
        <View style={styles.paginationRow}>
          <Button label={t('common.prev')} onPress={() => setCollectiblePage((prev) => Math.max(1, prev - 1))} disabled={collectiblePage <= 1} variant="secondary" />
          <Text style={styles.pageText}>{t('common.pageOf', { page: collectiblePage, total: collectibleTotalPages })}</Text>
          <Button
            label={t('common.next')}
            onPress={() => setCollectiblePage((prev) => Math.min(collectibleTotalPages, prev + 1))}
            disabled={collectiblePage >= collectibleTotalPages}
            variant="secondary"
          />
        </View>
        <Button
          label={selectedCollectible ? t('room.galleryRemoveSelected', { title: selectedCollectible.title }) : t('room.galleryRemoveAny')}
          onPress={handleRemoveFromGallery}
          variant="danger"
          disabled={!selectedCollectibleId || !selectedCollectiblePlacement}
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
  label: { color: theme.colors.muted, fontWeight: '700', fontFamily: theme.typography.body },
  text: { color: theme.colors.muted, fontFamily: theme.typography.body },
  switchRow: { flexDirection: 'row', gap: 8 },
  roomGalleryWrap: {
    gap: 16,
    alignItems: 'stretch',
  },
  roomGalleryWrapRow: {
    flexDirection: 'row',
  },
  roomGalleryWrapColumn: {
    flexDirection: 'column',
  },
  sceneWrap: {
    alignItems: 'center',
    gap: 8,
  },
  sceneWrapRow: {
    flex: 1,
    minWidth: 430,
  },
  sceneWrapColumn: {
    width: '100%',
    minWidth: 0,
  },
  galleryWrap: {
    gap: 8,
    alignItems: 'center',
  },
  galleryWrapRow: {
    flex: 1,
    minWidth: 360,
    justifyContent: 'center',
  },
  galleryWrapColumn: {
    width: '100%',
    minWidth: 0,
  },
  panelTitle: {
    color: theme.colors.muted,
    fontWeight: '700',
    fontFamily: theme.typography.body,
    alignSelf: 'flex-start',
  },
  inventoryWrap: { gap: 8 },
  inventoryCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 10,
    gap: 6,
    backgroundColor: '#FCF8EE',
  },
  inventoryCardActive: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: '#EEF7EC',
  },
  inventoryName: { color: theme.colors.text, fontWeight: '700', fontFamily: theme.typography.body },
  inventoryMeta: { color: theme.colors.muted, fontFamily: theme.typography.body, fontSize: 12 },
  collectibleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  collectibleCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 10,
    gap: 8,
    backgroundColor: '#fff',
    flexBasis: Platform.OS === 'web' ? '31%' : '100%',
    flexGrow: 1,
  },
  collectibleCardActive: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF4E5',
  },
  collectibleTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    fontFamily: theme.typography.body,
    flexShrink: 1,
  },
  collectibleMeta: {
    color: theme.colors.muted,
    fontFamily: theme.typography.body,
    fontSize: 12,
  },
  collectibleHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collectibleThumb: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#E5DFD1',
  },
  collectibleThumbSprite: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4E8D4',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  pageText: {
    color: theme.colors.muted,
    fontFamily: theme.typography.body,
    fontWeight: '700',
  },
});
