import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PixelSprite } from '@/components/PixelSprite';
import type { SpriteId } from '@/constants/roomSprites';
import { theme } from '@/constants/theme';

interface RoomGridItem {
  id: string;
  x: number;
  y: number;
  spriteId?: SpriteId;
}

interface RoomGridProps {
  items: RoomGridItem[];
  size?: number;
  selectedCell?: { x: number; y: number } | null;
  onCellPress?: (coords: { x: number; y: number; item?: RoomGridItem }) => void;
}

export function RoomGrid({ items, size = 6, selectedCell, onCellPress }: RoomGridProps) {
  const cells = [] as React.ReactNode[];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const item = items.find((entry) => entry.x === x && entry.y === y);
      const selected = selectedCell?.x === x && selectedCell?.y === y;

      cells.push(
        <Pressable
          key={`${x}-${y}`}
          style={[styles.cell, selected ? styles.selectedCell : null]}
          onPress={() => onCellPress?.({ x, y, item })}
          accessibilityRole="button"
          accessibilityLabel={`Room cell x ${x}, y ${y}`}
        >
          {item ? <PixelSprite spriteId={item.spriteId ?? 'unknown'} size={30} /> : null}
        </Pressable>
      );
    }
  }

  return <View style={styles.grid}>{cells}</View>;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignSelf: 'flex-start',
  },
  cell: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF8F1',
  },
  selectedCell: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: '#EDF6EA',
  },
});
