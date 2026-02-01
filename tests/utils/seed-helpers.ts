/**
 * Seed Helpers
 * API-first seeding for test data (fast setup, no UI)
 */

import { APIRequestContext } from '@playwright/test';
import { createClient } from '@/lib/supabase/server';
import type { TestUser } from '../factories/user-factory';
import type { TestProfile } from '../factories/profile-factory';
import type { TestProject } from '../factories/project-factory';
import type { TestMatch } from '../factories/match-factory';

/**
 * Seed a user via Supabase API
 */
export async function seedUser(userData: TestUser): Promise<{ userId: string; user: TestUser }> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });

  if (error) {
    throw new Error(`Failed to seed user: ${error.message}`);
  }

  return { userId: data.user!.id, user: userData };
}

/**
 * Seed a profile via API
 */
export async function seedProfile(
  request: APIRequestContext,
  profileData: TestProfile
): Promise<TestProfile> {
  const response = await request.post('/api/profile', {
    data: profileData,
  });

  if (!response.ok()) {
    throw new Error(`Failed to seed profile: ${response.statusText()}`);
  }

  return await response.json();
}

/**
 * Seed a project via API
 */
export async function seedProject(
  request: APIRequestContext,
  projectData: TestProject
): Promise<TestProject> {
  const response = await request.post('/api/projects', {
    data: projectData,
  });

  if (!response.ok()) {
    throw new Error(`Failed to seed project: ${response.statusText()}`);
  }

  return await response.json();
}

/**
 * Seed multiple projects
 */
export async function seedProjects(
  request: APIRequestContext,
  projects: TestProject[]
): Promise<TestProject[]> {
  return Promise.all(projects.map((p) => seedProject(request, p)));
}

/**
 * Seed a match via database (matches are typically system-generated)
 */
export async function seedMatch(matchData: TestMatch): Promise<TestMatch> {
  const supabase = await createClient();

  const { data, error } = await supabase.from('matches').insert(matchData).select().single();

  if (error) {
    throw new Error(`Failed to seed match: ${error.message}`);
  }

  return data;
}

/**
 * Clean up test data
 */
export async function cleanupTestData(userId: string): Promise<void> {
  const supabase = await createClient();

  // Delete cascades via foreign keys
  await supabase.auth.admin.deleteUser(userId);
}
