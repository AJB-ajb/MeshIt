/**
 * E2E Tests for Voice Onboarding
 */

import { test, expect } from '../fixtures/authenticated';

test.describe('Voice Onboarding', () => {
  test('should show onboarding mode selection', async ({ developerPage }) => {
    await developerPage.goto('/onboarding/developer');

    // Should show Voice Chat button
    const voiceButton = developerPage.getByRole('button', { name: /voice chat/i });
    await expect(voiceButton).toBeVisible();
    await voiceButton.click();

    // Should navigate to voice onboarding
    await expect(developerPage).toHaveURL(/\/onboarding\/voice-hume/);
    await expect(developerPage.getByText('Quick voice setup')).toBeVisible();
  });

  test('should request microphone permission for voice mode', async ({ developerPage, context }) => {
    // Grant microphone permission
    await context.grantPermissions(['microphone']);

    await developerPage.goto('/onboarding/developer');
    await developerPage.getByRole('button', { name: /voice chat/i }).click();

    // Should be on voice page
    await expect(developerPage).toHaveURL(/\/onboarding\/voice-hume/);
    await developerPage.getByText('Tap to start').click();

    // Should show voice interface
    // Should show voice interface label (label is "Tap to start" when idle, "Listening" when active)
    await expect(developerPage.getByText('Quick voice setup')).toBeVisible();
    await expect(developerPage.getByText('Tap to start')).toBeVisible();
  });

  test('should show fallback for denied microphone permission', async ({ developerPage, context }) => {
    // Deny microphone permission
    await context.grantPermissions([]);

    await developerPage.goto('/onboarding/developer');
    await developerPage.getByRole('button', { name: /voice chat/i }).click();
    await developerPage.getByText('Tap to start').click();

    // Should show permission denied message
    await expect(developerPage.getByText('Microphone Access Denied')).toBeVisible();
    await expect(developerPage.getByText('Try Again')).toBeVisible();
  });

  test('should allow switching to text input', async ({ developerPage, context }) => {
    await context.grantPermissions(['microphone']);

    await developerPage.goto('/onboarding/developer');
    await developerPage.getByRole('button', { name: /voice chat/i }).click();
    await developerPage.getByText('Tap to start').click();

    // Should show switch option
    await expect(developerPage.getByText('Switch to text input')).toBeVisible();
  });

  test('should display conversation messages', async ({ developerPage, context }) => {
    await context.grantPermissions(['microphone']);

    await developerPage.goto('/onboarding/developer');
    await developerPage.getByRole('button', { name: /voice chat/i }).click();
    await developerPage.getByText('Tap to start').click();

    // Wait for greeting to appear
    await developerPage.waitForSelector('[role="article"]', { timeout: 5000 });

    // Should show agent greeting
    const messages = developerPage.locator('[role="article"]');
    await expect(messages.first()).toBeVisible();
  });
});

test.describe('Match Audio Player', () => {
  test('should show listen button on matches page', async ({ developerPage }) => {
    await developerPage.goto('/matches');

    // Should show listen buttons for match explanations
    const listenButtons = developerPage.getByRole('button', { name: /listen/i });
    await expect(listenButtons.first()).toBeVisible();
  });

  test('should generate audio when listen button clicked', async ({ developerPage }) => {
    await developerPage.goto('/matches');

    const listenButton = developerPage.getByRole('button', { name: /listen/i }).first();
    await listenButton.click();

    // Should show loading state
    await expect(developerPage.getByText('Generating...')).toBeVisible();
  });
});
