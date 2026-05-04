import { expect, test, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL/E2E_PASSWORD not set');

const text = {
  loginHeading: /Log In|登入/,
  focusHeading: /Focus Session|專注/, 
  focusInProgress: /Focus In Progress|專注進行中/,
  dontInterrupt: /Do not interrupt me|請勿打擾我/,
  devComplete: /Dev: Complete Now|開發：立即完成/,
  greatFocus: /Great focus\.|專注完成/, 
  roomHeading: /My Focus Room|我的專注房間/,
  roomGallery: /Collectible Gallery|收藏展牆/,
  noCollectibles: /No custom collectibles yet\.|目前沒有自訂收藏。/,
  craftsHeading: /Craft Feed|作品動態/,
  officialTitle: /Official Inventory|官方庫存/,
  claimsHeading: /My Claims|我的領取/,
};

async function login(page: Page) {
  await page.goto('auth/login');
  await expect(page.getByRole('heading', { name: text.loginHeading })).toBeVisible();
  await page.getByPlaceholder(/Email|電子郵件/).fill(EMAIL!);
  await page.getByPlaceholder(/Password|密碼/).fill(PASSWORD!);
  await page.getByRole('button', { name: /Log In|登入/ }).click();
  await expect(page.getByRole('button', { name: /Start Focus Session|開始專注/ })).toBeVisible({ timeout: 20000 });
}

test('v2.2 flow: header status, focus timer, official claim, gallery surface', async ({ page }) => {
  await login(page);

  await expect(page.getByLabel(/(Active companion|目前夥伴).*(seeds|種子)/)).toBeVisible();

  await page.goto('focus');
  await expect(page.getByText(text.focusHeading)).toBeVisible();
  await page.getByRole('button', { name: /Start Focus|開始專注/ }).click();
  await expect(page.getByText(text.focusInProgress)).toBeVisible();
  await expect(page.getByText(text.dontInterrupt)).toBeVisible();

  const timer = page.locator('text=/[⌛⏳]\\s\\d{2}:\\d{2}/').first();
  await expect(timer).toBeVisible();
  const before = (await timer.textContent()) ?? '';
  await page.waitForTimeout(1300);
  const after = (await timer.textContent()) ?? '';
  expect(after).not.toEqual(before);

  await page.getByRole('button', { name: text.devComplete }).click();
  await expect(page.getByText(text.greatFocus)).toBeVisible({ timeout: 15000 });

  await page.goto('crafts');
  await expect(page.getByText(text.craftsHeading)).toBeVisible();
  await expect(page.getByText(text.officialTitle)).toBeVisible();
  const claimOfficial = page.getByRole('button', { name: /25\s*🌱/ }).first();
  await expect(claimOfficial).toBeVisible();
  await claimOfficial.click();

  await page.goto('exchanges');
  await expect(page.getByRole('heading', { name: text.claimsHeading })).toBeVisible();

  await page.goto('room');
  await expect(page.getByText(text.roomHeading)).toBeVisible();
  await expect(page.getByText(text.roomGallery)).toBeVisible();

  const galleryCells = page.getByLabel(/Gallery cell|展牆/);
  await expect(galleryCells).toHaveCount(25);

  const noCollectibles = await page.getByText(text.noCollectibles).count();
  if (noCollectibles === 0) {
    const collectibleSelect = page.getByRole('button', { name: /Select|選取/ }).last();
    if (await collectibleSelect.isVisible()) {
      await collectibleSelect.click();
      await page.getByLabel(/Gallery cell 1,1 empty|Gallery cell 1,1/).click();
    }
  }
});
