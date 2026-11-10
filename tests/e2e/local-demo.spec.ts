import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

test.skip(process.env.EXPO_PUBLIC_DATA_MODE !== 'local', 'Requires a Local Demo web export');
test.use({ locale: 'en-US' });

const sessionClock = new Date('2026-11-09T04:00:00Z');
const demoLabel = 'Local Demo Mode';

async function startFocus(page: Page) {
  await page.getByRole('button', { name: 'Start Focus', exact: true }).click();
  await expect(page.getByLabel('Focus In Progress: 25:00')).toBeVisible();
}

async function claimOfficialItem(page: Page) {
  const response = page.waitForEvent('dialog').then(async (dialog) => {
    const message = dialog.message();
    await dialog.accept();
    return message;
  });
  await page.getByRole('button', { name: '25🌱', exact: true }).click();
  return response;
}

test('completes focus, claims and places an item, and keeps progress after reload', async ({ page, context }) => {
  const backendRequests: string[] = [];
  context.on('request', (request) => {
    const url = new URL(request.url());
    if (/\.supabase\.(co|in)$/.test(url.hostname) || /\/(auth|rest|storage|realtime)\/v1(?:\/|$)/.test(url.pathname)) {
      backendRequests.push(request.url());
    }
  });

  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Start Focus Session', exact: true })).toBeVisible();
  await expect(page.getByText(demoLabel, { exact: true }).first()).toBeVisible();
  await page.goto('auth/login');
  await expect(page).toHaveURL(/\/craftfocus\/home$/);
  await expect(page.getByRole('button', { name: 'Start Focus Session', exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('Email')).toHaveCount(0);
  await expect(page.getByPlaceholder('Password')).toHaveCount(0);

  await page.clock.install({ time: sessionClock });
  await page.goto('focus');
  await startFocus(page);
  await page.clock.fastForward('25:01');
  await expect(page.getByText('Great focus. +25 seeds. Balance: 25')).toBeVisible();
  await page.clock.fastForward('00:05');
  await expect(page.getByText('Great focus. +25 seeds. Balance: 25')).toBeVisible();

  await page.goto('crafts');
  await page.getByRole('textbox', { name: 'Search official items' }).fill('Plant');
  expect(await claimOfficialItem(page)).toContain('Claimed successfully.');
  expect(await claimOfficialItem(page)).toContain('Not enough seeds.');

  await page.goto('room');
  await page.getByRole('button', { name: 'Room anchor bed_left is empty' }).click();
  await page.getByRole('button', { name: 'Place Selected Item (owned: 2)' }).click();
  await expect(page.getByLabel('Room anchor bed_left has plant')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Room anchor bed_left has plant')).toBeVisible();
  await expect(page.getByText('Owned: 1', { exact: true })).toBeVisible();
  await page.goto('profile');
  await expect(page.getByText('Seeds balance: 0', { exact: true })).toBeVisible();

  expect(backendRequests).toEqual([]);
});

test('applies manual-stop and visibility rewards and clears an interrupted timer on reload', async ({ page }) => {
  await page.clock.install({ time: sessionClock });
  await page.goto('focus');
  await startFocus(page);
  await page.clock.fastForward('00:20');
  await page.getByRole('button', { name: 'Stop Focus', exact: true }).click();
  await expect(page.getByText('Focus stopped. +0 seeds. Balance: 0')).toBeVisible();

  await startFocus(page);
  await page.clock.fastForward('01:05');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    Reflect.deleteProperty(document, 'hidden');
  });
  await expect(page.getByText(/Focus stopped\. \+5 seeds\. Balance: 5/)).toBeVisible();
  await expect(page.getByText(/Session stopped because focus view was left/)).toBeVisible();

  await startFocus(page);
  await page.clock.fastForward('00:20');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start Focus', exact: true })).toBeEnabled();
  await page.clock.fastForward('25:01');
  await expect(page.getByText('Focus In Progress', { exact: true })).toHaveCount(0);
  await page.goto('profile');
  await expect(page.getByText('Seeds balance: 5', { exact: true })).toBeVisible();
});

test('restores a saved image and its gallery cell from an exported backup', async ({ page }, testInfo) => {
  const title = 'Pixel Patch';
  await page.goto('crafts');
  await page.getByRole('button', { name: 'Create Craft', exact: true }).click();
  await page.getByPlaceholder('Title', { exact: true }).fill(title);
  await page.getByPlaceholder('Description', { exact: true }).fill('A locally stored pixel craft.');
  const imageChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Pick Image', exact: true }).click();
  const imageChooser = await imageChooserPromise;
  await imageChooser.setFiles(path.join(process.cwd(), 'assets', 'images', 'icon.png'));
  await page.getByRole('button', { name: 'Save Craft', exact: true }).click();
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/crafts\/[a-f0-9-]{36}$/);
  const detailResponse = await page.reload();
  expect(detailResponse?.status()).toBe(404); // GitHub Pages serves the SPA fallback with this status.
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible();

  await page.goto('room');
  await page.getByRole('button', { name: 'Select', exact: true }).click();
  await page.getByRole('button', { name: 'Gallery cell 1,1 is empty' }).click();
  const filled = page.getByRole('button', { name: `Gallery cell 1,1 contains ${title}` });
  await expect(filled).toBeVisible();

  await page.goto('profile');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('craftfocus-demo-backup.json');
  const backupPath = testInfo.outputPath(download.suggestedFilename());
  await download.saveAs(backupPath);
  expect(await readFile(backupPath, 'utf8')).toContain(title);

  const reset = page.getByRole('button', { name: 'Reset demo data', exact: true });
  page.once('dialog', (dialog) => dialog.dismiss());
  await reset.click();
  await page.goto('room');
  await expect(filled).toBeVisible();

  await page.goto('profile');
  page.once('dialog', (dialog) => dialog.accept());
  await Promise.all([page.waitForEvent('load'), reset.click()]);
  await page.goto('room');
  await expect(page.getByRole('button', { name: 'Gallery cell 1,1 is empty' })).toBeVisible();
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);

  await page.goto('profile');
  const backupChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import backup', exact: true }).click();
  const backupChooser = await backupChooserPromise;
  page.once('dialog', (dialog) => dialog.accept());
  await Promise.all([page.waitForEvent('load'), backupChooser.setFiles(backupPath)]);
  await page.goto('room');
  await expect(filled).toBeVisible();
  const image = page.getByAltText(`Collectible image: ${title}`, { exact: true }).last();
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('src', /^blob:/);
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
});

test('exposes labeled controls on mobile and lets keyboard users start focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('focus');
  const start = page.getByRole('button', { name: 'Start Focus', exact: true });
  await start.focus();
  await expect(start).toBeFocused();
  await start.press('Enter');
  await expect(page.getByRole('button', { name: 'Stop Focus', exact: true })).toBeVisible();
  await expect(page.getByLabel(/Focus In Progress: \d\d:\d\d/)).toHaveAttribute('aria-live', 'polite');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('explains how to recover when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { configurable: true, value: undefined });
  });
  await page.goto('./');
  await expect(page.getByRole('alert')).toContainText('CraftFocus could not open browser storage.');
  await expect(page.getByRole('button', { name: 'Reload', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Focus Session', exact: true })).toHaveCount(0);
});
