import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { PixelSprite } from '@/components/PixelSprite';
import { ROOM_ANCHORS } from '@/constants/roomLayout';
import { resolveSpriteId } from '@/constants/spriteUtils';
import { theme } from '@/constants/theme';
import type { RoomType } from '@/types/models';

interface Placement {
  id: string;
  anchor_id: string;
  item_id: string;
}

interface IsometricRoomProps {
  roomType: RoomType;
  placements: Placement[];
  selectedAnchorId: string | null;
  onSelectAnchor: (anchorId: string) => void;
  readOnly?: boolean;
  i18n?: {
    anchorEmpty: (anchorId: string) => string;
    anchorFilled: (anchorId: string, itemId: string) => string;
    anchorHintEditable: string;
    anchorHintReadonly: string;
  };
}

const ROOM_GRID_SIZE = 7;
const MAX_SCENE_WIDTH = 560;
const MIN_SCENE_WIDTH = 320;
const TILE_ASPECT_RATIO = 0.52;
const WALL_WIDTH_RATIO = 0.72;
const WALL_HEIGHT_RATIO = 0.34;
const WALL_TOP_OFFSET = 0.65;
const FLOOR_ORIGIN_Y_RATIO = 0.38;

function projectIso(gridX: number, gridY: number, tileWidth: number, tileHeight: number, originX: number, originY: number) {
  return {
    x: originX + (gridX - gridY) * (tileWidth / 2),
    y: originY + (gridX + gridY) * (tileHeight / 2),
  };
}

export function IsometricRoom({ roomType, placements, selectedAnchorId, onSelectAnchor, readOnly = false, i18n }: IsometricRoomProps) {
  const { width } = useWindowDimensions();
  const anchors = ROOM_ANCHORS[roomType];
  const sceneWidth = Math.min(MAX_SCENE_WIDTH, Math.max(MIN_SCENE_WIDTH, width - 72));
  const sceneHeight = Math.round(sceneWidth * 0.72);
  const tileWidth = sceneWidth / 8.2;
  const tileHeight = tileWidth * TILE_ASPECT_RATIO;
  const originX = sceneWidth / 2;
  const originY = sceneHeight * FLOOR_ORIGIN_Y_RATIO;
  const floorWidth = tileWidth * ROOM_GRID_SIZE;
  const wallWidth = floorWidth * WALL_WIDTH_RATIO;
  const wallHeight = sceneHeight * WALL_HEIGHT_RATIO;
  const wallTop = originY - wallHeight + tileHeight * WALL_TOP_OFFSET;
  const themeColors = roomType === 'gym' ? gymColors : bedroomColors;

  return (
    <View style={[styles.scene, { width: sceneWidth, height: sceneHeight, backgroundColor: themeColors.sky }]}>
      <View
        style={[
          styles.leftWall,
          {
            left: originX - wallWidth,
            top: wallTop,
            width: wallWidth,
            height: wallHeight,
            backgroundColor: themeColors.leftWall,
          },
        ]}
      />
      <View
        style={[
          styles.rightWall,
          {
            left: originX,
            top: wallTop,
            width: wallWidth,
            height: wallHeight,
            backgroundColor: themeColors.rightWall,
          },
        ]}
      />
      <View
        style={[
          styles.floorShadow,
          {
            left: originX - floorWidth / 2 + 4,
            top: originY - floorWidth / 2 + 8,
            width: floorWidth,
            height: floorWidth,
          },
        ]}
      />
      <View
        style={[
          styles.floorDiamond,
          {
            left: originX - floorWidth / 2,
            top: originY - floorWidth / 2,
            width: floorWidth,
            height: floorWidth,
            backgroundColor: themeColors.floor,
          },
        ]}
      />
      {Array.from({ length: ROOM_GRID_SIZE }).map((_, row) =>
        Array.from({ length: ROOM_GRID_SIZE }).map((__, col) => {
          const projected = projectIso(col, row, tileWidth, tileHeight, originX, originY);
          return (
            <View
              key={`tile-${col}-${row}`}
              pointerEvents="none"
              style={[
                styles.floorTile,
                {
                  left: projected.x - tileWidth / 2,
                  top: projected.y - tileHeight / 2,
                  width: tileWidth,
                  height: tileHeight,
                  borderColor: themeColors.grid,
                },
              ]}
            />
          );
        })
      )}
      <View style={[styles.cornerLine, { left: originX - 1, top: originY - wallHeight + tileHeight * 0.6, height: wallHeight + tileHeight * 0.4 }]} />
      {anchors.map((anchor) => {
        const placed = placements.find((entry) => entry.anchor_id === anchor.id);
        const projected = projectIso(anchor.x, anchor.y, tileWidth, tileHeight, originX, originY);
        const isWall = anchor.slotType === 'wall';
        const anchorSize = Math.max(30, tileWidth * 0.58);
        const itemSize = Math.max(34, tileWidth * 0.7);
        const left = projected.x - anchorSize / 2;
        const top = isWall ? originY - wallHeight + tileHeight * 0.7 + anchor.y * tileHeight * 0.42 : projected.y - anchorSize / 2;
        const zIndex = isWall ? 20 + anchor.zIndex : 40 + Math.round(projected.y) + anchor.zIndex;
        return (
          <Pressable
            key={anchor.id}
            onPress={() => onSelectAnchor(anchor.id)}
            disabled={readOnly}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedAnchorId === anchor.id, disabled: readOnly }}
            accessibilityLabel={
              placed
                ? i18n?.anchorFilled(anchor.id, placed.item_id) ?? `Anchor ${anchor.id} has ${placed.item_id}`
                : i18n?.anchorEmpty(anchor.id) ?? `Anchor ${anchor.id} empty`
            }
            accessibilityHint={readOnly ? i18n?.anchorHintReadonly ?? 'Read-only room anchor' : i18n?.anchorHintEditable ?? 'Select anchor for placing or removing item'}
            style={[
              styles.anchor,
              {
                left,
                top,
                width: anchorSize,
                height: anchorSize,
                borderRadius: anchorSize / 4,
                zIndex,
              },
              isWall ? styles.wallAnchor : null,
              selectedAnchorId === anchor.id ? styles.anchorSelected : null,
            ]}
          >
            {placed ? <PixelSprite spriteId={resolveSpriteId(placed.item_id)} size={itemSize} /> : <Text style={styles.plus}>+</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const bedroomColors = {
  sky: '#25BFD4',
  leftWall: '#9EC7EE',
  rightWall: '#7FB0E5',
  floor: '#D8F0EC',
  grid: 'rgba(72, 141, 162, 0.24)',
};

const gymColors = {
  sky: '#48A898',
  leftWall: '#B9D7C0',
  rightWall: '#8FC5AC',
  floor: '#E0E7D4',
  grid: 'rgba(70, 126, 103, 0.28)',
};

const styles = StyleSheet.create({
  scene: {
    borderRadius: 18,
    overflow: 'hidden',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#D6EDF2',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  leftWall: {
    position: 'absolute',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 8,
    transform: [{ skewY: '-24deg' }],
  },
  rightWall: {
    position: 'absolute',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 8,
    transform: [{ skewY: '24deg' }],
  },
  floorShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(23, 77, 92, 0.16)',
    transform: [{ rotate: '45deg' }, { scaleY: 0.52 }],
    borderRadius: 10,
  },
  floorDiamond: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.72)',
    transform: [{ rotate: '45deg' }, { scaleY: 0.52 }],
    borderRadius: 10,
  },
  floorTile: {
    position: 'absolute',
    borderWidth: 1,
    transform: [{ rotate: '45deg' }, { scaleY: 0.52 }],
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cornerLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: 'rgba(52, 94, 130, 0.34)',
  },
  anchor: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#86A9C4',
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
  },
  wallAnchor: {
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  anchorSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: '#FFF3DF',
  },
  plus: {
    color: '#7293AA',
    fontWeight: '700',
  },
});
