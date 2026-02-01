/**
 * Auth Helpers
 * Utilities for authentication in tests
 */

import { Page } from '@playwright/test';
import { createClient } from '@/lib/supabase/server';
import { createUser, type TestUser } from '../factories/user-factory';

/**
 * Login a user via the UI
 */
export async function loginAsUser(
  page: Page,
  userData: Partial<TestUser> = {}
): Promise<TestUser> {
  const user = createUser(userData);

  // Navigate to login page
  await page.goto('/login');

  // Fill in credentials (assuming email/password login for testing)
  await page.fill('[name="email"]', user.email);
  await page.fill('[name="password"]', user.password);
  await page.click('[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });

  return user;
}

/**
 * Login via API (faster for setup)
 */
export async function loginViaAPI(userData: Partial<TestUser> = {}): Promise<{ user: TestUser; session: any }> {
  const user = createUser(userData);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (error) {
    throw new Error(`Failed to login: ${error.message}`);
  }

  return { user, session: data.session };
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/login');
}

/**
 * Create and auto-login a user (setup only, not testing auth flow)
 */
export async function setupAuthenticatedUser(
  page: Page,
  userData: Partial<TestUser> = {}
): Promise<TestUser> {
  const user = createUser(userData);
  const supabase = await createClient();

  // Create user via API
  await supabase.auth.signUp({
    email: user.email,
    password: user.password,
  });

  // Login via API to get session
  const { data } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  // Inject session into browser
  await page.goto('/');
  await page.evaluate((session) => {
    localStorage.setItem('supabase.auth.token', JSON.stringify(session));
  }, data.session);

  await page.goto('/dashboard');

  return user;
}
