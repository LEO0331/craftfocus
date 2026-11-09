import { FOCUS_DURATIONS, FOCUS_MODES } from '@/constants/categories';
import { ITEM_CATALOG_SEED } from '@/constants/itemCatalog';
import { ROOM_ANCHORS } from '@/constants/roomLayout';
import { LOCAL_USER_ID } from '@/lib/data-mode';
import { getFocusReward } from '@/lib/focusRewards';
import { isValidGalleryCell } from '@/lib/galleryUtils';
import {
  LOCAL_ANIMAL_CATALOG,
  LOCAL_ROOM_ID,
  localInitialRecords,
  localStores,
  request,
  withLocalTransaction,
  type LocalStore,
} from '@/lib/local/database';
import { validateImageBlob } from '@/lib/storage';
import type { FocusMode } from '@/types/models';

export const MAX_BACKUP_BYTES = 64 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const BACKUP_FORMAT = 'craftfocus-local-demo';
const BACKUP_VERSION = 1;

type Row = Record<string, unknown>;
type Records = Record<LocalStore, Row[]>;
type BackupErrorCode = 'invalid' | 'version' | 'size';

export class LocalBackupError extends Error {
  constructor(public readonly code: BackupErrorCode) {
    super(`CraftFocus backup error: ${code}`);
    this.name = 'LocalBackupError';
  }
}

const catalogIds = new Set<string>(ITEM_CATALOG_SEED.map(({ id }) => id));
const animalIds = new Set(Object.keys(LOCAL_ANIMAL_CATALOG));
const anchorIds = new Set(Object.values(ROOM_ANCHORS).flat().map(({ id }) => id));
const limits: Record<LocalStore, number> = {
  profile: 1,
  wallet: 1,
  room: 1,
  inventory: catalogIds.size,
  animals: animalIds.size,
  placements: anchorIds.size,
  sessions: 50_000,
  crafts: 5_000,
  gallery: 25,
};

function check(condition: unknown): asserts condition {
  if (!condition) throw new LocalBackupError('invalid');
}

function isRow(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasKeys(row: Row, required: readonly string[], optional: readonly string[] = []) {
  return required.every((key) => Object.hasOwn(row, key))
    && Object.keys(row).every((key) => required.includes(key) || optional.includes(key));
}

function isText(value: unknown, max: number, min = 0): value is string {
  return typeof value === 'string' && value.length >= min && value.length <= max;
}

function isInt(value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
}

function isDate(value: unknown) {
  if (!isText(value, 24, 24) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const millis = Date.parse(value);
  return Number.isFinite(millis) && new Date(millis).toISOString() === value;
}

function isUUID(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
}

function validateSession(row: Row) {
  check(hasKeys(row, [
    'id', 'started_at', 'finished_at', 'duration_minutes', 'mode', 'status', 'reward_coins',
  ], ['interrupted']));
  const { id, started_at, finished_at, duration_minutes, mode, status, reward_coins, interrupted } = row;
  check(isUUID(id) && isInt(started_at, 0, 8.64e15));
  check(typeof duration_minutes === 'number' && FOCUS_DURATIONS.some((duration) => duration === duration_minutes));
  check(typeof mode === 'string' && FOCUS_MODES.includes(mode as FocusMode));
  check(interrupted === undefined || interrupted === true);

  if (finished_at === null) {
    check(status === null && reward_coins === null && interrupted === undefined);
    return { ...row, finished_at: started_at, status: 'given_up', reward_coins: 0, interrupted: true };
  }
  check(isInt(finished_at, started_at, 8.64e15));
  check(status === 'completed' || status === 'given_up');
  const elapsed = (finished_at - started_at) / 1000;
  if (interrupted) {
    check(status === 'given_up' && reward_coins === 0);
  } else {
    check(status !== 'completed' || elapsed >= duration_minutes * 60);
    check(reward_coins === getFocusReward(duration_minutes, status, elapsed).coins);
  }
  return row;
}

function decodeRecords(input: unknown): Records {
  check(isRow(input) && hasKeys(input, localStores));
  const result = {} as Records;
  for (const store of localStores) {
    const rows = input[store];
    check(Array.isArray(rows) && rows.length <= limits[store]);
    const seen = new Set<string>();
    result[store] = rows.map((row: unknown) => {
      check(isRow(row) && isText(row.id, 64, 1) && !seen.has(row.id));
      seen.add(row.id);
      return row;
    });
  }
  return result;
}

function validateGameplay(records: Records) {
  const [profile] = records.profile;
  const [wallet] = records.wallet;
  const [room] = records.room;
  check(profile && hasKeys(profile, [
    'id', 'username', 'display_name', 'avatar_url', 'bio', 'active_animal_id', 'created_at',
  ], ['language']));
  check(profile.id === LOCAL_USER_ID && typeof profile.username === 'string'
    && /^[a-zA-Z0-9_]{3,24}$/.test(profile.username) && isDate(profile.created_at) && profile.avatar_url === null);
  check((profile.display_name === null || isText(profile.display_name, 40))
    && (profile.bio === null || isText(profile.bio, 280)));
  check(profile.language === undefined || profile.language === 'en' || profile.language === 'zh-TW');
  check(wallet && hasKeys(wallet, ['id', 'seeds_balance'])
    && wallet.id === LOCAL_USER_ID && isInt(wallet.seeds_balance, 0, 10_000_000));
  check(room && hasKeys(room, ['id', 'room_type']) && room.id === LOCAL_ROOM_ID
    && (room.room_type === 'bedroom' || room.room_type === 'gym'));
  const unlocked = new Set(records.animals.map((row) => {
    check(hasKeys(row, ['id']) && typeof row.id === 'string' && animalIds.has(row.id));
    return row.id;
  }));
  check(unlocked.has('cat') && typeof profile.active_animal_id === 'string' && unlocked.has(profile.active_animal_id));

  const owned = new Set(records.inventory.map((row) => {
    check(hasKeys(row, ['id', 'quantity', 'updated_at']) && typeof row.id === 'string'
      && catalogIds.has(row.id) && isInt(row.quantity, 0, 1_000_000) && isDate(row.updated_at));
    return row.id;
  }));
  const usedAnchors = new Set<string>();
  for (const row of records.placements) {
    check(hasKeys(row, ['id', 'item_id', 'anchor_id']) && isUUID(row.id));
    check(typeof row.item_id === 'string' && owned.has(row.item_id));
    check(typeof row.anchor_id === 'string' && anchorIds.has(row.anchor_id) && !usedAnchors.has(row.anchor_id));
    usedAnchors.add(row.anchor_id);
  }
  records.sessions = records.sessions.map(validateSession);
}

function decodeImage(value: unknown): Blob {
  check(isRow(value) && hasKeys(value, ['mime', 'base64']));
  const { mime, base64 } = value;
  check(mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp');
  check(isText(base64, Math.ceil(MAX_IMAGE_BYTES / 3) * 4, 4) && base64.length % 4 === 0);
  check(/^[A-Za-z0-9+/]+={0,2}$/.test(base64));
  const binary = atob(base64);
  check(binary.length <= MAX_IMAGE_BYTES);
  const bytes = new Uint8Array(binary.length);
  for (let offset = 0; offset < binary.length; offset += 1) bytes[offset] = binary.charCodeAt(offset);
  return new Blob([bytes], { type: mime });
}

async function validateCrafts(records: Records) {
  const craftIds = new Set<string>();
  for (const row of records.crafts) {
    check(hasKeys(row, [
      'id', 'title', 'description', 'image', 'pixelImage', 'pixelPalette', 'pixelGrid', 'createdAt',
    ]));
    check(typeof row.id === 'string' && isUUID(row.id) && isText(row.title, 20, 1) && row.title.trim().length > 0
      && isText(row.description, 60) && isDate(row.createdAt));
    const { pixelGrid, pixelPalette } = row;
    check(pixelPalette === null || (isRow(pixelPalette) && Object.keys(pixelPalette).length <= 128
      && Object.entries(pixelPalette).every(([token, color]) => isText(token, 1, 1)
        && typeof color === 'string' && /^#(?:[\da-f]{6}|[\da-f]{8})$/i.test(color))));
    check(pixelGrid === null || (isRow(pixelPalette) && Array.isArray(pixelGrid)
      && pixelGrid.length > 0 && pixelGrid.length <= 128 && pixelGrid.every((line) => (
        isText(line, 128, 1) && line.length === pixelGrid[0]?.length
          && line.split('').every((token) => Object.hasOwn(pixelPalette, token))
      ))));
    try {
      const image = decodeImage(row.image);
      await validateImageBlob(image);
      row.image = image;
      row.pixelImage = row.pixelImage === null ? null : decodeImage(row.pixelImage);
      if (row.pixelImage instanceof Blob) await validateImageBlob(row.pixelImage);
    } catch {
      throw new LocalBackupError('invalid');
    }
    craftIds.add(row.id);
  }
  const usedCells = new Set<string>();
  for (const row of records.gallery) {
    check(hasKeys(row, ['id', 'cellX', 'cellY']) && typeof row.id === 'string' && craftIds.has(row.id));
    check(typeof row.cellX === 'number' && typeof row.cellY === 'number' && isValidGalleryCell(row.cellX, row.cellY));
    const cell = `${row.cellX},${row.cellY}`;
    check(!usedCells.has(cell));
    usedCells.add(cell);
  }
}

function checkSize(text: string) {
  if (text.length > MAX_BACKUP_BYTES || new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new LocalBackupError('size');
  }
}

async function encodeImage(image: Blob) {
  const bytes = new Uint8Array(await image.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return { mime: image.type, base64: btoa(binary) };
}

export async function exportLocalBackup(): Promise<string> {
  const records = await withLocalTransaction(localStores, 'readonly', async (tx) => {
    const entries = await Promise.all(localStores.map(async (store) => (
      [store, await request(tx.objectStore(store).getAll())] as const
    )));
    return Object.fromEntries(entries) as Records;
  });
  let imageBytes = 0;
  for (const craft of records.crafts) {
    for (const image of [craft.image, craft.pixelImage]) {
      if (image instanceof Blob) imageBytes += Math.ceil(image.size / 3) * 4;
    }
    if (imageBytes > MAX_BACKUP_BYTES) throw new LocalBackupError('size');
  }
  for (const craft of records.crafts) {
    if (craft.image instanceof Blob) craft.image = await encodeImage(craft.image);
    if (craft.pixelImage instanceof Blob) craft.pixelImage = await encodeImage(craft.pixelImage);
  }
  const text = JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_VERSION, records });
  checkSize(text);
  return text;
}

async function replaceRecords(records: Record<LocalStore, object[]>) {
  await withLocalTransaction(localStores, 'readwrite', async (tx) => {
    await Promise.all(localStores.map(async (store) => {
      const target = tx.objectStore(store);
      await request(target.clear());
      await Promise.all(records[store].map((row) => request(target.add(row))));
    }));
  });
}

export async function importLocalBackup(text: string): Promise<void> {
  checkSize(text);
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    throw new LocalBackupError('invalid');
  }
  check(isRow(input) && hasKeys(input, ['format', 'version', 'records']) && input.format === BACKUP_FORMAT);
  if (input.version !== BACKUP_VERSION) throw new LocalBackupError('version');
  const records = decodeRecords(input.records);
  validateGameplay(records);
  await validateCrafts(records);
  await replaceRecords(records);
}

export function resetLocalDemo(): Promise<void> {
  return replaceRecords(localInitialRecords());
}
