import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const EMAIL = process.env.E2E_EMAIL ?? 'codex@test.com';
const PASSWORD = process.env.E2E_PASSWORD ?? 'codexcodex';

async function snap(page: Page, name: string) {
  const dir = path.join(process.cwd(), 'docs', 'e2e');
  await fs.mkdir(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, name), fullPage: true });
}

test('core user flow works on web', async ({ page }) => {
  await page.goto('auth/login');
  await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();
  await snap(page, '01-login.png');

  await page.getByPlaceholder('Email').fill(EMAIL);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Log In' }).click();

  await expect(page.getByText('Build A Room By Protecting Your Time')).toBeVisible({ timeout: 20_000 });
  await snap(page, '02-home.png');

  await page.goto('focus');
  await expect(page.getByText('Focus Session')).toBeVisible();
  await page.getByRole('button', { name: 'Start Focus' }).click();
  await expect(page.getByText('Focus In Progress')).toBeVisible();
  await page.getByRole('button', { name: 'Dev: Complete Now' }).click();
  await expect(page.getByText('Great job!')).toBeVisible();
  await snap(page, '03-focus-complete.png');

  await page.goto('room');
  await expect(page.getByText('My Focus Room')).toBeVisible();
  const selectButtons = page.getByRole('button', { name: /^Select$/ });
  if ((await selectButtons.count()) > 0) {
    await selectButtons.first().click();
    await page.getByText('Selected cell: none').waitFor({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Room cell x 2, y 1' }).click();
    await page.getByRole('button', { name: 'Place Selected Item In Selected Cell' }).click();
  } else {
    await expect(page.getByText('No unlocked items yet')).toBeVisible();
  }
  await snap(page, '04-room.png');

  await page.goto('crafts');
  await expect(page.getByText('Craft Feed')).toBeVisible();
  await page.getByRole('button', { name: 'Upload New Craft' }).click();
  await expect(page.getByText('Upload Craft Work')).toBeVisible();

  await page.getByPlaceholder('Title').fill(`E2E Demo ${Date.now()}`);
  await page.getByPlaceholder('Description').fill('Automated E2E craft upload test.');

  const fileChooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Pick Image' }).click();
  const chooser = await fileChooser;
  await chooser.setFiles(path.join(process.cwd(), 'assets', 'images', 'icon.png'));

  await page.getByRole('button', { name: 'Generate Pixel Preview (deterministic)' }).click();
  await page.getByRole('button', { name: 'Publish Craft Post' }).click();
  await expect(page.getByRole('heading', { name: 'Craft Detail' })).toBeVisible({ timeout: 20_000 });
  await snap(page, '05-craft-detail.png');

  await page.goto('friends');
  await expect(page.getByRole('heading', { name: 'Friends' })).toBeVisible();
  await snap(page, '06-friends.png');

  await page.goto('exchanges');
  await expect(page.getByRole('heading', { name: 'Exchange Requests' })).toBeVisible();
  await snap(page, '07-exchanges.png');
});
