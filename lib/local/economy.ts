import { FOCUS_DURATIONS, FOCUS_MODES } from '@/constants/categories';
import { ITEM_CATALOG_SEED, OFFICIAL_ITEM_COST } from '@/constants/itemCatalog';
import { ROOM_ANCHORS } from '@/constants/roomLayout';
import { LOCAL_USER_ID } from '@/lib/data-mode';
import { getFocusReward } from '@/lib/focusRewards';
import {
  LOCAL_ANIMAL_CATALOG, LOCAL_ROOM_ID, request, withLocalTransaction,
  type LocalFocusRun, type LocalInventory, type LocalPlacement, type LocalProfile,
  type LocalRoom, type LocalWallet,
} from '@/lib/local/database';
import type { AnimalId, FocusMode, FocusStatus, RoomType } from '@/types/models';

function getWallet(tx: IDBTransaction): Promise<LocalWallet> {
  return request(tx.objectStore('wallet').get(LOCAL_USER_ID));
}

export function getLocalWalletBalance(): Promise<number> {
  return withLocalTransaction(['wallet'], 'readonly', async (tx) => (await getWallet(tx)).seeds_balance);
}

type FinalizedFocusRun = LocalFocusRun & { status: FocusStatus; finished_at: number; reward_coins: number };

export function listLocalSessions(): Promise<FinalizedFocusRun[]> {
  return withLocalTransaction(['sessions'], 'readonly', async (tx) => {
    const sessions: LocalFocusRun[] = await request(tx.objectStore('sessions').getAll());
    return sessions.filter((session): session is FinalizedFocusRun =>
      session.status !== null && session.finished_at !== null && session.reward_coins !== null && !session.interrupted,
    ).sort((a, b) => b.finished_at - a.finished_at);
  });
}

export function startLocalFocusSession(durationMinutes: number, mode: FocusMode): Promise<string> {
  if (!FOCUS_DURATIONS.some((duration) => duration === durationMinutes) || !FOCUS_MODES.includes(mode)) {
    throw new Error('Invalid session payload');
  }
  return withLocalTransaction(['sessions'], 'readwrite', async (tx) => {
    const sessions = tx.objectStore('sessions');
    const previous: LocalFocusRun[] = await request(sessions.getAll());
    const now = Date.now();
    for (const run of previous) {
      if (run.finished_at === null) {
        await request(sessions.put({
          ...run, finished_at: Math.max(now, run.started_at), status: 'given_up', reward_coins: 0, interrupted: true,
        } satisfies LocalFocusRun));
      }
    }
    const id = crypto.randomUUID();
    await request(sessions.add({
      id, started_at: now, finished_at: null, duration_minutes: durationMinutes,
      mode, status: null, reward_coins: null,
    } satisfies LocalFocusRun));
    return id;
  });
}

export function finishLocalFocusSession(id: string, status: FocusStatus, stoppedAt = Date.now()) {
  if (status !== 'given_up' && status !== 'completed') throw new Error('Invalid session status');
  return withLocalTransaction(['sessions', 'wallet', 'animals'], 'readwrite', async (tx) => {
    const sessions = tx.objectStore('sessions');
    const run: LocalFocusRun | undefined = await request(sessions.get(id));
    if (!run) throw new Error('Focus session not found');
    const wallet = await getWallet(tx);
    if (run.finished_at !== null) {
      return { coins: run.reward_coins ?? 0, seedsBalance: wallet.seeds_balance };
    }

    const finishedAt = Math.max(run.started_at, Math.min(Date.now(), stoppedAt));
    const elapsedSeconds = (finishedAt - run.started_at) / 1000;
    if (status === 'completed' && elapsedSeconds < run.duration_minutes * 60) {
      throw new Error('Focus session is not complete');
    }
    const { coins } = getFocusReward(run.duration_minutes, status, elapsedSeconds);
    await request(sessions.put({
      ...run, status, finished_at: finishedAt, reward_coins: coins,
    } satisfies LocalFocusRun));
    wallet.seeds_balance += coins;
    await request(tx.objectStore('wallet').put(wallet));

    if (status === 'completed') {
      const completed: LocalFocusRun[] = await request(sessions.index('by_status').getAll('completed'));
      const minutes = completed.reduce((total, entry) => total + entry.duration_minutes, 0);
      const unlockCount = minutes < 120 ? 0 : 1 + Math.floor((minutes - 120) / 180);
      const animals = tx.objectStore('animals');
      for (const animalId of Object.keys(LOCAL_ANIMAL_CATALOG).slice(0, unlockCount)) {
        await request(animals.put({ id: animalId }));
      }
    }

    return { coins, seedsBalance: wallet.seeds_balance };
  });
}

export function claimLocalOfficialItem(itemId: string): Promise<void> {
  if (!ITEM_CATALOG_SEED.some(({ id }) => id === itemId)) throw new Error('Unknown item');
  return withLocalTransaction(['wallet', 'inventory'], 'readwrite', async (tx) => {
    const wallet = await getWallet(tx);
    if (wallet.seeds_balance < OFFICIAL_ITEM_COST) throw new Error('Not enough seeds');
    wallet.seeds_balance -= OFFICIAL_ITEM_COST;
    await request(tx.objectStore('wallet').put(wallet));
    await changeInventory(tx, itemId, 1);
  });
}

async function changeInventory(tx: IDBTransaction, itemId: string, delta: 1 | -1): Promise<void> {
  const inventory = tx.objectStore('inventory');
  const previous: LocalInventory | undefined = await request(inventory.get(itemId));
  const quantity = (previous?.quantity ?? 0) + delta;
  if (quantity < 0) throw new Error('Not enough inventory');
  await request(inventory.put({ id: itemId, quantity, updated_at: new Date().toISOString() } satisfies LocalInventory));
}

export function listLocalInventory(): Promise<LocalInventory[]> {
  return withLocalTransaction(['inventory'], 'readonly', (tx) => request(tx.objectStore('inventory').getAll()));
}

function getRoom(tx: IDBTransaction): Promise<LocalRoom> {
  return request(tx.objectStore('room').get(LOCAL_ROOM_ID));
}

export function getLocalRoom(): Promise<LocalRoom> {
  return withLocalTransaction(['room'], 'readonly', getRoom);
}

export function listLocalRoom() {
  return withLocalTransaction(['room', 'placements'], 'readonly', async (tx) => {
    const room = await getRoom(tx);
    const placements: LocalPlacement[] = await request(tx.objectStore('placements').getAll());
    return { roomId: room.id, roomType: room.room_type, placements };
  });
}

export function setLocalRoomType(roomType: RoomType): Promise<void> {
  if (roomType !== 'bedroom' && roomType !== 'gym') throw new Error('Unknown room theme');
  return withLocalTransaction(['room'], 'readwrite', async (tx) => {
    await request(tx.objectStore('room').put({ id: LOCAL_ROOM_ID, room_type: roomType } satisfies LocalRoom));
  });
}

export function placeLocalInventory(input: { roomId: string; itemId: string; anchorId: string }): Promise<void> {
  return withLocalTransaction(['room', 'placements', 'inventory'], 'readwrite', async (tx) => {
    if (input.roomId !== LOCAL_ROOM_ID) throw new Error('Not room owner');
    const room = await getRoom(tx);
    if (!ROOM_ANCHORS[room.room_type].some(({ id }) => id === input.anchorId)) throw new Error('Invalid room anchor');
    const placements = tx.objectStore('placements');
    if (await request(placements.index('by_anchor').getKey(input.anchorId))) throw new Error('Room anchor is occupied');
    await changeInventory(tx, input.itemId, -1);
    await request(placements.add({
      id: crypto.randomUUID(), item_id: input.itemId, anchor_id: input.anchorId,
    } satisfies LocalPlacement));
  });
}

export function removeLocalRoomPlacement(id: string): Promise<void> {
  return withLocalTransaction(['placements', 'inventory'], 'readwrite', async (tx) => {
    const placements = tx.objectStore('placements');
    const placement: LocalPlacement | undefined = await request(placements.get(id));
    if (!placement) throw new Error('Placement not found');
    await request(placements.delete(id));
    await changeInventory(tx, placement.item_id, 1);
  });
}

export function listLocalAnimals() {
  return withLocalTransaction(['animals', 'profile'], 'readonly', async (tx) => {
    const animalIds: { id: AnimalId }[] = await request(tx.objectStore('animals').getAll());
    const profile: LocalProfile = await request(tx.objectStore('profile').get(LOCAL_USER_ID));
    return animalIds.map(({ id: animalId }) => ({
      animal_id: animalId,
      name: LOCAL_ANIMAL_CATALOG[animalId],
      sprite_key: animalId,
      is_active: profile.active_animal_id === animalId,
    }));
  });
}

export function setLocalActiveAnimal(animalId: string): Promise<void> {
  return withLocalTransaction(['animals', 'profile'], 'readwrite', async (tx) => {
    if (!await request(tx.objectStore('animals').getKey(animalId))) throw new Error('Animal is locked');
    const profiles = tx.objectStore('profile');
    const profile: LocalProfile = await request(profiles.get(LOCAL_USER_ID));
    await request(profiles.put({ ...profile, active_animal_id: animalId }));
  });
}
