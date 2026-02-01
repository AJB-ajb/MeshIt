/**
 * GitHub Profile Database Operations
 * Handles storage and retrieval of GitHub profile data
 */

import { createClient } from '../supabase/server';
import type { GitHubProfileData, GitHubProfileRow, GitHubProfileInsert } from './types';
import type { ProfileUpdate } from '../supabase/types';

/**
 * Save GitHub profile data to database
 */
export async function saveGitHubProfile(
  userId: string,
  data: GitHubProfileData
): Promise<void> {
  const supabase = await createClient();

  const insert: GitHubProfileInsert = {
    user_id: userId,
    github_id: data.githubId,
    github_username: data.githubUsername,
    github_url: data.githubUrl,
    avatar_url: data.avatarUrl,
    primary_languages: data.primaryLanguages,
    topics: data.topics,
    repo_count: data.repoCount,
    total_stars: data.totalStars,
    inferred_skills: data.inferredSkills,
    inferred_interests: data.inferredInterests,
    coding_style: data.codingStyle,
    collaboration_style: data.collaborationStyle,
    experience_level: data.experienceLevel,
    experience_signals: data.experienceSignals,
    suggested_bio: data.suggestedBio,
    activity_level: data.activityLevel,
    last_active_at: data.lastActiveAt,
    raw_repos: data.rawRepos,
    last_synced_at: data.lastSyncedAt,
    sync_status: data.syncStatus,
    sync_error: data.syncError || null,
  };

  const { error } = await supabase
    .from('github_profiles')
    .upsert(insert, { onConflict: 'user_id' });

  if (error) {
    throw new Error(`Failed to save GitHub profile: ${error.message}`);
  }
}

/**
 * Get GitHub profile data from database
 */
export async function getGitHubProfile(
  userId: string
): Promise<GitHubProfileData | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('github_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get GitHub profile: ${error.message}`);
  }

  if (!data) return null;

  return mapRowToProfileData(data as GitHubProfileRow);
}

/**
 * Update sync status
 */
export async function updateSyncStatus(
  userId: string,
  status: 'pending' | 'syncing' | 'completed' | 'failed',
  error?: string
): Promise<void> {
  const supabase = await createClient();

  const update: Partial<GitHubProfileInsert> = {
    sync_status: status,
    sync_error: error || null,
  };

  if (status === 'completed') {
    update.last_synced_at = new Date().toISOString();
  }

  const { error: dbError } = await supabase
    .from('github_profiles')
    .update(update)
    .eq('user_id', userId);

  if (dbError) {
    console.error(`Failed to update sync status: ${dbError.message}`);
  }
}

/**
 * Check if sync is needed (more than 24 hours since last sync)
 */
export async function isSyncNeeded(
  userId: string,
  maxAgeHours: number = 24
): Promise<boolean> {
  const profile = await getGitHubProfile(userId);

  if (!profile) return true;

  const lastSync = new Date(profile.lastSyncedAt);
  const hoursSinceSync =
    (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

  return hoursSinceSync >= maxAgeHours;
}

/**
 * Update user profile with merged GitHub data
 */
export async function updateUserProfile(
  userId: string,
  update: ProfileUpdate
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      ...update,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get user profile: ${error.message}`);
  }

  return data;
}

/**
 * Map database row to GitHubProfileData
 */
function mapRowToProfileData(row: GitHubProfileRow): GitHubProfileData {
  return {
    githubId: row.github_id,
    githubUsername: row.github_username,
    githubUrl: row.github_url,
    avatarUrl: row.avatar_url,
    primaryLanguages: row.primary_languages || [],
    topics: row.topics || [],
    repoCount: row.repo_count || 0,
    totalStars: row.total_stars || 0,
    inferredSkills: row.inferred_skills || [],
    inferredInterests: row.inferred_interests || [],
    codingStyle: row.coding_style || '',
    collaborationStyle: (row.collaboration_style as 'async' | 'sync' | 'hybrid') || 'hybrid',
    experienceLevel: (row.experience_level as 'junior' | 'intermediate' | 'senior' | 'lead') || 'intermediate',
    experienceSignals: row.experience_signals || [],
    suggestedBio: row.suggested_bio || '',
    activityLevel: (row.activity_level as 'low' | 'medium' | 'high') || 'medium',
    lastActiveAt: row.last_active_at,
    rawRepos: row.raw_repos || [],
    lastSyncedAt: row.last_synced_at,
    syncStatus: (row.sync_status as 'pending' | 'syncing' | 'completed' | 'failed') || 'pending',
    syncError: row.sync_error || undefined,
  };
}
