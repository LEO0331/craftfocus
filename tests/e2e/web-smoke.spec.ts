import { expect, test } from '@playwright/test';

test('login page renders core auth controls', async ({ page }) => {
  await page.goto('auth/login');

  await expect(page.getByRole('heading', { name: /Log In|登入/ })).toBeVisible();
  await expect(page.getByPlaceholder(/Email|電子郵件/)).toBeVisible();
  await expect(page.getByPlaceholder(/Password|密碼/)).toBeVisible();
});

test('signup page renders and links back', async ({ page }) => {
  await page.goto('auth/signup');

  await expect(page.getByRole('heading', { name: /Sign Up|註冊/ })).toBeVisible();
  await expect(page.getByText(/Log In|登入/)).toBeVisible();
});
