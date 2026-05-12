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

function projectIso(gridX: number, gridY: number, tileWidth: number, tileHeight: number, originX: number, originY: number) {
  return {
    x: originX + (gridX - gridY) * (tileWidth / 2),
    y: originY + (gridX + gridY) * (tileHeight / 2),
  };
}

function BedroomDecor({ sceneWidth, sceneHeight, tileWidth, tileHeight, originX, originY, wallWidth, wallHeight, wallTop }: RoomDecorProps) {
  const bed = projectIso(3.55, 2.75, tileWidth, tileHeight, originX, originY);
  const dresser = projectIso(0.8, 2.9, tileWidth, tileHeight, originX, originY);
  const sideBench = projectIso(1.45, 3.55, tileWidth, tileHeight, originX, originY);
  const rug = projectIso(3.8, 3.55, tileWidth, tileHeight, originX, originY);
  const chair = projectIso(2.8, 4.05, tileWidth, tileHeight, originX, originY);
  const displayStack = projectIso(5.25, 3.25, tileWidth, tileHeight, originX, originY);
  const armchair = projectIso(1.05, 4.75, tileWidth, tileHeight, originX, originY);
  const lowShelf = projectIso(5.45, 4.25, tileWidth, tileHeight, originX, originY);

  return (
    <View pointerEvents="none" style={styles.decorLayer}>
      <View style={[styles.bedroomLeftWindow, { left: originX - wallWidth * 0.66, top: wallTop + wallHeight * 0.2, width: wallWidth * 0.34, height: wallHeight * 0.42 }]}>
        <View style={styles.bedroomWindowRail} />
      </View>
      <View style={[styles.bedroomMirror, { left: originX - wallWidth * 0.96, top: wallTop + wallHeight * 0.35, width: wallWidth * 0.18, height: wallHeight * 0.48 }]} />
      <View style={[styles.bedroomFrameLarge, { left: originX - wallWidth * 0.24, top: wallTop + wallHeight * 0.2, width: wallWidth * 0.18, height: wallHeight * 0.34 }]} />
      {[0, 1, 2, 3].map((index) => (
        <View
          key={index}
          style={[
            styles.bedroomSmallFrame,
            {
              left: originX - wallWidth * (0.04 - (index % 2) * 0.16),
              top: wallTop + wallHeight * (0.16 + Math.floor(index / 2) * 0.24),
              width: wallWidth * 0.12,
              height: wallHeight * 0.12,
            },
          ]}
        />
      ))}
      <View style={[styles.bedroomRightWindow, { left: originX + wallWidth * 0.36, top: wallTop + wallHeight * 0.22, width: wallWidth * 0.34, height: wallHeight * 0.38 }]}>
        <View style={styles.bedroomWindowRail} />
      </View>

      <View style={[styles.bedroomBed, { left: bed.x - tileWidth * 1.35, top: bed.y - tileHeight * 0.92, width: tileWidth * 2.9, height: tileHeight * 1.35 }]}>
        <View style={styles.bedroomBlanket} />
        <View style={styles.bedroomPillowA} />
        <View style={styles.bedroomPillowB} />
      </View>
      <View style={[styles.bedroomDresser, { left: dresser.x - tileWidth * 0.75, top: dresser.y - tileHeight * 0.78, width: tileWidth * 1.45, height: tileHeight * 1.52 }]}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={[styles.bedroomDrawer, { top: tileHeight * (0.3 + index * 0.34) }]} />
        ))}
      </View>
      <View style={[styles.bedroomSideBench, { left: sideBench.x - tileWidth * 0.8, top: sideBench.y - tileHeight * 0.32, width: tileWidth * 1.65, height: tileHeight * 0.62 }]}>
        <View style={styles.bedroomSideBenchTop} />
        <View style={[styles.bedroomSideBenchLeg, { left: tileWidth * 0.18 }]} />
        <View style={[styles.bedroomSideBenchLeg, { right: tileWidth * 0.18 }]} />
      </View>
      <View style={[styles.bedroomRug, { left: rug.x - tileWidth * 0.9, top: rug.y - tileHeight * 0.2, width: tileWidth * 1.8, height: tileHeight * 0.75 }]} />
      <View style={[styles.bedroomChair, { left: chair.x - tileWidth * 0.7, top: chair.y - tileHeight * 0.28, width: tileWidth * 1.4, height: tileHeight * 0.82 }]} />
      <View style={[styles.bedroomDisplayStack, { left: displayStack.x - tileWidth * 0.32, top: displayStack.y - tileHeight * 0.5, width: tileWidth * 0.72, height: tileHeight * 1.18 }]}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={[styles.bedroomDisplayBook, { bottom: tileHeight * (0.1 + index * 0.2), backgroundColor: ['#F6E7CE', '#A7C8D8', '#E6B85B'][index] }]} />
        ))}
      </View>
      <View style={[styles.bedroomArmchair, { left: armchair.x - tileWidth * 0.48, top: armchair.y - tileHeight * 0.38, width: tileWidth * 1.04, height: tileHeight * 0.82 }]}>
        <View style={styles.bedroomArmchairBack} />
        <View style={styles.bedroomArmchairSeat} />
      </View>
      <View style={[styles.bedroomLowShelf, { left: lowShelf.x - tileWidth * 0.6, top: lowShelf.y - tileHeight * 0.3, width: tileWidth * 1.25, height: tileHeight * 0.78 }]}>
        <View style={styles.bedroomLowShelfTop} />
        <View style={styles.bedroomLowShelfBook} />
        <View style={[styles.bedroomLowShelfBook, styles.bedroomLowShelfBookSecond]} />
      </View>
      <View style={[styles.bedroomPlant, { left: originX - tileWidth * 0.1, top: wallTop + wallHeight * 0.55, width: tileWidth * 0.46, height: tileHeight * 1.1 }]}>
        <View style={styles.bedroomPlantLeafA} />
        <View style={styles.bedroomPlantLeafB} />
      </View>
    </View>
  );
}

function GymDecor({ sceneWidth, sceneHeight, tileWidth, tileHeight, originX, originY, wallWidth, wallHeight, wallTop }: RoomDecorProps) {
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

      <View style={[styles.gymDumbbellRack, { left: dumbbellRack.x - tileWidth * 0.45, top: dumbbellRack.y - tileHeight * 0.25, width: tileWidth * 1.3, height: tileHeight * 1.25 }]}>
        {[0, 1, 2].map((shelf) => (
          <View key={shelf} style={[styles.gymRackShelf, { top: tileHeight * (0.22 + shelf * 0.27) }]} />
        ))}
        {[0, 1, 2, 3, 4, 5].map((dot) => (
          <View key={dot} style={[styles.gymDumbbellDot, { left: tileWidth * (0.18 + (dot % 3) * 0.28), top: tileHeight * (0.15 + Math.floor(dot / 3) * 0.38) }]} />
        ))}
      </View>

      <View style={[styles.gymWeightTower, { left: rack.x - tileWidth * 0.48, top: rack.y - tileHeight * 0.92, width: tileWidth * 0.95, height: tileHeight * 2.05 }]}>
        <View style={[styles.gymTowerRail, { left: 4 }]} />
        <View style={[styles.gymTowerRail, { right: 4 }]} />
        {[0, 1, 2, 3].map((rung) => (
          <View key={rung} style={[styles.gymTowerRung, { top: tileHeight * (0.32 + rung * 0.36) }]} />
        ))}
      </View>

      <View style={[styles.gymKettlebellRow, { left: kettlebells.x - tileWidth * 0.4, top: kettlebells.y - tileHeight * 0.08, width: tileWidth * 1.3, height: tileHeight * 0.58 }]}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={[styles.gymKettlebell, { left: tileWidth * (0.05 + index * 0.38) }]} />
        ))}
      </View>

      <View style={[styles.gymSingleDumbbell, { left: leftDumbbell.x - tileWidth * 0.42, top: leftDumbbell.y - tileHeight * 0.06, width: tileWidth * 0.9, height: tileHeight * 0.44 }]}>
        <View style={styles.gymSingleDumbbellPlate} />
        <View style={[styles.gymSingleDumbbellPlate, styles.gymSingleDumbbellRightPlate]} />
        <View style={styles.gymSingleDumbbellBar} />
      </View>

      <View style={[styles.gymRightSmallBench, { left: rightBench.x - tileWidth * 0.75, top: rightBench.y - tileHeight * 0.25, width: tileWidth * 1.55, height: tileHeight * 0.56 }]}>
        <View style={styles.gymRightSmallBenchPad} />
        <View style={[styles.gymRightSmallBenchLeg, { left: tileWidth * 0.2 }]} />
        <View style={[styles.gymRightSmallBenchLeg, { right: tileWidth * 0.2 }]} />
      </View>

      <View style={[styles.gymSideBench, { left: sideBench.x - tileWidth * 0.85, top: sideBench.y - tileHeight * 0.34, width: tileWidth * 1.7, height: tileHeight * 0.58 }]}>
        <View style={styles.gymSideBenchPad} />
        <View style={[styles.gymSideBenchLeg, { left: tileWidth * 0.18 }]} />
        <View style={[styles.gymSideBenchLeg, { right: tileWidth * 0.18 }]} />
      </View>

      <View style={[styles.gymLooseDumbbells, { left: rightDumbbells.x - tileWidth * 0.52, top: rightDumbbells.y - tileHeight * 0.1, width: tileWidth * 1.15, height: tileHeight * 0.72 }]}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={[styles.gymLooseDumbbell, { left: tileWidth * (0.02 + index * 0.34), top: tileHeight * (0.08 + (index % 2) * 0.18) }]}>
            <View style={styles.gymLooseDumbbellPlate} />
            <View style={[styles.gymLooseDumbbellPlate, styles.gymLooseDumbbellPlateRight]} />
            <View style={styles.gymLooseDumbbellBar} />
          </View>
        ))}
      </View>

      <View style={[styles.gymFrontBench, { left: frontBench.x - tileWidth * 0.74, top: frontBench.y - tileHeight * 0.36, width: tileWidth * 1.55, height: tileHeight * 0.78 }]}>
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
  const sceneHeight = Math.round(sceneWidth * (isGym ? 0.72 : 0.72));
  const tileWidth = sceneWidth / (isGym ? 10.8 : 9.5);
  const tileHeight = tileWidth * TILE_ASPECT_RATIO;
  const originX = sceneWidth / 2;
  const originY = sceneHeight * (isGym ? 0.58 : 0.61);
  const floorWidth = tileWidth * ROOM_GRID_SIZE;
  const wallWidth = floorWidth * WALL_WIDTH_RATIO;
  const wallHeight = sceneHeight * (isGym ? 0.4 : 0.46);
  const wallTop = isGym ? sceneHeight * 0.08 : sceneHeight * 0.08;
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
      ) : (
        <BedroomDecor
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
      )}
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
  sky: '#F8F5EF',
  leftWall: '#8F8378',
  rightWall: '#9B99D0',
  floor: '#5F605D',
  grid: 'rgba(255,255,255,0.08)',
};

const gymColors = {
  sky: '#48B8B2',
  leftWall: '#43ADA8',
  rightWall: '#3EA8A3',
  floor: '#319B98',
  grid: 'rgba(238, 252, 255, 0.18)',
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
  gymCardioMat: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: '#E9C789',
    borderWidth: 2,
    borderColor: '#F2B72D',
    transform: [{ rotate: '26deg' }, { scaleY: 0.6 }],
    zIndex: 29,
  },
  gymMatStripe: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.38)',
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
  gymBike: {
    position: 'absolute',
    zIndex: 36,
    transform: [{ scaleY: 0.92 }],
  },
  gymBikeWheel: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 5,
    borderColor: '#EAF1EE',
    backgroundColor: '#AAB5B2',
  },
  gymBikeBase: {
    position: 'absolute',
    left: 18,
    right: 16,
    bottom: 14,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EAF1EE',
  },
  gymBikeSeat: {
    position: 'absolute',
    left: '39%',
    top: 12,
    width: 26,
    height: 9,
    borderRadius: 4,
    backgroundColor: '#2B3032',
  },
  gymBikeHandle: {
    position: 'absolute',
    right: 2,
    top: 8,
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EAF1EE',
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
