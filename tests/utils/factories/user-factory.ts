/**
 * User Factory
 * Creates test user data following data-factories.md patterns
 */

import { faker } from '@faker-js/faker';

export type TestUser = {
  email: string;
  password: string;
  full_name: string;
  avatar_url?: string;
  provider?: 'google' | 'github' | 'linkedin' | 'slack' | 'discord';
};

export const createUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  email: faker.internet.email().toLowerCase(),
  password: 'Test123!@#', // Strong password for test accounts
  full_name: faker.person.fullName(),
  avatar_url: faker.image.avatar(),
  provider: 'google',
  ...overrides,
});

/**
 * Create multiple users at once
 */
export const createUsers = (count: number, overrides: Partial<TestUser> = {}): TestUser[] => {
  return Array.from({ length: count }, () => createUser(overrides));
};

/**
 * Create admin user
 */
export const createAdminUser = (overrides: Partial<TestUser> = {}): TestUser => {
  return createUser({
    email: `admin-${faker.string.alphanumeric(8)}@meshit.test`,
    full_name: 'Admin User',
    ...overrides,
  });
};
