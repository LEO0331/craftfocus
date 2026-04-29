import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IsometricRoom } from '@/components/IsometricRoom';
import { PixelSprite } from '@/components/PixelSprite';
import { ROOM_SPRITES } from '@/constants/roomSprites';
import { resolveSpriteId } from '@/constants/spriteUtils';
import { theme } from '@/constants/theme';
import { useRoom } from '@/hooks/useRoom';
import { useI18n } from '@/hooks/useI18n';
import type { BuildTargetId, RoomType } from '@/types/models';

const ROOM_TYPES: RoomType[] = ['bedroom', 'gym'];

export default function RoomScreen() {
  const { roomType, placements, inventory, inventoryByItem, placeAtAnchor, removePlacementAtAnchor, switchRoomType } = useRoom();
  const { t } = useI18n();
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<BuildTargetId>('plant');

  const selectedPlacement = useMemo(
    () => (selectedAnchorId ? placements.find((entry) => entry.anchor_id === selectedAnchorId) ?? null : null),
    [placements, selectedAnchorId]
  );

  const quantity = inventoryByItem.get(selectedItemId) ?? 0;

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
        <Text style={styles.label}>{t('room.isometric')}</Text>
        <IsometricRoom roomType={roomType} placements={placements} selectedAnchorId={selectedAnchorId} onSelectAnchor={setSelectedAnchorId} />
        <Text style={styles.text}>
          {t('room.selectedAnchor', {
            anchor: selectedAnchorId ?? 'none',
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
                  label={active ? 'Selected' : 'Select'}
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
        <Button label="Remove Item At Selected Anchor" onPress={handleRemove} variant="danger" disabled={!selectedPlacement} />
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
});
