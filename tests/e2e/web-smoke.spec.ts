import { expect, test } from '@playwright/test';

const configError = /Configuration error: missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY\.|設定錯誤：缺少/;

test('login page renders configuration banner and core auth controls without backend env', async ({ page }) => {
  await page.goto('auth/login');

  await expect(page.getByRole('alert').filter({ hasText: configError })).toBeVisible();
  await expect(page.getByText(/^CraftFocus$/)).toBeVisible();
  await expect(page.getByPlaceholder(/Email|電子郵件/)).toBeVisible();
  await expect(page.getByPlaceholder(/Password|密碼/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Log In|登入/ })).toBeVisible();
});

test('signup page renders and links back without backend env', async ({ page }) => {
  await page.goto('auth/signup');

  await expect(page.getByRole('alert').filter({ hasText: configError })).toBeVisible();
  await expect(page.getByText(/Create account|建立帳號/)).toBeVisible();
  await expect(page.getByPlaceholder(/Email|電子郵件/)).toBeVisible();
  await expect(page.getByPlaceholder(/Password|密碼/)).toBeVisible();
  await expect(page.getByText(/Log In|登入/)).toBeVisible();
});
