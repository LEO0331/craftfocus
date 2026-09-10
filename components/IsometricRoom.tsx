import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { PixelSprite } from '@/components/PixelSprite';
import { ROOM_ANCHORS } from '@/constants/roomLayout';
import { ROOM_SPRITES } from '@/constants/roomSprites';
import { resolveSpriteId } from '@/constants/spriteUtils';
import { roomPoint, roomSceneWidth, ROOM_SCENE } from '@/lib/roomGeometry';
import type { RoomType } from '@/types/models';

interface Placement { id: string; anchor_id: string; item_id: string }
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
    daylight?: string;
    evening?: string;
    showSpots?: string;
    hideSpots?: string;
    editHint?: string;
    viewHint?: string;
  };
}

type Point = { x: number; y: number };
// A local 100x100 surface mapped exactly to the room's projected planes.
function Plane({ at, u, v, color, children }: { at: Point; u: Point; v: Point; color: string; children?: ReactNode }) {
  return <View style={{ position: 'absolute', left: at.x, top: at.y, width: 100, height: 100,
    backgroundColor: color, transformOrigin: [0, 0, 0],
    transform: [{ matrix: Platform.OS === 'web'
      ? [u.x / 100, u.y / 100, v.x / 100, v.y / 100, 0, 0]
      : [u.x / 100, u.y / 100, 0, 0, v.x / 100, v.y / 100, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] }],
  }}>{children}</View>;
}

const DAY = {
  bedroom: { backdrop: '#F3EDE1', wall: '#A6B69A', wallLight: '#E7DCC2', trim: '#F9EDCE', floor: '#D1AA7A', edge: '#AD8058', edgeDark: '#916A4B' },
  gym: { backdrop: '#E6EDE7', wall: '#7FA39A', wallLight: '#C4D9C8', trim: '#E8F1D9', floor: '#A6BBB0', edge: '#7C9B8E', edgeDark: '#617F76' },
};
const NIGHT = {
  bedroom: { backdrop: '#252E38', wall: '#647C76', wallLight: '#9D9B86', trim: '#D8C99F', floor: '#9F815F', edge: '#765C46', edgeDark: '#59483B' },
  gym: { backdrop: '#202F37', wall: '#4C7977', wallLight: '#7F9B92', trim: '#B7CDB5', floor: '#738F87', edge: '#4E726C', edgeDark: '#375752' },
};

function Block({ x, y, w, d, h, top, front, side, children }: {
  x: number; y: number; w: number; d: number; h: number;
  top: string; front: string; side: string; children?: ReactNode;
}) {
  return <>
    <Plane at={{ x: x - d, y: y + d / 2 }} u={{ x: w, y: w / 2 }} v={{ x: 0, y: h }} color={front}>{children}</Plane>
    <Plane at={{ x: x + w, y: y + w / 2 }} u={{ x: -d, y: d / 2 }} v={{ x: 0, y: h }} color={side} />
    <Plane at={{ x, y }} u={{ x: w, y: w / 2 }} v={{ x: -d, y: d / 2 }} color={top} />
  </>;
}

// Original room-scale artwork. Inventory thumbnails keep their familiar pixel
// sprites; larger objects gain faces and shadows inside the isometric scene.
function RoomObject({ itemId, size }: { itemId: string; size: number }) {
  const desk = itemId === 'study_desk' || itemId === 'work_desk';
  const modeled = desk || ['plant', 'bookshelf', 'bean_bag', 'floor_rug', 'yoga_mat', 'dumbbell', 'desk_lamp'].includes(itemId);
  if (!modeled) return <PixelSprite spriteId={resolveSpriteId(itemId)} size={size} />;
  return <View style={{ width: size, height: size }}>
    <View style={{ width: 100, height: 100, transformOrigin: [0, 0, 0], transform: [{ scale: size / 100 }] }}>
      {desk && <>
        {[{ x: 20, y: 46 }, { x: 70, y: 67 }, { x: 89, y: 49 }].map((leg, i) => <View key={i} style={{ position: 'absolute', ...{ left: leg.x, top: leg.y }, width: 5, height: 30, backgroundColor: '#816143', borderRightWidth: 2, borderRightColor: '#5F4B38' }} />)}
        <Block x={43} y={25} w={50} d={29} h={7} top="#DBB681" front="#B58455" side="#956941" />
        <Plane at={{ x: 44, y: 28 }} u={{ x: 25, y: 12.5 }} v={{ x: -15, y: 7.5 }} color="#F2E7CE"><View style={{ width: 40, height: '100%', backgroundColor: '#768F7B' }} /></Plane>
        {itemId === 'work_desk' && <>
          <View style={{ position: 'absolute', left: 56, top: 7, width: 28, height: 23, backgroundColor: '#4F6568', borderWidth: 3, borderColor: '#3F4C4B', transform: [{ skewY: '26.565deg' }] }} />
          <View style={{ position: 'absolute', left: 67, top: 29, width: 4, height: 10, backgroundColor: '#64736E' }} />
        </>}
      </>}
      {itemId === 'bookshelf' && <Block x={33} y={8} w={48} d={18} h={59} top="#D3AF79" front="#AA7D50" side="#825C3D">
        {[5, 36, 67].map((top, row) => <View key={top} style={{ position: 'absolute', left: 6, right: 6, top, height: 27, backgroundColor: '#725640', borderBottomWidth: 3, borderBottomColor: '#D3AF79' }}>
          {[0, 1, 2, 3, 4].map((book) => <View key={book} style={{ position: 'absolute', left: 5 + book * 16, bottom: 0, width: 11, height: 16 + (book + row) % 3 * 3, backgroundColor: ['#879E86', '#D8C59A', '#BD785C', '#8CA5AD', '#C9A35E'][(book + row) % 5] }} />)}
        </View>)}
      </Block>}
      {itemId === 'plant' && <>
        <View style={{ position: 'absolute', left: 33, top: 61, width: 35, height: 28, backgroundColor: '#B87955', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderRightWidth: 8, borderRightColor: '#925D45' }} />
        <View style={{ position: 'absolute', left: 31, top: 58, width: 39, height: 10, borderRadius: 12, backgroundColor: '#D3986C', borderWidth: 3, borderColor: '#B77B54' }} />
        <View style={{ position: 'absolute', left: 48, top: 23, height: 42, width: 4, backgroundColor: '#5C7B51' }} />
        {[{ x: 23, y: 31, r: '-40deg', c: '#799A63' }, { x: 48, y: 24, r: '35deg', c: '#527C53' }, { x: 27, y: 12, r: '-35deg', c: '#91AA72' }, { x: 45, y: 2, r: '20deg', c: '#648952' }].map((leaf, i) => <View key={i} style={{ position: 'absolute', left: leaf.x, top: leaf.y, width: 23, height: 34, borderTopLeftRadius: 25, borderBottomRightRadius: 25, transform: [{ rotate: leaf.r }], backgroundColor: leaf.c }} />)}
      </>}
      {itemId === 'bean_bag' && <>
        <View style={{ position: 'absolute', left: 13, top: 44, width: 74, height: 44, borderRadius: 30, backgroundColor: '#AF7950' }} />
        <View style={{ position: 'absolute', left: 22, top: 17, width: 62, height: 64, borderRadius: 28, backgroundColor: '#D5A170', borderRightWidth: 9, borderRightColor: '#C38C5C' }} />
        <View style={{ position: 'absolute', left: 20, top: 50, width: 54, height: 27, borderRadius: 20, backgroundColor: '#E0B783', borderBottomWidth: 3, borderBottomColor: '#B98252' }} />
      </>}
      {(itemId === 'floor_rug' || itemId === 'yoga_mat') && <Plane at={{ x: 36, y: 42 }} u={{ x: 56, y: 28 }} v={{ x: -30, y: 15 }} color={itemId === 'yoga_mat' ? '#577D71' : '#AA6957'}><View style={styles.rugBorder} /></Plane>}
      {itemId === 'dumbbell' && <>
        <View style={{ position: 'absolute', left: 22, top: 48, width: 58, height: 9, borderRadius: 4, backgroundColor: '#A0ABA2', transform: [{ rotate: '26.565deg' }] }} />
        {[{ x: 15, y: 25 }, { x: 67, y: 50 }].map((plate, i) => <View key={i} style={{ position: 'absolute', left: plate.x, top: plate.y, width: 20, height: 32, backgroundColor: '#425E59', borderRadius: 6, borderLeftWidth: 5, borderLeftColor: '#79968B' }} />)}
      </>}
      {itemId === 'desk_lamp' && <>
        <View style={{ position: 'absolute', left: 27, top: 76, width: 47, height: 10, borderRadius: 15, backgroundColor: '#8B754E' }} />
        <View style={{ position: 'absolute', left: 48, top: 29, width: 5, height: 50, backgroundColor: '#BA9E6D' }} />
        <View style={{ position: 'absolute', left: 25, top: 17, width: 51, height: 29, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomWidth: 4, borderBottomColor: '#EFD594', backgroundColor: '#DEB85D' }} />
      </>}
    </View>
  </View>;
}

function Architecture({ roomType, evening }: { roomType: RoomType; evening: boolean }) {
  const colors = (evening ? NIGHT : DAY)[roomType];
  const back = roomPoint(0, 0);
  const left = roomPoint(0, 7);
  const right = roomPoint(7, 0);
  const front = roomPoint(7, 7);
  const h = ROOM_SCENE.wallHeight;
  const isGym = roomType === 'gym';
  return <View style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false}>
    <View style={styles.groundShadow} />
    <Plane at={left} u={{ x: 252, y: 126 }} v={{ x: 0, y: 15 }} color={colors.edge} />
    <Plane at={front} u={{ x: 252, y: -126 }} v={{ x: 0, y: 15 }} color={colors.edgeDark} />
    <Plane at={back} u={{ x: 252, y: 126 }} v={{ x: -252, y: 126 }} color={colors.floor}>
      {Array.from({ length: 12 }, (_, index) => <View key={index} style={{ position: 'absolute', top: index * 100 / 12, width: '100%', height: 100 / 12,
        backgroundColor: index % 3 === 0 ? '#FFFFFF10' : 'transparent', borderBottomWidth: 0.3, borderBottomColor: '#49372125' }}>
        {[0, 1, 2].map((seam) => <View key={seam} style={{ position: 'absolute', left: `${(seam * 33 + (index % 2) * 16) % 100}%`, height: '100%', width: 0.25, backgroundColor: '#49372125' }} />)}
      </View>)}
    </Plane>
    <Plane at={back} u={{ x: 252, y: 126 }} v={{ x: -8, y: 4 }} color="#23312618" />
    <Plane at={back} u={{ x: -252, y: 126 }} v={{ x: 8, y: 4 }} color="#23312618" />
    <Plane at={{ x: back.x, y: back.y - h }} u={{ x: -252, y: 126 }} v={{ x: 0, y: h }} color={colors.wall}>
      <View style={[styles.wallBaseboard, { backgroundColor: colors.trim }]} />
      {Array.from({ length: 9 }, (_, i) => <View key={i} style={{ position: 'absolute', left: 7 + i * 11, top: 0, width: 0.35, height: '96%', backgroundColor: '#FFFFFF12' }} />)}
      <View style={[styles.window, { backgroundColor: evening ? '#344B65' : '#CBE5D8' }]}>
        <View style={[styles.windowHill, { backgroundColor: evening ? '#486779' : '#9BC3AD' }]} />
        <View style={[styles.windowSun, { backgroundColor: evening ? '#FFF1C3' : '#FFF9D4' }]} />
        <View style={styles.windowVertical} /><View style={styles.windowHorizontal} />
      </View>
      <View style={styles.windowSill} />
      <View style={[styles.curtain, { backgroundColor: evening ? '#AFB7A0' : '#EBE5CE' }]} />
    </Plane>
    <Plane at={{ x: back.x, y: back.y - h }} u={{ x: 252, y: 126 }} v={{ x: 0, y: h }} color={colors.wallLight}>
      <View style={[styles.wallBaseboard, { backgroundColor: colors.trim }]} />
      <View style={styles.wallArt}>
        <View style={[styles.artSky, { backgroundColor: isGym ? '#A9C5C0' : '#E9BD8A' }]} />
        <View style={styles.artSun} />
        <View style={[styles.artHill, { backgroundColor: isGym ? '#46756D' : '#738F75' }]} />
      </View>
      <View style={styles.shelf} />
      {[0, 1, 2, 3, 4].map((i) => <View key={i} style={{ position: 'absolute', left: 24 + i * 3.5, top: 56 - i % 2 * 3, width: 2.8, height: 13 + i % 2 * 3,
        backgroundColor: ['#B86D55', '#EBD6AB', '#698878', '#7F989C', '#C9A365'][i], borderRadius: 0.4 }} />)}
      <View style={styles.shelfPot} /><View style={styles.shelfLeaf} />
      <View style={[styles.wallClock, { backgroundColor: colors.trim }]}><View style={styles.clockHand} /><View style={styles.clockMinute} /></View>
      {isGym && <View style={styles.gymPlaque}><Text style={styles.gymPlaqueText}>BREATHE</Text></View>}
    </Plane>
    <Plane at={{ x: back.x, y: back.y - h - 7 }} u={{ x: -252, y: 126 }} v={{ x: 0, y: 7 }} color={colors.trim} />
    <Plane at={{ x: back.x, y: back.y - h - 7 }} u={{ x: 252, y: 126 }} v={{ x: 0, y: 7 }} color={colors.trim} />
    <View style={{ position: 'absolute', left: left.x - 5, top: left.y - h, width: 5, height: h, backgroundColor: colors.trim }} />
    <View style={{ position: 'absolute', left: right.x, top: right.y - h, width: 5, height: h, backgroundColor: colors.edge }} />
    <Plane at={roomPoint(0.5, 2)} u={{ x: 94, y: 47 }} v={{ x: -58, y: 29 }} color={evening ? '#F3CA7620' : '#FFF4BF45'}>
      <View style={styles.lightCross} /><View style={styles.lightRail} />
    </Plane>
    <Plane at={roomPoint(2.5, 2.9)} u={{ x: 114, y: 57 }} v={{ x: -89, y: 44.5 }} color={isGym ? '#587F78' : '#B7785D'}>
      <View style={styles.rugBorder} />
      {[22, 38, 54, 70].map((y) => <View key={y} style={{ position: 'absolute', left: 12, right: 12, top: y, height: 1, backgroundColor: '#F4E0BC40' }} />)}
    </Plane>
  </View>;
}

export function IsometricRoom({ roomType, placements, selectedAnchorId, onSelectAnchor, readOnly = false, i18n }: IsometricRoomProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [availableWidth, setAvailableWidth] = useState(roomSceneWidth(windowWidth - 96));
  const [evening, setEvening] = useState(false);
  const [showSpots, setShowSpots] = useState(true);
  const [focusedAnchor, setFocusedAnchor] = useState<string | null>(null);
  const colors = (evening ? NIGHT : DAY)[roomType];
  const width = roomSceneWidth(availableWidth);
  const scale = width / ROOM_SCENE.width;
  const anchors = ROOM_ANCHORS[roomType];
  const editing = !readOnly && showSpots;
  const wallAnchors = anchors.filter((anchor) => anchor.slotType === 'wall');
  const selected = editing ? anchors.find((a) => a.id === selectedAnchorId) : undefined;
  const selectedItem = selected && placements.find((p) => p.anchor_id === selected.id);

  return <View testID="isometric-room" style={styles.wrap} onLayout={(event) => setAvailableWidth(event.nativeEvent.layout.width)}>
    <View style={styles.toolbar}>
      <View style={styles.lightingGroup}>
        {[false, true].map((night) => <Pressable key={String(night)} onPress={() => setEvening(night)}
          accessibilityRole="button" accessibilityState={{ selected: evening === night }}
          accessibilityLabel={night ? i18n?.evening ?? 'Evening' : i18n?.daylight ?? 'Daylight'}
          style={[styles.tool, evening === night && styles.toolActive]}>
          <Text style={[styles.toolText, evening === night && styles.toolTextActive]}>{night ? '☾' : '☀'} {night ? i18n?.evening ?? 'Evening' : i18n?.daylight ?? 'Daylight'}</Text>
        </Pressable>)}
      </View>
      {!readOnly && <Pressable onPress={() => setShowSpots(!showSpots)} accessibilityRole="button" accessibilityState={{ selected: showSpots }} style={styles.guideTool}>
        <Text style={styles.guideText}>{showSpots ? i18n?.hideSpots ?? 'Hide spots' : i18n?.showSpots ?? 'Show spots'}</Text>
      </Pressable>}
    </View>
    <View testID="room-canvas" style={[styles.canvas, { height: width * ROOM_SCENE.height / ROOM_SCENE.width, backgroundColor: colors.backdrop }]}>
      <View style={{ width: ROOM_SCENE.width, height: ROOM_SCENE.height, transformOrigin: [0, 0, 0], transform: [{ scale }] }}>
        <Architecture roomType={roomType} evening={evening} />
        {anchors.map((anchor) => {
          const placed = placements.find((p) => p.anchor_id === anchor.id);
          if (!placed && !editing) return null;
          const isWall = anchor.slotType === 'wall';
          const wallIndex = wallAnchors.findIndex((a) => a.id === anchor.id);
          const point = isWall
            ? (wallIndex === 0 ? roomPoint(0, 1.2, 48) : roomPoint(wallIndex === 1 ? 3.4 : 5.8, 0, 30))
            : roomPoint(anchor.x, anchor.y);
          const active = editing && selectedAnchorId === anchor.id;
          const spriteId = placed ? resolveSpriteId(placed.item_id) : null;
          const large = placed && ['study_desk', 'work_desk', 'bookshelf', 'bean_bag'].includes(placed.item_id);
          const size = large ? 90 : 68;
          const hitSize = Math.max(44 / scale, size);
          const label = placed ? i18n?.anchorFilled(anchor.id, placed.item_id) ?? `Anchor ${anchor.id} has ${placed.item_id}` : i18n?.anchorEmpty(anchor.id) ?? `Anchor ${anchor.id} empty`;
          return <Pressable key={anchor.id} testID={`room-anchor-${anchor.id}`} onPress={() => onSelectAnchor(anchor.id)}
            onFocus={() => setFocusedAnchor(anchor.id)} onBlur={() => setFocusedAnchor(null)}
            disabled={!editing} accessibilityRole={editing ? 'button' : 'image'} accessibilityLabel={label}
            accessibilityState={{ selected: active, disabled: !editing }}
            accessibilityHint={editing ? i18n?.anchorHintEditable : i18n?.anchorHintReadonly}
            style={({ pressed }) => [{ position: 'absolute', left: point.x - hitSize / 2, top: point.y - hitSize + 12,
              width: hitSize, height: hitSize, alignItems: 'center', justifyContent: 'flex-end',
              zIndex: isWall ? 1 : 100 + Math.round(point.y), opacity: pressed ? 0.8 : 1 }, focusedAnchor === anchor.id && styles.anchorFocus]}>
            {!isWall && <View style={[styles.itemShadow, { width: placed ? size * 0.7 : 28, backgroundColor: active ? '#EAA65480' : placed ? '#3C312935' : '#FFFFFF38' }]} />}
            {placed && spriteId ? <View style={{ marginBottom: 5, transform: [{ translateY: active ? -5 : 0 }] }}>
              <RoomObject itemId={placed.item_id} size={size} />
            </View> : <View style={[styles.spot, { borderColor: active ? '#BC643D' : evening ? '#E0D2B67A' : '#715E414A', backgroundColor: active ? '#FFE8B5' : evening ? '#FFF2CA18' : '#FFF7DF80' }]}>
              <Text style={[styles.spotText, { color: active ? '#843E27' : evening ? '#E7DDCB' : '#756145' }]}>{active ? '✓' : '+'}</Text>
            </View>}
            {active && <View style={styles.selectedDot} />}
          </Pressable>;
        })}
      </View>
    </View>
    <View style={styles.caption}>
      <View style={[styles.captionDot, { backgroundColor: editing ? '#6D8F6D' : '#B89560' }]} />
      <Text style={styles.captionText}>{selectedItem ? ROOM_SPRITES[resolveSpriteId(selectedItem.item_id)].name
        : editing ? i18n?.editHint ?? 'Choose a spot. Make it yours.' : i18n?.viewHint ?? 'A little room, made by you.'}</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: 8 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  lightingGroup: { flexDirection: 'row', backgroundColor: '#EEE5D4', padding: 3, borderRadius: 14 },
  tool: { paddingHorizontal: 10, minHeight: 44, justifyContent: 'center', borderRadius: 11 },
  toolActive: { backgroundColor: '#FFF9EF' },
  toolText: { fontSize: 12, color: '#796951', fontWeight: '600' },
  toolTextActive: { color: '#493C29', fontWeight: '800' },
  guideTool: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  guideText: { color: '#746046', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
  canvas: { width: '100%', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#D8CCB5' },
  groundShadow: { position: 'absolute', width: 330, height: 44, left: 135, top: 394, borderRadius: 100, backgroundColor: '#1527190D' },
  wallBaseboard: { position: 'absolute', bottom: 0, height: 4, width: '100%' },
  window: { position: 'absolute', left: 37, top: 16, width: 42, height: 52, borderWidth: 2.2, borderColor: '#F9EED3', overflow: 'hidden' },
  windowHill: { position: 'absolute', width: 57, height: 30, bottom: -17, left: -8, borderRadius: 25, transform: [{ rotate: '-12deg' }] },
  windowSun: { position: 'absolute', width: 9, height: 13, borderRadius: 10, right: 6, top: 6 },
  windowVertical: { position: 'absolute', left: '48%', top: 0, bottom: 0, width: 1.5, backgroundColor: '#F9EED3' },
  windowHorizontal: { position: 'absolute', top: '52%', left: 0, right: 0, height: 1.5, backgroundColor: '#F9EED3' },
  windowSill: { position: 'absolute', left: 34, top: 68, width: 49, height: 4, backgroundColor: '#E9D7AC', borderBottomWidth: 1.5, borderBottomColor: '#8F9878' },
  curtain: { position: 'absolute', left: 77, top: 13, width: 7, height: 60, borderRadius: 1, borderLeftWidth: 1, borderLeftColor: '#CDD0AF' },
  wallArt: { position: 'absolute', left: 17, top: 15, width: 23, height: 29, backgroundColor: '#F5E9D0', borderWidth: 2, borderColor: '#937453', overflow: 'hidden' },
  artSky: { position: 'absolute', top: 2, left: 2, right: 2, bottom: 2 },
  artSun: { position: 'absolute', top: 6, right: 5, width: 6, height: 8, borderRadius: 8, backgroundColor: '#FAE7BA' },
  artHill: { position: 'absolute', width: 30, height: 20, bottom: -8, left: -8, transform: [{ rotate: '-20deg' }] },
  shelf: { position: 'absolute', left: 20, top: 69, width: 38, height: 3, backgroundColor: '#A57850', borderTopWidth: 1, borderTopColor: '#D0A777' },
  shelfPot: { position: 'absolute', left: 48, top: 62, width: 5, height: 7, backgroundColor: '#CA8461', borderRadius: 1 },
  shelfLeaf: { position: 'absolute', left: 45, top: 52, width: 11, height: 13, backgroundColor: '#5C8268', borderRadius: 7, transform: [{ rotate: '-15deg' }] },
  wallClock: { position: 'absolute', left: 73, top: 18, width: 13, height: 22, borderRadius: 12, borderWidth: 1.3, borderColor: '#9B8060' },
  clockHand: { position: 'absolute', left: 5, top: 4, height: 7, width: 0.8, backgroundColor: '#635943' },
  clockMinute: { position: 'absolute', left: 5, top: 10, height: 0.8, width: 4, backgroundColor: '#635943' },
  gymPlaque: { position: 'absolute', left: 62, top: 58, width: 29, height: 13, backgroundColor: '#477267', borderRadius: 1, justifyContent: 'center', alignItems: 'center' },
  gymPlaqueText: { fontSize: 4, fontWeight: '800', color: '#E2E7CA', letterSpacing: 0.4 },
  lightCross: { position: 'absolute', left: 47, width: 5, height: '100%', backgroundColor: '#987A4C25' },
  lightRail: { position: 'absolute', top: 45, height: 5, width: '100%', backgroundColor: '#987A4C25' },
  rugBorder: { position: 'absolute', top: 5, bottom: 5, left: 5, right: 5, borderWidth: 1.4, borderColor: '#EFD8AC90', borderRadius: 4 },
  itemShadow: { position: 'absolute', height: 12, borderRadius: 50, bottom: 0 },
  spot: { width: 26, height: 20, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  spotText: { fontSize: 16, lineHeight: 19, fontWeight: '500' },
  selectedDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', bottom: -3, backgroundColor: '#BA613D' },
  anchorFocus: { borderWidth: 2, borderColor: '#9D5738', borderRadius: 12 },
  caption: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  captionDot: { width: 5, height: 5, borderRadius: 3 },
  captionText: { fontSize: 12, color: '#79674E', flexShrink: 1 },
});
