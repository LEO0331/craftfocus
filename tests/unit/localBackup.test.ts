import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exportLocalBackup, importLocalBackup, resetLocalDemo } from '@/lib/local/backup';
import { createLocalCraft, getLocalCraft, placeLocalCollectible } from '@/lib/local/crafts';
import { LOCAL_ROOM_ID, readLocalProfile, request, updateLocalProfile, withLocalTransaction } from '@/lib/local/database';
import {
  claimLocalOfficialItem,
  finishLocalFocusSession,
  getLocalWalletBalance,
  placeLocalInventory,
  startLocalFocusSession,
} from '@/lib/local/economy';

vi.mock('@/lib/data-mode', () => ({ LOCAL_USER_ID: 'craftfocus-local-player', isLocalMode: true }));
vi.mock('@/lib/supabase', () => ({ supabase: {} }));

const png = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], { type: 'image/png' });

function makeCraft() {
  return createLocalCraft({
    title: '本機作品',
    description: 'Local demo work',
    image: png,
    pixelImage: png,
    pixelPalette: { a: '#000000' },
    pixelGrid: ['a'],
  });
}

beforeEach(async () => {
  await resetLocalDemo();
});

describe('local demo backups', () => {
  it('restores profile, rewards, inventory, room, image blobs and gallery together', async () => {
    await updateLocalProfile({ display_name: '展示玩家', language: 'zh-TW' });
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-11-09T00:00:00Z'));
      const id = await startLocalFocusSession(45, 'general');
      vi.setSystemTime(new Date('2026-11-09T00:45:00Z'));
      await finishLocalFocusSession(id, 'completed');
    } finally {
      vi.useRealTimers();
    }
    await claimLocalOfficialItem('desk_lamp');
    await placeLocalInventory({ roomId: LOCAL_ROOM_ID, itemId: 'desk_lamp', anchorId: 'desk_left' });
    const craftId = await makeCraft();
    await placeLocalCollectible(craftId, 2, 3);

    const backup = await exportLocalBackup();
    await resetLocalDemo();
    expect(await getLocalWalletBalance()).toBe(0);
    expect(await getLocalCraft(craftId)).toBeUndefined();
    await importLocalBackup(backup);

    expect(await getLocalWalletBalance()).toBe(25);
    expect((await readLocalProfile()).language).toBe('zh-TW');
    const restoredCraft = await getLocalCraft(craftId);
    expect(restoredCraft?.image.type).toBe('image/png');
    expect(await restoredCraft?.image.arrayBuffer()).toEqual(await png.arrayBuffer());
    expect(await exportLocalBackup()).toBe(backup);
  });

  it('rejects invalid files, versions, references and signatures without replacing progress', async () => {
    await updateLocalProfile({ display_name: 'Keep me' });
    const id = await makeCraft();
    const text = await exportLocalBackup();
    const invalidVersion = JSON.parse(text);
    invalidVersion.version = 2;
    const invalidReference = JSON.parse(text);
    invalidReference.records.gallery = [{ id: `${id}-missing`, cellX: 0, cellY: 0 }];
    const invalidImage = JSON.parse(text);
    invalidImage.records.crafts[0].image.base64 = 'AAAA';

    await expect(importLocalBackup('malformed JSON')).rejects.toMatchObject({ code: 'invalid' });
    await expect(importLocalBackup(JSON.stringify(invalidVersion))).rejects.toMatchObject({ code: 'version' });
    await expect(importLocalBackup(JSON.stringify(invalidReference))).rejects.toMatchObject({ code: 'invalid' });
    await expect(importLocalBackup(JSON.stringify(invalidImage))).rejects.toMatchObject({ code: 'invalid' });
    expect(await exportLocalBackup()).toBe(text);
  });

  it('restores an active run as interrupted and prevents a reward after restore', async () => {
    const id = await startLocalFocusSession(25, 'general');
    await importLocalBackup(await exportLocalBackup());

    await expect(finishLocalFocusSession(id, 'completed')).resolves.toEqual({ coins: 0, seedsBalance: 0 });
    await expect(withLocalTransaction(['sessions'], 'readonly', (tx) => request(tx.objectStore('sessions').get(id))))
      .resolves.toMatchObject({ status: 'given_up', reward_coins: 0, interrupted: true });
  });

  it('resets only CraftFocus demo data', async () => {
    const open = indexedDB.open('other-app');
    open.onupgradeneeded = () => open.result.createObjectStore('records');
    const unrelated = await request(open);
    try {
      await request(unrelated.transaction('records', 'readwrite').objectStore('records').put('keep', 'key'));
      await updateLocalProfile({ display_name: 'Discard me' });
      await resetLocalDemo();
      expect((await readLocalProfile()).display_name).toBeNull();
      await expect(request(unrelated.transaction('records').objectStore('records').get('key'))).resolves.toBe('keep');
    } finally {
      unrelated.close();
    }
  });
});
