import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PixelSprite } from '@/components/PixelSprite';
import { RoomGrid } from '@/components/RoomGrid';
import { ROOM_SPRITES } from '@/constants/roomSprites';
import { resolveSpriteId } from '@/constants/spriteUtils';
import { theme } from '@/constants/theme';
import { useRoom } from '@/hooks/useRoom';

export default function RoomScreen() {
  const { roomGridItems, inventory, unlockedInventory, placeItem, clearCell } = useRoom();

  const [selectedUserItemId, setSelectedUserItemId] = useState<string | null>(unlockedInventory[0]?.id ?? null);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number; roomItemId?: string } | null>(null);

  const selectedItemInfo = useMemo(
    () => unlockedInventory.find((item) => item.id === selectedUserItemId) ?? null,
    [unlockedInventory, selectedUserItemId]
  );

  useEffect(() => {
    if (!selectedUserItemId && unlockedInventory.length) {
      setSelectedUserItemId(unlockedInventory[0].id);
    }
  }, [selectedUserItemId, unlockedInventory]);

  const handleCellPress = async (cell: { x: number; y: number; item?: { id: string } }) => {
    setSelectedCell({ x: cell.x, y: cell.y, roomItemId: cell.item?.id });

    if (!selectedUserItemId || !selectedItemInfo) {
      return;
    }

    try {
      await placeItem({ userItemId: selectedUserItemId, x: cell.x, y: cell.y });
    } catch (error) {
      Alert.alert('Place item failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleClear = async () => {
    if (!selectedCell?.roomItemId) {
      return;
    }

    try {
      await clearCell(selectedCell.roomItemId);
      setSelectedCell(null);
    } catch (error) {
      Alert.alert('Remove item failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>My Focus Room</Text>

      <Card>
        <Text style={styles.label}>Room Layout (tap a cell to place selected item)</Text>
        <RoomGrid
          items={roomGridItems}
          selectedCell={selectedCell ? { x: selectedCell.x, y: selectedCell.y } : null}
          onCellPress={handleCellPress}
        />

        <Button label="Remove Item At Selected Cell" onPress={handleClear} variant="danger" />
      </Card>

      <Card>
        <Text style={styles.label}>Unlocked Inventory</Text>
        <View style={styles.inventoryWrap}>
          {unlockedInventory.length ? (
            unlockedInventory.map((item) => {
              const active = item.id === selectedUserItemId;
              const spriteId = resolveSpriteId(item.item_id);
              return (
                <View key={item.id} style={[styles.inventoryCard, active ? styles.inventoryCardActive : null]}>
                  <PixelSprite spriteId={spriteId} size={30} />
                  <Text style={styles.inventoryName}>{ROOM_SPRITES[spriteId].name}</Text>
                  <Text style={styles.inventoryMeta}>progress: {item.progress}%</Text>
                  <Button
                    label={active ? 'Selected' : 'Select'}
                    onPress={() => setSelectedUserItemId(item.id)}
                    variant={active ? 'primary' : 'secondary'}
                  />
                </View>
              );
            })
          ) : (
            <Text style={styles.text}>No unlocked items yet. Complete focus sessions to unlock furniture.</Text>
          )}
        </View>
        <Text style={styles.text}>Total items tracked: {inventory.length}</Text>
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
  label: { color: theme.colors.muted, fontWeight: '600', fontFamily: theme.typography.body },
  text: { color: theme.colors.muted, fontFamily: theme.typography.body },
  inventoryWrap: {
    gap: 8,
  },
  inventoryCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 10,
    gap: 6,
    backgroundColor: '#FCF8EE',
  },
  inventoryCardActive: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: '#EEF7EC',
  },
  inventoryName: {
    color: theme.colors.text,
    fontWeight: '700',
    fontFamily: theme.typography.body,
  },
  inventoryMeta: {
    color: theme.colors.muted,
    fontSize: 12,
    fontFamily: theme.typography.body,
  },
});
