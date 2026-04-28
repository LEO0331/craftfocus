import { expect, test } from '@playwright/test';

test('login page renders core auth controls', async ({ page }) => {
  await page.goto('/auth/login');

  await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();
  await expect(page.getByPlaceholder('Email')).toBeVisible();
  await expect(page.getByPlaceholder('Password')).toBeVisible();
});

test('signup page renders and links back', async ({ page }) => {
  await page.goto('/auth/signup');

  await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
  await expect(page.getByText('Log in')).toBeVisible();
});
