import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));

import { LOCAL_USER_ID } from '@/lib/data-mode';
import {
  LOCAL_DATABASE_NAME, LOCAL_DATABASE_VERSION, LOCAL_ROOM_ID, localInitialRecords, localStores,
  openLocalDatabase, readLocalProfile, request, updateLocalProfile, withLocalTransaction,
  type LocalFocusRun,
} from '@/lib/local/database';
import {
  claimLocalOfficialItem, finishLocalFocusSession, getLocalWalletBalance, listLocalAnimals, listLocalInventory,
  listLocalRoom, listLocalSessions, placeLocalInventory, removeLocalRoomPlacement, setLocalActiveAnimal,
  setLocalRoomType, startLocalFocusSession,
} from '@/lib/local/economy';

const start = Date.UTC(2026, 0, 1);
let now: number;

beforeEach(async () => {
  await request(indexedDB.deleteDatabase(LOCAL_DATABASE_NAME));
  now = start;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
});
afterEach(() => vi.restoreAllMocks());

async function complete(duration: 25 | 45 | 60) {
  const id = await startLocalFocusSession(duration, 'general');
  now += duration * 60_000;
  return finishLocalFocusSession(id, 'completed');
}

describe('IndexedDB initialization', () => {
  it('seeds once and shares progress with a reopened connection', async () => {
    const db = await openLocalDatabase();
    expect(db.version).toBe(LOCAL_DATABASE_VERSION);
    expect(Array.from(db.objectStoreNames)).toEqual([...localStores].sort());
    expect(await getLocalWalletBalance()).toBe(0);
    expect(await listLocalInventory()).toEqual([expect.objectContaining({ id: 'plant', quantity: 1 })]);
    expect(await readLocalProfile()).toMatchObject({ id: LOCAL_USER_ID, active_animal_id: 'cat' });
    await updateLocalProfile({ display_name: 'Sparrow', language: 'zh-TW' });
    await complete(25);

    const reopened = await request(indexedDB.open(LOCAL_DATABASE_NAME, LOCAL_DATABASE_VERSION));
    try {
      expect(await request(reopened.transaction('wallet').objectStore('wallet').get(LOCAL_USER_ID)))
        .toMatchObject({ seeds_balance: 25 });
      expect(await request(reopened.transaction('profile').objectStore('profile').get(LOCAL_USER_ID)))
        .toMatchObject({ display_name: 'Sparrow', language: 'zh-TW' });
    } finally {
      reopened.close();
    }
  });

  it('adds indexes to version 1 without reseeding existing progress', async () => {
    const legacy = indexedDB.open(LOCAL_DATABASE_NAME, 1);
    legacy.onupgradeneeded = () => {
      const fixtures = localInitialRecords();
      fixtures.wallet = [{ id: LOCAL_USER_ID, seeds_balance: 50 }];
      for (const name of localStores) {
        const store = legacy.result.createObjectStore(name, { keyPath: 'id' });
        for (const record of fixtures[name]) store.add(record);
      }
    };
    (await request(legacy)).close();

    const db = await openLocalDatabase();
    expect(db.version).toBe(LOCAL_DATABASE_VERSION);
    expect(db.transaction('placements').objectStore('placements').index('by_anchor').unique).toBe(true);
    expect(db.transaction('sessions').objectStore('sessions').index('by_status').keyPath).toBe('status');
    expect(await getLocalWalletBalance()).toBe(50);
  });
});

describe('local focus sessions', () => {
  it('awards the canonical amounts and atomically deduplicates concurrent completions', async () => {
    expect(await complete(25)).toEqual({ coins: 25, seedsBalance: 25 });
    expect(await complete(45)).toEqual({ coins: 50, seedsBalance: 75 });
    const hour = await startLocalFocusSession(60, 'sewing');
    await expect(finishLocalFocusSession(hour, 'completed')).rejects.toThrow('not complete');
    now += 60 * 60_000;
    const results = await Promise.all([
      finishLocalFocusSession(hour, 'completed'),
      finishLocalFocusSession(hour, 'completed'),
    ]);
    expect(results).toEqual(Array(2).fill({ coins: 75, seedsBalance: 150 }));
    expect(await listLocalSessions()).toHaveLength(3);
    expect(await getLocalWalletBalance()).toBe(150);
  });

  it('uses the actual stop instant for manual and visibility stops, even when retrying', async () => {
    const manual = await startLocalFocusSession(25, 'crafting');
    now += 59_999;
    const stoppedAt = now;
    now += 120_000;
    expect(await finishLocalFocusSession(manual, 'given_up', stoppedAt)).toEqual({ coins: 0, seedsBalance: 0 });

    const hidden = await startLocalFocusSession(45, 'general');
    now += 60_000;
    expect(await finishLocalFocusSession(hidden, 'given_up', now)).toEqual({ coins: 5, seedsBalance: 5 });
    expect(await listLocalSessions()).toHaveLength(2);
  });

  it('supersedes an unfinished run with zero credit after an interruption', async () => {
    const stale = await startLocalFocusSession(25, 'general');
    now += 25 * 60_000;
    await startLocalFocusSession(25, 'sewing');
    expect(await finishLocalFocusSession(stale, 'completed')).toEqual({ coins: 0, seedsBalance: 0 });
    expect(await listLocalSessions()).toEqual([]);
    const run: LocalFocusRun = await withLocalTransaction(['sessions'], 'readonly', (tx) =>
      request(tx.objectStore('sessions').get(stale)),
    );
    expect(run).toMatchObject({ interrupted: true, status: 'given_up', reward_coins: 0 });
  });

  it('unlocks the canonical sequence and only allows selecting owned animals', async () => {
    await expect(setLocalActiveAnimal('dog')).rejects.toThrow('locked');
    for (let i = 0; i < 4; i += 1) await complete(60);
    expect((await listLocalAnimals()).map(({ animal_id }) => animal_id)).toEqual(['cat']);
    await complete(60);
    await setLocalActiveAnimal('dog');
    expect((await listLocalAnimals()).find(({ is_active }) => is_active)?.animal_id).toBe('dog');
  });
});

describe('local claims and room inventory', () => {
  it('charges each repeated claim while refusing unaffordable concurrent claims', async () => {
    await expect(claimLocalOfficialItem('bookshelf')).rejects.toThrow('Not enough seeds');
    await complete(45);
    const claims = await Promise.allSettled(Array.from({ length: 3 }, () => claimLocalOfficialItem('bookshelf')));
    expect(claims.map(({ status }) => status)).toEqual(['fulfilled', 'fulfilled', 'rejected']);
    expect(await getLocalWalletBalance()).toBe(0);
    expect(await listLocalInventory()).toContainEqual(expect.objectContaining({ id: 'bookshelf', quantity: 2 }));
  });

  it('rolls back the wallet debit if the inventory write fails', async () => {
    await complete(25);
    const put = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, record, key) {
      if (this.name === 'inventory') throw new DOMException('Storage is full', 'QuotaExceededError');
      return put.call(this, record, key);
    });
    await expect(claimLocalOfficialItem('bookshelf')).rejects.toThrow('Storage is full');
    expect(await getLocalWalletBalance()).toBe(25);
    expect(await listLocalInventory()).toEqual([expect.objectContaining({ id: 'plant', quantity: 1 })]);
  });

  it('enforces owned quantities and available anchors and refunds only removed placements', async () => {
    const placement = { roomId: LOCAL_ROOM_ID, anchorId: 'desk_left', itemId: 'plant' };
    await expect(placeLocalInventory({ ...placement, roomId: 'other-room' })).rejects.toThrow('Not room owner');
    await expect(placeLocalInventory({ ...placement, anchorId: 'gym_floor_a' })).rejects.toThrow('Invalid room anchor');
    await expect(placeLocalInventory({ ...placement, itemId: 'bookshelf' })).rejects.toThrow('Not enough inventory');
    await placeLocalInventory(placement);
    await expect(placeLocalInventory(placement)).rejects.toThrow('occupied');
    await expect(placeLocalInventory({ ...placement, anchorId: 'desk_center' })).rejects.toThrow('Not enough inventory');
    await setLocalRoomType('gym');
    await setLocalRoomType('bedroom');
    const room = await listLocalRoom();
    expect(room.placements).toEqual([expect.objectContaining({ anchor_id: 'desk_left', item_id: 'plant' })]);
    const [item] = room.placements;
    await removeLocalRoomPlacement(item.id);
    await expect(removeLocalRoomPlacement(item.id)).rejects.toThrow('Placement not found');
    await placeLocalInventory({ ...placement, anchorId: 'desk_center' });
    expect((await listLocalRoom()).placements).toEqual([expect.objectContaining({ anchor_id: 'desk_center' })]);
  });
});
