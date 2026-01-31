import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Mesh/);
  });

  test('page has main content', async ({ page }) => {
    await page.goto('/');
    // Check that the page loaded successfully
    await expect(page.locator('body')).toBeVisible();
  });
});
