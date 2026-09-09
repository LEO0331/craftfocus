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

interface RoomDecorProps {
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

function projectIso(gridX: number, gridY: number, tileWidth: number, tileHeight: number, originX: number, originY: number) {
  return {
    x: originX + (gridX - gridY) * (tileWidth / 2),
    y: originY + (gridX + gridY) * (tileHeight / 2),
  };
}

function BedroomDecor({ tileWidth, tileHeight, originX, originY, wallWidth, wallHeight, wallTop }: RoomDecorProps) {
  return (
    <View pointerEvents="none" style={styles.decorLayer}>
      <View style={[styles.bedroomLeftWindow, { left: originX - wallWidth * 0.66, top: wallTop + wallHeight * 0.2, width: wallWidth * 0.34, height: wallHeight * 0.42 }]}>
        <View style={styles.bedroomWindowRail} />
      </View>
      <View style={[styles.bedroomFrameLarge, { left: originX - wallWidth * 0.24, top: wallTop + wallHeight * 0.2, width: wallWidth * 0.18, height: wallHeight * 0.34 }]} />
      <View style={[styles.bedroomRightWindow, { left: originX + wallWidth * 0.36, top: wallTop + wallHeight * 0.22, width: wallWidth * 0.34, height: wallHeight * 0.38 }]}>
        <View style={styles.bedroomWindowRail} />
      </View>

    </View>
  );
}

function GymDecor({ tileWidth, tileHeight, originX, originY, wallWidth, wallHeight, wallTop }: RoomDecorProps) {
  const leftDumbbell = projectIso(-0.65, 4.4, tileWidth, tileHeight, originX, originY);
  const bench = projectIso(1.15, 3.8, tileWidth, tileHeight, originX, originY);
  const sideBench = projectIso(1.05, 5.55, tileWidth, tileHeight, originX, originY);
  const frontBench = projectIso(5.35, 4.95, tileWidth, tileHeight, originX, originY);
  const rightBench = projectIso(6.15, 3.05, tileWidth, tileHeight, originX, originY);
  const rack = projectIso(4.1, 3.0, tileWidth, tileHeight, originX, originY);
  const kettlebells = projectIso(5.25, 2.75, tileWidth, tileHeight, originX, originY);
  const rightDumbbells = projectIso(6.35, 3.95, tileWidth, tileHeight, originX, originY);
  const dumbbellRack = projectIso(2.6, 3.1, tileWidth, tileHeight, originX, originY);

  return (
    <View pointerEvents="none" style={styles.decorLayer}>
      <View
        style={[
          styles.gymWindowWall,
          {
            left: originX - wallWidth * 0.92,
            top: wallTop + wallHeight * 0.13,
            width: wallWidth * 0.7,
            height: wallHeight * 0.48,
          },
        ]}
      >
        <View style={styles.gymWindowGlare} />
        <View style={[styles.gymWindowGlare, styles.gymWindowGlareSecond]} />
      </View>

      <View style={[styles.gymScoreboard, { left: originX + wallWidth * 0.18, top: wallTop + wallHeight * 0.08, width: wallWidth * 0.34, height: wallHeight * 0.22 }]}>
        {[0, 1, 2, 3].map((index) => (
          <View key={index} style={[styles.gymScoreLine, { top: 6 + index * 7, width: `${72 - index * 8}%` }]} />
        ))}
      </View>
      <View style={[styles.gymClock, { left: originX + wallWidth * 0.72, top: wallTop + wallHeight * 0.18, width: tileWidth * 0.64, height: tileWidth * 0.64 }]}>
        <View style={styles.gymClockHand} />
      </View>
      <View style={[styles.gymPoster, { left: originX + wallWidth * 0.52, top: wallTop + wallHeight * 0.42, width: wallWidth * 0.32, height: wallHeight * 0.34 }]}>
        <View style={styles.gymPosterTitle} />
        <View style={styles.gymPosterBody} />
      </View>

      {[0, 1].map((index) => (
        <View
          key={index}
          style={[
            styles.gymWallLadder,
            {
              left: originX + wallWidth * (0.02 + index * 0.33),
              top: wallTop + wallHeight * 0.38,
              width: wallWidth * 0.18,
              height: wallHeight * 0.52,
            },
          ]}
        >
          <View style={[styles.gymLadderRail, { left: 0 }]} />
          <View style={[styles.gymLadderRail, { right: 0 }]} />
          {[0, 1, 2, 3].map((rung) => (
            <View key={rung} style={[styles.gymLadderRung, { top: `${16 + rung * 19}%` }]} />
          ))}
        </View>
      ))}

      <View
        style={[
          styles.gymBenchPress,
          styles.gymFloorScenery,
          {
            left: bench.x - tileWidth * 0.95,
            top: bench.y - tileHeight * 0.44,
            width: tileWidth * 2.4,
            height: tileHeight * 1.55,
          },
        ]}
      >
        <View style={[styles.gymRackUpright, { left: tileWidth * 0.16 }]} />
        <View style={[styles.gymRackUpright, { right: tileWidth * 0.22 }]} />
        <View style={styles.gymBarbellBar} />
        <View style={[styles.gymPlateYellow, { left: 0 }]} />
        <View style={[styles.gymPlateYellow, { right: 0 }]} />
        <View style={styles.gymBenchPad} />
      </View>

      <View style={[styles.gymDumbbellRack, styles.gymFloorScenery, { left: dumbbellRack.x - tileWidth * 0.45, top: dumbbellRack.y - tileHeight * 0.25, width: tileWidth * 1.3, height: tileHeight * 1.25 }]}>
        {[0, 1, 2].map((shelf) => (
          <View key={shelf} style={[styles.gymRackShelf, { top: tileHeight * (0.22 + shelf * 0.27) }]} />
        ))}
        {[0, 1, 2, 3, 4, 5].map((dot) => (
          <View key={dot} style={[styles.gymDumbbellDot, { left: tileWidth * (0.18 + (dot % 3) * 0.28), top: tileHeight * (0.15 + Math.floor(dot / 3) * 0.38) }]} />
        ))}
      </View>

      <View style={[styles.gymWeightTower, styles.gymFloorScenery, { left: rack.x - tileWidth * 0.48, top: rack.y - tileHeight * 0.92, width: tileWidth * 0.95, height: tileHeight * 2.05 }]}>
        <View style={[styles.gymTowerRail, { left: 4 }]} />
        <View style={[styles.gymTowerRail, { right: 4 }]} />
        {[0, 1, 2, 3].map((rung) => (
          <View key={rung} style={[styles.gymTowerRung, { top: tileHeight * (0.32 + rung * 0.36) }]} />
        ))}
      </View>

      <View style={[styles.gymKettlebellRow, styles.gymFloorScenery, { left: kettlebells.x - tileWidth * 0.4, top: kettlebells.y - tileHeight * 0.08, width: tileWidth * 1.3, height: tileHeight * 0.58 }]}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={[styles.gymKettlebell, { left: tileWidth * (0.05 + index * 0.38) }]} />
        ))}
      </View>

      <View style={[styles.gymSingleDumbbell, styles.gymFloorScenery, { left: leftDumbbell.x - tileWidth * 0.42, top: leftDumbbell.y - tileHeight * 0.06, width: tileWidth * 0.9, height: tileHeight * 0.44 }]}>
        <View style={styles.gymSingleDumbbellPlate} />
        <View style={[styles.gymSingleDumbbellPlate, styles.gymSingleDumbbellRightPlate]} />
        <View style={styles.gymSingleDumbbellBar} />
      </View>

      <View style={[styles.gymRightSmallBench, styles.gymFloorScenery, { left: rightBench.x - tileWidth * 0.75, top: rightBench.y - tileHeight * 0.25, width: tileWidth * 1.55, height: tileHeight * 0.56 }]}>
        <View style={styles.gymRightSmallBenchPad} />
        <View style={[styles.gymRightSmallBenchLeg, { left: tileWidth * 0.2 }]} />
        <View style={[styles.gymRightSmallBenchLeg, { right: tileWidth * 0.2 }]} />
      </View>

      <View style={[styles.gymSideBench, styles.gymFloorScenery, { left: sideBench.x - tileWidth * 0.85, top: sideBench.y - tileHeight * 0.34, width: tileWidth * 1.7, height: tileHeight * 0.58 }]}>
        <View style={styles.gymSideBenchPad} />
        <View style={[styles.gymSideBenchLeg, { left: tileWidth * 0.18 }]} />
        <View style={[styles.gymSideBenchLeg, { right: tileWidth * 0.18 }]} />
      </View>

      <View style={[styles.gymLooseDumbbells, styles.gymFloorScenery, { left: rightDumbbells.x - tileWidth * 0.52, top: rightDumbbells.y - tileHeight * 0.1, width: tileWidth * 1.15, height: tileHeight * 0.72 }]}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={[styles.gymLooseDumbbell, { left: tileWidth * (0.02 + index * 0.34), top: tileHeight * (0.08 + (index % 2) * 0.18) }]}>
            <View style={styles.gymLooseDumbbellPlate} />
            <View style={[styles.gymLooseDumbbellPlate, styles.gymLooseDumbbellPlateRight]} />
            <View style={styles.gymLooseDumbbellBar} />
          </View>
        ))}
      </View>

      <View style={[styles.gymFrontBench, styles.gymFloorScenery, { left: frontBench.x - tileWidth * 0.74, top: frontBench.y - tileHeight * 0.36, width: tileWidth * 1.55, height: tileHeight * 0.78 }]}>
        <View style={styles.gymFrontBenchBack} />
        <View style={styles.gymFrontBenchSeat} />
        <View style={[styles.gymFrontBenchLeg, { left: 10 }]} />
        <View style={[styles.gymFrontBenchLeg, { right: 10 }]} />
      </View>
    </View>
  );
}

export function IsometricRoom({ roomType, placements, selectedAnchorId, onSelectAnchor, readOnly = false, i18n }: IsometricRoomProps) {
  const { width } = useWindowDimensions();
  const anchors = ROOM_ANCHORS[roomType];
  const isGym = roomType === 'gym';
  const sceneWidth = Math.min(MAX_SCENE_WIDTH, Math.max(MIN_SCENE_WIDTH, width - 72));
  const sceneHeight = Math.round(sceneWidth * 0.68);
  const tileWidth = sceneWidth / (isGym ? 10.8 : 9.5);
  const tileHeight = tileWidth * TILE_ASPECT_RATIO;
  const originX = sceneWidth / 2;
  const originY = sceneHeight * (isGym ? 0.48 : 0.39);
  const floorWidth = tileWidth * ROOM_GRID_SIZE;
  const wallWidth = floorWidth * WALL_WIDTH_RATIO;
  const wallHeight = sceneHeight * (isGym ? 0.31 : 0.34);
  const wallTop = sceneHeight * 0.08;
  const themeColors = isGym ? gymColors : bedroomColors;
  const floorCenterY = originY + (floorWidth * TILE_ASPECT_RATIO) / 2;

  return (
    <View style={[styles.scene, { width: sceneWidth, height: sceneHeight, backgroundColor: themeColors.floor }]}>
      <View
        pointerEvents="none"
        style={[
          styles.skyBackdrop,
          { height: originY, backgroundColor: themeColors.sky },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.floorShadow,
          {
            left: originX - floorWidth / 2 + 8,
            top: floorCenterY - floorWidth / 2 + 12,
            width: floorWidth,
            height: floorWidth,
            transform: [{ rotate: '45deg' }, { scaleY: TILE_ASPECT_RATIO }],
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.floorPlane,
          {
            left: originX - floorWidth / 2,
            top: floorCenterY - floorWidth / 2,
            width: floorWidth,
            height: floorWidth,
            backgroundColor: themeColors.floor,
            transform: [{ rotate: '45deg' }, { scaleY: TILE_ASPECT_RATIO }],
          },
        ]}
      >
        {Array.from({ length: ROOM_GRID_SIZE - 1 }).map((_, index) => (
          <View key={`floor-v-${index}`} style={[styles.floorGridLineVertical, { left: `${((index + 1) / ROOM_GRID_SIZE) * 100}%` }]} />
        ))}
        {Array.from({ length: ROOM_GRID_SIZE - 1 }).map((_, index) => (
          <View key={`floor-h-${index}`} style={[styles.floorGridLineHorizontal, { top: `${((index + 1) / ROOM_GRID_SIZE) * 100}%` }]} />
        ))}
      </View>
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
      {isGym ? (
        <GymDecor
          tileWidth={tileWidth}
          tileHeight={tileHeight}
          originX={originX}
          originY={originY}
          wallWidth={wallWidth}
          wallHeight={wallHeight}
          wallTop={wallTop}
        />
      ) : (
        <BedroomDecor
          tileWidth={tileWidth}
          tileHeight={tileHeight}
          originX={originX}
          originY={originY}
          wallWidth={wallWidth}
          wallHeight={wallHeight}
          wallTop={wallTop}
        />
      )}
      {anchors.map((anchor) => {
        const placed = placements.find((entry) => entry.anchor_id === anchor.id);
        const projected = projectIso(anchor.x, anchor.y, tileWidth, tileHeight, originX, originY);
        const isWall = anchor.slotType === 'wall';
        const anchorSize = Math.max(24, tileWidth * 0.46);
        const itemSize = Math.max(38, tileWidth * 0.76);
        const left = projected.x - anchorSize / 2;
        const top = isWall ? wallTop + wallHeight * 0.42 + anchor.y * tileHeight * 0.42 : projected.y - anchorSize / 2;
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
              placed ? styles.anchorFilled : styles.anchorEmpty,
              selectedAnchorId === anchor.id ? styles.anchorSelected : null,
            ]}
          >
            {placed ? (
              <View style={styles.placedSprite}>
                <PixelSprite spriteId={resolveSpriteId(placed.item_id)} size={itemSize} />
              </View>
            ) : (
              <Text style={styles.plus}>＋</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const bedroomColors = {
  sky: '#F6EFE4',
  floor: '#DDBF91',
  leftWall: '#C9A981',
  rightWall: '#E5CDA8',
};

const gymColors = {
  sky: '#48B8B2',
  floor: '#BFD8CF',
  leftWall: '#43ADA8',
  rightWall: '#3EA8A3',
};

const styles = StyleSheet.create({
  scene: {
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#E3CDAE',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  floorShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(70, 47, 30, 0.16)',
    borderRadius: 14,
    zIndex: 2,
  },
  skyBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1,
  },
  floorPlane: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(92, 61, 38, 0.22)',
    overflow: 'hidden',
    zIndex: 3,
  },
  floorGridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(92, 61, 38, 0.1)',
  },
  floorGridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(92, 61, 38, 0.1)',
  },
  leftWall: {
    position: 'absolute',
    zIndex: 5,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 8,
    transform: [{ skewY: '-24deg' }],
  },
  rightWall: {
    position: 'absolute',
    zIndex: 5,
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
  decorLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  bedroomLeftWindow: {
    position: 'absolute',
    borderWidth: 5,
    borderColor: '#25282B',
    backgroundColor: '#F8FAF8',
    transform: [{ skewY: '-24deg' }],
    zIndex: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 5, height: 5 },
  },
  bedroomRightWindow: {
    position: 'absolute',
    borderWidth: 5,
    borderColor: '#25282B',
    backgroundColor: '#FBFCFA',
    transform: [{ skewY: '24deg' }],
    zIndex: 18,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 3,
    shadowOffset: { width: -4, height: 5 },
  },
  bedroomWindowRail: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '48%',
    height: 5,
    backgroundColor: '#25282B',
  },
  bedroomMirror: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#7A421D',
    backgroundColor: 'rgba(245,247,245,0.88)',
    transform: [{ skewY: '-24deg' }],
    zIndex: 19,
  },
  bedroomFrameLarge: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#7E351C',
    backgroundColor: '#FFC754',
    transform: [{ skewY: '-24deg' }],
    zIndex: 19,
  },
  bedroomSmallFrame: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#7E351C',
    backgroundColor: '#89C69B',
    transform: [{ skewY: '-24deg' }],
    zIndex: 19,
  },
  bedroomBed: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: '#252729',
    borderWidth: 2,
    borderColor: '#1B1D1F',
    transform: [{ rotate: '26deg' }, { scaleY: 0.76 }],
    zIndex: 34,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 8,
    shadowOffset: { width: 8, height: 8 },
  },
  bedroomBlanket: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 10,
    bottom: 8,
    borderRadius: 6,
    backgroundColor: '#665346',
    borderTopWidth: 3,
    borderTopColor: '#8B7668',
  },
  bedroomPillowA: {
    position: 'absolute',
    right: 18,
    top: -8,
    width: 42,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#BDA79B',
  },
  bedroomPillowB: {
    position: 'absolute',
    right: 62,
    top: -4,
    width: 38,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#B9A195',
  },
  bedroomDresser: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: '#8C4B18',
    borderWidth: 2,
    borderColor: '#67340E',
    transform: [{ rotate: '26deg' }, { scaleY: 0.82 }],
    zIndex: 33,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 7, height: 6 },
  },
  bedroomDrawer: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: '#5D2F0E',
  },
  bedroomSideBench: {
    position: 'absolute',
    zIndex: 33,
    transform: [{ rotate: '26deg' }, { scaleY: 0.78 }],
  },
  bedroomSideBenchTop: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: 1,
    height: 16,
    borderRadius: 6,
    backgroundColor: '#A76B36',
    borderWidth: 2,
    borderColor: '#714018',
  },
  bedroomSideBenchLeg: {
    position: 'absolute',
    bottom: 0,
    width: 6,
    height: 18,
    borderRadius: 3,
    backgroundColor: '#6C3A17',
  },
  bedroomRug: {
    position: 'absolute',
    borderRadius: 3,
    backgroundColor: '#C7B6AA',
    borderWidth: 1,
    borderColor: '#E7DDD5',
    transform: [{ rotate: '26deg' }, { scaleY: 0.62 }],
    zIndex: 29,
  },
  bedroomChair: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: '#52B9A2',
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderColor: '#8A4D21',
    transform: [{ rotate: '26deg' }, { scaleY: 0.7 }],
    zIndex: 32,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 5, height: 5 },
  },
  bedroomDisplayStack: {
    position: 'absolute',
    zIndex: 35,
    transform: [{ rotate: '26deg' }, { scaleY: 0.82 }],
  },
  bedroomDisplayBook: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 8,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(61, 42, 31, 0.28)',
  },
  bedroomArmchair: {
    position: 'absolute',
    zIndex: 34,
    transform: [{ rotate: '26deg' }, { scaleY: 0.74 }],
  },
  bedroomArmchairBack: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: 0,
    height: 20,
    borderRadius: 7,
    backgroundColor: '#48B69F',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderColor: '#8B4F22',
  },
  bedroomArmchairSeat: {
    position: 'absolute',
    left: 11,
    right: 11,
    bottom: 0,
    height: 18,
    borderRadius: 7,
    backgroundColor: '#67C9B6',
  },
  bedroomLowShelf: {
    position: 'absolute',
    zIndex: 34,
    transform: [{ rotate: '26deg' }, { scaleY: 0.78 }],
  },
  bedroomLowShelfTop: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 2,
    height: 14,
    borderRadius: 5,
    backgroundColor: '#7D471F',
    borderWidth: 2,
    borderColor: '#4E2A11',
  },
  bedroomLowShelfBook: {
    position: 'absolute',
    left: 12,
    bottom: 3,
    width: 22,
    height: 8,
    borderRadius: 3,
    backgroundColor: '#F2E8D4',
  },
  bedroomLowShelfBookSecond: {
    left: 38,
    backgroundColor: '#A6CFE3',
  },
  bedroomPlant: {
    position: 'absolute',
    borderBottomWidth: 26,
    borderLeftWidth: 13,
    borderRightWidth: 13,
    borderBottomColor: '#F3A83A',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 31,
  },
  bedroomPlantLeafA: {
    position: 'absolute',
    left: -5,
    top: -38,
    width: 6,
    height: 44,
    borderRadius: 5,
    backgroundColor: '#A6CF79',
    transform: [{ rotate: '-16deg' }],
  },
  bedroomPlantLeafB: {
    position: 'absolute',
    right: -5,
    top: -42,
    width: 6,
    height: 46,
    borderRadius: 5,
    backgroundColor: '#8FC36C',
    transform: [{ rotate: '18deg' }],
  },
  gymWindowWall: {
    position: 'absolute',
    borderWidth: 5,
    borderColor: '#E9FFFF',
    backgroundColor: '#40D8E4',
    transform: [{ skewY: '-18deg' }],
    zIndex: 18,
    overflow: 'hidden',
    shadowColor: '#0B5B5A',
    shadowOpacity: 0.24,
    shadowRadius: 4,
    shadowOffset: { width: 8, height: 8 },
  },
  gymWindowGlare: {
    position: 'absolute',
    left: '52%',
    top: '-18%',
    width: 10,
    height: '150%',
    backgroundColor: 'rgba(255,255,255,0.36)',
    transform: [{ rotate: '18deg' }],
  },
  gymWindowGlareSecond: {
    left: '68%',
    opacity: 0.45,
  },
  gymScoreboard: {
    position: 'absolute',
    borderRadius: 3,
    backgroundColor: '#263A3C',
    borderWidth: 3,
    borderColor: '#46595C',
    transform: [{ skewY: '18deg' }],
    zIndex: 19,
  },
  gymScoreLine: {
    position: 'absolute',
    left: 9,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#F5CA26',
  },
  gymClock: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFDF5',
    borderWidth: 5,
    borderColor: '#806E64',
    transform: [{ skewY: '18deg' }],
    zIndex: 19,
  },
  gymClockHand: {
    position: 'absolute',
    left: '48%',
    top: '18%',
    width: 2,
    height: '36%',
    backgroundColor: '#4B4F4F',
    transform: [{ rotate: '-28deg' }],
  },
  gymPoster: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#E9FFFF',
    backgroundColor: '#2CB9B3',
    transform: [{ skewY: '18deg' }],
    zIndex: 19,
    padding: 6,
  },
  gymPosterTitle: {
    height: 8,
    width: '82%',
    borderRadius: 3,
    backgroundColor: '#FFC32B',
    marginBottom: 7,
  },
  gymPosterBody: {
    height: 26,
    width: '64%',
    borderRadius: 999,
    backgroundColor: '#E44A2F',
    alignSelf: 'center',
  },
  gymWallLadder: {
    position: 'absolute',
    transform: [{ skewY: '18deg' }],
    zIndex: 20,
  },
  gymLadderRail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 5,
    borderRadius: 3,
    backgroundColor: '#EAF4F1',
  },
  gymLadderRung: {
    position: 'absolute',
    left: 1,
    right: 1,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#EAF4F1',
  },
  gymBenchPress: {
    position: 'absolute',
    zIndex: 34,
    transform: [{ rotate: '26deg' }, { scaleY: 0.76 }],
  },
  gymRackUpright: {
    position: 'absolute',
    top: 4,
    bottom: 10,
    width: 5,
    borderRadius: 3,
    backgroundColor: '#F3F5F2',
  },
  gymBarbellBar: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 10,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D3D8D4',
  },
  gymPlateYellow: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1AD16',
    borderWidth: 4,
    borderColor: '#F7C84D',
  },
  gymBenchPad: {
    position: 'absolute',
    left: '26%',
    right: '18%',
    bottom: 14,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#2F3637',
  },
  gymDumbbellRack: {
    position: 'absolute',
    zIndex: 35,
    transform: [{ rotate: '26deg' }, { scaleY: 0.78 }],
  },
  gymRackShelf: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#F1F6F3',
  },
  gymDumbbellDot: {
    position: 'absolute',
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#E5482F',
    borderWidth: 2,
    borderColor: '#F1F6F3',
  },
  gymWeightTower: {
    position: 'absolute',
    zIndex: 32,
    transform: [{ rotate: '26deg' }, { scaleY: 0.78 }],
  },
  gymTowerRail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 5,
    borderRadius: 3,
    backgroundColor: '#F1F6F3',
  },
  gymTowerRung: {
    position: 'absolute',
    left: 5,
    right: 5,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#F1F6F3',
  },
  gymKettlebellRow: {
    position: 'absolute',
    zIndex: 33,
    transform: [{ rotate: '26deg' }, { scaleY: 0.8 }],
  },
  gymKettlebell: {
    position: 'absolute',
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4E5555',
    borderTopWidth: 4,
    borderTopColor: '#303737',
  },
  gymSingleDumbbell: {
    position: 'absolute',
    zIndex: 33,
    transform: [{ rotate: '26deg' }, { scaleY: 0.82 }],
  },
  gymSingleDumbbellPlate: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#52595A',
  },
  gymSingleDumbbellRightPlate: {
    left: 34,
  },
  gymSingleDumbbellBar: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 7,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#EAF1EE',
  },
  gymRightSmallBench: {
    position: 'absolute',
    zIndex: 34,
    transform: [{ rotate: '26deg' }, { scaleY: 0.78 }],
  },
  gymRightSmallBenchPad: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: 2,
    height: 15,
    borderRadius: 6,
    backgroundColor: '#303738',
    borderWidth: 2,
    borderColor: '#EAF1EE',
  },
  gymRightSmallBenchLeg: {
    position: 'absolute',
    bottom: 0,
    width: 5,
    height: 18,
    borderRadius: 3,
    backgroundColor: '#EAF1EE',
  },
  gymSideBench: {
    position: 'absolute',
    zIndex: 34,
    transform: [{ rotate: '26deg' }, { scaleY: 0.78 }],
  },
  gymSideBenchPad: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 2,
    height: 14,
    borderRadius: 5,
    backgroundColor: '#2F3637',
    borderWidth: 2,
    borderColor: '#EAF1EE',
  },
  gymSideBenchLeg: {
    position: 'absolute',
    bottom: 0,
    width: 5,
    height: 20,
    borderRadius: 3,
    backgroundColor: '#EAF1EE',
  },
  gymLooseDumbbells: {
    position: 'absolute',
    zIndex: 35,
    transform: [{ rotate: '26deg' }, { scaleY: 0.82 }],
  },
  gymLooseDumbbell: {
    position: 'absolute',
    width: 28,
    height: 16,
  },
  gymLooseDumbbellPlate: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#4E5555',
  },
  gymLooseDumbbellPlateRight: {
    left: 17,
  },
  gymLooseDumbbellBar: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EAF1EE',
  },
  gymFrontBench: {
    position: 'absolute',
    zIndex: 36,
  },
  gymFrontBenchBack: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 2,
    height: 11,
    borderRadius: 5,
    backgroundColor: '#EAF1EE',
  },
  gymFrontBenchSeat: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 13,
    height: 18,
    borderRadius: 8,
    backgroundColor: '#333A3B',
    borderWidth: 2,
    borderColor: '#EAF1EE',
  },
  gymFrontBenchLeg: {
    position: 'absolute',
    bottom: 0,
    width: 7,
    height: 17,
    borderRadius: 4,
    backgroundColor: '#EAF1EE',
  },
  anchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymFloorScenery: {
    display: 'none',
  },
  anchorEmpty: {
    backgroundColor: 'rgba(255, 249, 238, 0.82)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(106, 87, 71, 0.55)',
  },
  anchorFilled: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  wallAnchor: {
    backgroundColor: 'rgba(255,249,238,0.72)',
  },
  anchorSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    borderStyle: 'solid',
    backgroundColor: 'rgba(255,243,223,0.9)',
  },
  placedSprite: {
    padding: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  plus: {
    color: 'rgba(78,59,44,0.7)',
    fontWeight: '700',
    fontSize: 13,
  },
});
