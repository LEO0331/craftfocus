import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL/E2E_PASSWORD not set');

async function snap(page: Page, name: string) {
  const dir = path.join(process.cwd(), 'docs', 'e2e');
  await fs.mkdir(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, name), fullPage: true });
}

test('v2 web flow works: login -> focus -> room -> listing', async ({ page }) => {
  await page.goto('auth/login');
  await expect(page.getByRole('heading', { name: /Log In|登入/ })).toBeVisible();

  await page.getByPlaceholder(/Email|電子郵件/).fill(EMAIL!);
  await page.getByPlaceholder(/Password|密碼/).fill(PASSWORD!);
  await page.getByRole('button', { name: /Log In|登入/ }).click();

  await expect(page.getByText('Build A Room By Protecting Your Time')).toBeVisible({ timeout: 20000 });
  await snap(page, 'v2-01-home.png');

  await page.goto('focus');
  await expect(page.getByText(/Focus Session|專注/)).toBeVisible();
  await page.getByRole('button', { name: 'Start Focus' }).click();
  await expect(page.getByText(/Focus In Progress|專注進行中/)).toBeVisible();
  await expect(page.getByText(/Do not interrupt me|請勿打擾我/)).toBeVisible();
  await page.getByRole('button', { name: /Dev: Complete Now|開發：立即完成/ }).click();
  await expect(page.getByText(/Great focus\./)).toBeVisible();
  await snap(page, 'v2-02-focus.png');

  await page.goto('profile');
  await expect(page.getByText('Companion & Wallet')).toBeVisible();
  await expect(page.getByText(/Seeds balance:/)).toBeVisible();
  await snap(page, 'v2-03-profile.png');

  await page.goto('room');
  await expect(page.getByText('My Focus Room')).toBeVisible();
  await snap(page, 'v2-04-room.png');

  await page.goto('crafts');
  await expect(page.getByText('Craft Feed')).toBeVisible();
  await page.getByRole('button', { name: 'Upload New Craft' }).click();
  await expect(page.getByText(/Publish Listing|發布清單|發布作品/).first()).toBeVisible();

  await page.getByPlaceholder('Title').fill(`E2E V2 ${Date.now()}`);
  await page.getByPlaceholder('Description').fill('Automated V2 listing flow.');

  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Pick Image' }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(path.join(process.cwd(), 'assets', 'images', 'icon.png'));

  await page.getByRole('button', { name: 'Publish Listing' }).click();
  await expect(page.getByText(/Listing Detail|作品詳情/).first()).toBeVisible({ timeout: 20000 });
  await snap(page, 'v2-05-listing-detail.png');
});
