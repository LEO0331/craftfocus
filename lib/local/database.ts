import { LOCAL_USER_ID } from '@/lib/data-mode';
import type { Database } from '@/types/database';
import type { FocusMode, FocusStatus, RoomType } from '@/types/models';

export const LOCAL_DATABASE_NAME = 'craftfocus-local-demo';
export const LOCAL_DATABASE_VERSION = 2;
export const LOCAL_ROOM_ID = 'local-room';
export const LOCAL_ANIMAL_CATALOG = { cat: 'Cat', dog: 'Dog', fox: 'Fox', rabbit: 'Rabbit' } as const;
export const localStores = ['profile', 'sessions', 'wallet', 'inventory', 'room', 'placements', 'animals', 'crafts', 'gallery'] as const;
export type LocalStore = typeof localStores[number];

export type LocalProfile = Database['public']['Tables']['profiles']['Row'] & { language?: 'en' | 'zh-TW' };
export interface LocalWallet { id: string; seeds_balance: number }
export interface LocalInventory { id: string; quantity: number; updated_at: string }
export interface LocalRoom { id: string; room_type: RoomType }
export interface LocalPlacement { id: string; item_id: string; anchor_id: string }
export interface LocalFocusRun {
  id: string;
  started_at: number;
  finished_at: number | null;
  duration_minutes: number;
  mode: FocusMode;
  status: FocusStatus | null;
  reward_coins: number | null;
  interrupted?: true;
}

export function localInitialRecords(): Record<LocalStore, object[]> {
  const now = new Date().toISOString();
  return {
    profile: [{
      id: LOCAL_USER_ID, username: 'local_player', display_name: null, avatar_url: null,
      bio: null, active_animal_id: 'cat', created_at: now,
    } satisfies LocalProfile],
    sessions: [],
    wallet: [{ id: LOCAL_USER_ID, seeds_balance: 0 } satisfies LocalWallet],
    inventory: [{ id: 'plant', quantity: 1, updated_at: now } satisfies LocalInventory],
    room: [{ id: LOCAL_ROOM_ID, room_type: 'bedroom' } satisfies LocalRoom],
    placements: [],
    animals: [{ id: 'cat' }],
    crafts: [],
    gallery: [],
  };
}

let connection: Promise<IDBDatabase> | undefined;

export function openLocalDatabase(): Promise<IDBDatabase> {
  if (connection) return connection;
  connection = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser.'));
      return;
    }
    const open = indexedDB.open(LOCAL_DATABASE_NAME, LOCAL_DATABASE_VERSION);
    let blocked = false;
    open.onblocked = () => {
      blocked = true;
      reject(new Error('Close other CraftFocus tabs and reload to update local storage.'));
    };
    open.onerror = () => reject(open.error);
    open.onupgradeneeded = (event) => {
      if (event.oldVersion < 1) {
        const initial = localInitialRecords();
        for (const name of localStores) {
          const store = open.result.createObjectStore(name, { keyPath: 'id' });
          for (const record of initial[name]) store.add(record);
        }
      }
      if (event.oldVersion < 2) {
        const upgrade = open.transaction!;
        upgrade.objectStore('sessions').createIndex('by_status', 'status');
        upgrade.objectStore('placements').createIndex('by_anchor', 'anchor_id', { unique: true });
      }
    };
    open.onsuccess = () => {
      const db = open.result;
      if (blocked) {
        db.close();
        return;
      }
      db.onversionchange = () => {
        db.close();
        connection = undefined;
      };
      db.onclose = () => { connection = undefined; };
      resolve(db);
    };
  }).catch((error) => {
    connection = undefined;
    throw error;
  });
  return connection;
}

export function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Keep callbacks limited to synchronous work and IndexedDB requests so the
// browser cannot auto-commit while waiting for unrelated async work.
export async function withLocalTransaction<T>(
  stores: readonly LocalStore[],
  mode: IDBTransactionMode,
  callback: (tx: IDBTransaction) => Promise<T>,
): Promise<T> {
  const db = await openLocalDatabase();
  const tx = db.transaction([...stores], mode);
  const done = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('Local transaction was cancelled.'));
  });
  const result = Promise.resolve().then(() => callback(tx)).catch((error) => {
    try { tx.abort(); } catch { /* A failed request may already have aborted the transaction. */ }
    throw error;
  });
  const [value] = await Promise.all([result, done]);
  return value;
}

export function readLocalProfile(): Promise<LocalProfile> {
  return withLocalTransaction(['profile'], 'readonly', (tx) => request(tx.objectStore('profile').get(LOCAL_USER_ID)));
}

type ProfilePatch = Partial<Pick<LocalProfile, 'display_name' | 'bio' | 'avatar_url' | 'language'>>;

export function updateLocalProfile(patch: ProfilePatch): Promise<LocalProfile> {
  return withLocalTransaction(['profile'], 'readwrite', async (tx) => {
    const profiles = tx.objectStore('profile');
    const previous: LocalProfile = await request(profiles.get(LOCAL_USER_ID));
    const profile = { ...previous, ...patch };
    await request(profiles.put(profile));
    return profile;
  });
}
