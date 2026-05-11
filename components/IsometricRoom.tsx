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

interface GymDecorProps {
  sceneWidth: number;
  sceneHeight: number;
  tileWidth: number;
  tileHeight: number;
  originX: number;
  originY: number;
  wallWidth: number;
  wallHeight: number;
  wallTop: number;
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

function GymDecor({ sceneWidth, sceneHeight, tileWidth, tileHeight, originX, originY, wallWidth, wallHeight, wallTop }: GymDecorProps) {
  const mat = projectIso(2.8, 5.2, tileWidth, tileHeight, originX, originY);
  const bench = projectIso(0.9, 4.6, tileWidth, tileHeight, originX, originY);
  const treadmillA = projectIso(5.3, 3.7, tileWidth, tileHeight, originX, originY);
  const treadmillB = projectIso(5.9, 4.6, tileWidth, tileHeight, originX, originY);
  const rack = projectIso(1.3, 2.8, tileWidth, tileHeight, originX, originY);
  const dumbbell = projectIso(3.5, 4.1, tileWidth, tileHeight, originX, originY);

  return (
    <View pointerEvents="none" style={styles.decorLayer}>
      <View
        style={[
          styles.gymWindowGroup,
          {
            left: originX - wallWidth + sceneWidth * 0.04,
            top: wallTop + sceneHeight * 0.04,
            width: wallWidth * 0.76,
            height: wallHeight * 0.64,
          },
        ]}
      >
        {[0, 1, 2].map((index) => (
          <View key={index} style={styles.gymWindowPane}>
            <View style={styles.gymWindowGlare} />
          </View>
        ))}
      </View>

      <View
        style={[
          styles.gymAirCon,
          {
            left: originX + wallWidth * 0.16,
            top: wallTop + wallHeight * 0.08,
            width: wallWidth * 0.58,
            height: wallHeight * 0.2,
          },
        ]}
      >
        <View style={styles.gymAirConVent} />
        <View style={styles.gymAirConVent} />
        <View style={styles.gymAirConLight} />
      </View>
      <View style={[styles.gymNoticeBoard, { left: originX + wallWidth * 0.18, top: wallTop + wallHeight * 0.42, width: wallWidth * 0.28, height: wallHeight * 0.28 }]} />
      <View style={[styles.gymTv, { left: originX + wallWidth * 0.55, top: wallTop + wallHeight * 0.4, width: wallWidth * 0.36, height: wallHeight * 0.26 }]} />

      <View
        style={[
          styles.gymMat,
          {
            left: mat.x - tileWidth * 1.45,
            top: mat.y - tileHeight * 0.15,
            width: tileWidth * 2.9,
            height: tileHeight * 1.15,
          },
        ]}
      />

      <View
        style={[
          styles.gymBench,
          {
            left: bench.x - tileWidth * 1.05,
            top: bench.y - tileHeight * 0.25,
            width: tileWidth * 2.2,
            height: tileHeight * 0.52,
          },
        ]}
      >
        <View style={styles.gymBenchSeat} />
        <View style={[styles.gymBenchLeg, { left: tileWidth * 0.15 }]} />
        <View style={[styles.gymBenchLeg, { right: tileWidth * 0.15 }]} />
      </View>

      <View style={[styles.gymWeightRack, { left: rack.x - tileWidth * 0.85, top: rack.y - tileHeight * 0.45, width: tileWidth * 2.1, height: tileHeight * 1.15 }]}>
        {[0, 1, 2, 3, 4].map((index) => (
          <View key={index} style={[styles.gymRackPlate, { left: tileWidth * (0.2 + index * 0.34), top: tileHeight * (0.2 + (index % 2) * 0.12) }]} />
        ))}
      </View>

      {[treadmillA, treadmillB].map((point, index) => (
        <View
          key={index}
          style={[
            styles.gymTreadmill,
            {
              left: point.x - tileWidth * 0.85,
              top: point.y - tileHeight * 0.25,
              width: tileWidth * 1.9,
              height: tileHeight * 0.66,
            },
          ]}
        >
          <View style={styles.gymTreadmillBelt} />
          <View style={styles.gymTreadmillConsole} />
        </View>
      ))}

      <View style={[styles.gymDumbbell, { left: dumbbell.x - tileWidth * 0.45, top: dumbbell.y - tileHeight * 0.1, width: tileWidth, height: tileHeight * 0.4 }]}>
        <View style={styles.gymDumbbellPlateLeft} />
        <View style={styles.gymDumbbellBar} />
        <View style={styles.gymDumbbellPlateRight} />
      </View>
    </View>
  );
}

export function IsometricRoom({ roomType, placements, selectedAnchorId, onSelectAnchor, readOnly = false, i18n }: IsometricRoomProps) {
  const { width } = useWindowDimensions();
  const anchors = ROOM_ANCHORS[roomType];
  const isGym = roomType === 'gym';
  const sceneWidth = Math.min(MAX_SCENE_WIDTH, Math.max(MIN_SCENE_WIDTH, width - 72));
  const sceneHeight = Math.round(sceneWidth * (isGym ? 0.64 : 0.72));
  const tileWidth = sceneWidth / 8.2;
  const tileHeight = tileWidth * TILE_ASPECT_RATIO;
  const originX = sceneWidth / 2;
  const originY = sceneHeight * (isGym ? 0.6 : FLOOR_ORIGIN_Y_RATIO);
  const floorWidth = tileWidth * ROOM_GRID_SIZE;
  const wallWidth = floorWidth * WALL_WIDTH_RATIO;
  const wallHeight = sceneHeight * (isGym ? 0.42 : WALL_HEIGHT_RATIO);
  const wallTop = isGym ? sceneHeight * 0.1 : originY - wallHeight + tileHeight * WALL_TOP_OFFSET;
  const themeColors = isGym ? gymColors : bedroomColors;

  return (
    <View style={[styles.scene, { width: sceneWidth, height: sceneHeight, backgroundColor: themeColors.sky }]}>
      <View
        style={[
          styles.leftWall,
          isGym ? styles.gymLeftWall : null,
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
          isGym ? styles.gymRightWall : null,
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
      {isGym
        ? null
        : Array.from({ length: ROOM_GRID_SIZE }).map((_, row) =>
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
      {isGym ? (
        <GymDecor
          sceneWidth={sceneWidth}
          sceneHeight={sceneHeight}
          tileWidth={tileWidth}
          tileHeight={tileHeight}
          originX={originX}
          originY={originY}
          wallWidth={wallWidth}
          wallHeight={wallHeight}
          wallTop={wallTop}
        />
      ) : null}
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
  sky: '#BDF3F4',
  leftWall: '#D8FCFA',
  rightWall: '#5DC8D0',
  floor: '#A8B9BD',
  grid: 'rgba(238, 252, 255, 0.22)',
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
  gymLeftWall: {
    transform: [{ skewY: '-18deg' }],
    opacity: 0.96,
  },
  gymRightWall: {
    transform: [{ skewY: '18deg' }],
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
  decorLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  gymWindowGroup: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 6,
    transform: [{ skewY: '-24deg' }],
    opacity: 0.9,
  },
  gymWindowPane: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(112, 214, 220, 0.58)',
    backgroundColor: 'rgba(236, 255, 255, 0.82)',
    overflow: 'hidden',
  },
  gymWindowGlare: {
    position: 'absolute',
    left: '46%',
    top: '-20%',
    width: 8,
    height: '145%',
    backgroundColor: 'rgba(255,255,255,0.76)',
    transform: [{ rotate: '24deg' }],
  },
  gymAirCon: {
    position: 'absolute',
    borderRadius: 5,
    backgroundColor: '#F5F5F2',
    borderWidth: 1,
    borderColor: 'rgba(200,200,200,0.55)',
    padding: 5,
    transform: [{ skewY: '24deg' }],
  },
  gymAirConVent: {
    height: 2,
    marginBottom: 3,
    backgroundColor: '#D8D8D8',
  },
  gymAirConLight: {
    position: 'absolute',
    right: 7,
    bottom: 5,
    width: 6,
    height: 3,
    backgroundColor: '#F5B621',
  },
  gymNoticeBoard: {
    position: 'absolute',
    borderRadius: 2,
    backgroundColor: '#F5B91D',
    borderWidth: 2,
    borderColor: '#DF9F0F',
    transform: [{ skewY: '24deg' }],
  },
  gymTv: {
    position: 'absolute',
    borderRadius: 2,
    backgroundColor: '#20252A',
    borderWidth: 4,
    borderColor: '#3B4246',
    transform: [{ skewY: '24deg' }],
  },
  gymMat: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: 'rgba(64, 202, 207, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(185,255,255,0.35)',
    transform: [{ rotate: '26deg' }, { scaleY: 0.62 }],
    zIndex: 28,
  },
  gymBench: {
    position: 'absolute',
    zIndex: 33,
    transform: [{ rotate: '26deg' }],
  },
  gymBenchSeat: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 12,
    borderRadius: 5,
    backgroundColor: '#D91E2A',
  },
  gymBenchLeg: {
    position: 'absolute',
    top: 10,
    width: 5,
    height: 24,
    backgroundColor: '#EEF2F0',
  },
  gymWeightRack: {
    position: 'absolute',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderColor: '#EEF2F0',
    zIndex: 32,
    transform: [{ rotate: '26deg' }],
  },
  gymRackPlate: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#676B6E',
  },
  gymTreadmill: {
    position: 'absolute',
    borderRadius: 5,
    borderWidth: 3,
    borderColor: '#F2B91F',
    backgroundColor: '#E9EDEE',
    zIndex: 31,
    transform: [{ rotate: '26deg' }],
  },
  gymTreadmillBelt: {
    position: 'absolute',
    left: 10,
    right: 18,
    top: 6,
    bottom: 6,
    borderRadius: 3,
    backgroundColor: '#55585A',
  },
  gymTreadmillConsole: {
    position: 'absolute',
    right: 3,
    top: -12,
    width: 20,
    height: 13,
    borderRadius: 2,
    backgroundColor: '#30363A',
  },
  gymDumbbell: {
    position: 'absolute',
    zIndex: 35,
    transform: [{ rotate: '26deg' }],
  },
  gymDumbbellPlateLeft: {
    position: 'absolute',
    left: 0,
    top: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#5E6366',
  },
  gymDumbbellPlateRight: {
    position: 'absolute',
    right: 0,
    top: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#5E6366',
  },
  gymDumbbellBar: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 6,
    height: 4,
    backgroundColor: '#EEF2F0',
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
