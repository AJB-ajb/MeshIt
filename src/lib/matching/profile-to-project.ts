/**
 * Profile-to-Project Matching
 * Finds projects that match a user's profile using pgvector cosine similarity
 */

import { createClient } from "@/lib/supabase/server";
import type { Project, Match } from "@/lib/supabase/types";

export interface ProfileToProjectMatch {
  project: Project;
  score: number; // 0-1 similarity score
  matchId?: string; // If match record already exists
}

/**
 * Finds projects matching a user's profile
 * Uses the match_projects_to_user database function with pgvector similarity
 * 
 * @param userId The user ID to find matches for
 * @param limit Maximum number of matches to return (default: 10)
 * @returns Array of matching projects with similarity scores
 */
export async function matchProfileToProjects(
  userId: string,
  limit: number = 10
): Promise<ProfileToProjectMatch[]> {
  const supabase = await createClient();

  // First, get the user's profile and embedding
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("embedding")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error(`Profile not found for user ${userId}`);
  }

  if (!profile.embedding || !Array.isArray(profile.embedding)) {
    throw new Error(`Profile embedding not found for user ${userId}`);
  }

  // Call the database function to find matching projects
  const { data, error } = await supabase.rpc("match_projects_to_user", {
    user_embedding: profile.embedding,
    user_id_param: userId,
    match_limit: limit,
  });

  if (error) {
    throw new Error(`Failed to match projects: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Check for existing match records
  const projectIds = data.map((row: any) => row.project_id);
  const { data: existingMatches } = await supabase
    .from("matches")
    .select("id, project_id, similarity_score, status")
    .eq("user_id", userId)
    .in("project_id", projectIds);

  const matchMap = new Map(
    existingMatches?.map((m) => [m.project_id, m]) || []
  );

  // Transform results into match objects
  const matches: ProfileToProjectMatch[] = data.map((row: any) => {
    const project: Project = {
      id: row.project_id,
      creator_id: row.creator_id,
      title: row.title,
      description: row.description,
      required_skills: row.required_skills || [],
      team_size: row.team_size,
      experience_level: row.experience_level,
      commitment_hours: row.commitment_hours,
      timeline: row.timeline,
      embedding: null, // Don't return embedding in response
      status: "open",
      created_at: row.created_at,
      updated_at: row.created_at,
      expires_at: row.expires_at,
    };

    const existingMatch = matchMap.get(row.project_id);

    return {
      project,
      score: row.similarity,
      matchId: existingMatch?.id,
    };
  });

  return matches;
}

/**
 * Creates or updates match records in the database
 * Called after finding matches to persist them
 */
export async function createMatchRecords(
  userId: string,
  matches: ProfileToProjectMatch[]
): Promise<void> {
  const supabase = await createClient();

  const matchInserts = matches
    .filter((m) => !m.matchId) // Only create new matches
    .map((m) => ({
      user_id: userId,
      project_id: m.project.id,
      similarity_score: m.score,
      status: "pending" as const,
    }));

  if (matchInserts.length === 0) {
    return;
  }

  const { error } = await supabase.from("matches").upsert(matchInserts, {
    onConflict: "project_id,user_id",
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(`Failed to create match records: ${error.message}`);
  }
}
