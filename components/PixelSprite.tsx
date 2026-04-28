import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ROOM_SPRITES, type SpriteId } from '@/constants/roomSprites';

interface PixelSpriteProps {
  spriteId: SpriteId;
  size?: number;
}

export function PixelSprite({ spriteId, size = 32 }: PixelSpriteProps) {
  const sprite = ROOM_SPRITES[spriteId] ?? ROOM_SPRITES.unknown;
  const rows = sprite.grid;
  const dimension = rows.length;
  const pixelSize = Math.max(1, Math.floor(size / dimension));

  return (
    <View style={[styles.wrap, { width: pixelSize * dimension, height: pixelSize * dimension }]}>
      {rows.map((row, y) =>
        row.split('').map((code, x) => (
          <View
            key={`${spriteId}-${x}-${y}`}
            style={{
              position: 'absolute',
              left: x * pixelSize,
              top: y * pixelSize,
              width: pixelSize,
              height: pixelSize,
              backgroundColor: sprite.palette[code] ?? 'transparent',
            }}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
});
