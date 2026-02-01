/**
 * E2E Tests for Voice Onboarding
 */

import { test, expect } from '@playwright/test';

test.describe('Voice Onboarding', () => {
  test('should show onboarding mode selection', async ({ page }) => {
    await page.goto('/onboarding/voice');

    // Should show choice between voice and text
    await expect(page.getByText('Welcome to MeshIt!')).toBeVisible();
    await expect(page.getByText('Voice Onboarding')).toBeVisible();
    await expect(page.getByText('Text Onboarding')).toBeVisible();
  });

  test('should request microphone permission for voice mode', async ({ page, context }) => {
    // Grant microphone permission
    await context.grantPermissions(['microphone']);

    await page.goto('/onboarding/voice');
    await page.getByText('Voice Onboarding').click();

    // Should show voice interface
    await expect(page.getByText('Voice Onboarding')).toBeVisible();
    await expect(page.getByRole('button', { name: /tap to start/i })).toBeVisible();
  });

  test('should show fallback for denied microphone permission', async ({ page, context }) => {
    // Deny microphone permission
    await context.grantPermissions([]);

    await page.goto('/onboarding/voice');
    await page.getByText('Voice Onboarding').click();

    // Should show permission denied message
    await expect(page.getByText('Microphone Access Denied')).toBeVisible();
    await expect(page.getByText('Try Again')).toBeVisible();
  });

  test('should allow switching to text input', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);

    await page.goto('/onboarding/voice');
    await page.getByText('Voice Onboarding').click();

    // Should show switch option
    await expect(page.getByText('Switch to text input')).toBeVisible();
  });

  test('should display conversation messages', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);

    await page.goto('/onboarding/voice');
    await page.getByText('Voice Onboarding').click();

    // Wait for greeting to appear
    await page.waitForSelector('[role="article"]', { timeout: 5000 });

    // Should show agent greeting
    const messages = page.locator('[role="article"]');
    await expect(messages.first()).toBeVisible();
  });
});

test.describe('Match Audio Player', () => {
  test('should show listen button on matches page', async ({ page }) => {
    await page.goto('/matches');

    // Should show listen buttons for match explanations
    const listenButtons = page.getByRole('button', { name: /listen/i });
    await expect(listenButtons.first()).toBeVisible();
  });

  test('should generate audio when listen button clicked', async ({ page }) => {
    await page.goto('/matches');

    const listenButton = page.getByRole('button', { name: /listen/i }).first();
    await listenButton.click();

    // Should show loading state
    await expect(page.getByText('Generating...')).toBeVisible();
  });
});
