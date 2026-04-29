import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import type { CustomGalleryPlacement, GalleryItem } from '@/types/models';

interface CollectibleGalleryBoardProps {
  placements: CustomGalleryPlacement[];
  collectibles: GalleryItem[];
  selectedListingId: string | null;
  onCellPress?: (x: number, y: number, listingIdAtCell: string | null) => void;
  readOnly?: boolean;
  i18n?: {
    a11yEmpty: (x: number, y: number) => string;
    a11yFilled: (x: number, y: number, title: string) => string;
    a11yHintPlace: string;
    a11yHintReadonly: string;
    imageLabel: (title: string) => string;
  };
}

const SIZE = 5;

export function CollectibleGalleryBoard({
  placements,
  collectibles,
  selectedListingId,
  onCellPress,
  readOnly = false,
  i18n,
}: CollectibleGalleryBoardProps) {
  const collectibleMap = new Map(collectibles.map((item) => [item.listingId, item]));
  const placementMap = new Map(placements.map((placement) => [`${placement.cellX}-${placement.cellY}`, placement]));

  return (
    <View style={styles.wrap}>
      {Array.from({ length: SIZE }).map((_, y) => (
        <View key={`row-${y}`} style={styles.row}>
          {Array.from({ length: SIZE }).map((__, x) => {
            const key = `${x}-${y}`;
            const placement = placementMap.get(key) ?? null;
            const collectible = placement ? collectibleMap.get(placement.listingId) : null;
            const active = placement?.listingId === selectedListingId;
            const sourceUri = collectible?.pixelImageUrl ?? collectible?.imageUrl ?? null;

            return (
              <Pressable
                key={key}
                onPress={() => onCellPress?.(x, y, placement?.listingId ?? null)}
                disabled={readOnly}
                style={[styles.cell, active ? styles.cellActive : null]}
                accessibilityRole="button"
                accessibilityLabel={
                  placement
                    ? i18n?.a11yFilled(x + 1, y + 1, collectible?.title ?? 'item') ?? `Gallery cell ${x + 1},${y + 1} contains ${collectible?.title ?? 'item'}`
                    : i18n?.a11yEmpty(x + 1, y + 1) ?? `Gallery cell ${x + 1},${y + 1} empty`
                }
                accessibilityHint={readOnly ? i18n?.a11yHintReadonly ?? 'Read-only gallery cell' : i18n?.a11yHintPlace ?? 'Tap to place or select collectible'}
              >
                {sourceUri ? (
                  <Image
                    source={{ uri: sourceUri }}
                    style={styles.thumb}
                    accessibilityLabel={i18n?.imageLabel(collectible?.title ?? 'Collectible image') ?? collectible?.title ?? 'Collectible image'}
                  />
                ) : (
                  <Text style={styles.dot}>·</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    width: 54,
    height: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cellActive: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF4E5',
  },
  thumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dot: {
    color: theme.colors.muted,
    fontSize: 18,
    lineHeight: 22,
  },
});
