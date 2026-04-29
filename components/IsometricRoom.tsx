import { Pressable, StyleSheet, Text, View } from 'react-native';

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
}

export function IsometricRoom({ roomType, placements, selectedAnchorId, onSelectAnchor }: IsometricRoomProps) {
  const anchors = ROOM_ANCHORS[roomType];

  return (
    <View style={[styles.scene, roomType === 'gym' ? styles.gymScene : null]}>
      <View style={styles.backWall} />
      <View style={styles.floor} />
      {anchors.map((anchor) => {
        const placed = placements.find((entry) => entry.anchor_id === anchor.id);
        return (
          <Pressable
            key={anchor.id}
            onPress={() => onSelectAnchor(anchor.id)}
            style={[
              styles.anchor,
              {
                left: anchor.x,
                top: anchor.y,
                zIndex: anchor.zIndex,
              },
              selectedAnchorId === anchor.id ? styles.anchorSelected : null,
            ]}
          >
            {placed ? <PixelSprite spriteId={resolveSpriteId(placed.item_id)} size={34} /> : <Text style={styles.plus}>+</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    width: 380,
    height: 320,
    borderRadius: 24,
    backgroundColor: '#31BDD4',
    overflow: 'hidden',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#D6EDF2',
  },
  gymScene: {
    backgroundColor: '#3FA38E',
  },
  backWall: {
    position: 'absolute',
    left: 20,
    top: 20,
    right: 20,
    height: 130,
    backgroundColor: '#8DB6E8',
    borderRadius: 14,
  },
  floor: {
    position: 'absolute',
    left: 15,
    right: 15,
    bottom: 15,
    height: 180,
    backgroundColor: '#CAE7EF',
    borderRadius: 18,
  },
  anchor: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86A9C4',
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
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
