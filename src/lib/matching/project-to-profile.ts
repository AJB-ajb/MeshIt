/**
 * Project-to-Profile Matching
 * Finds profiles that match a project using pgvector cosine similarity
 */

import { createClient } from "@/lib/supabase/server";
import type { Profile, Match } from "@/lib/supabase/types";

export interface ProjectToProfileMatch {
  profile: Profile;
  score: number; // 0-1 similarity score
  matchId?: string; // If match record already exists
}

/**
 * Finds profiles matching a project
 * Uses the match_users_to_project database function with pgvector similarity
 * 
 * @param projectId The project ID to find matches for
 * @param limit Maximum number of matches to return (default: 10)
 * @returns Array of matching profiles with similarity scores
 */
export async function matchProjectToProfiles(
  projectId: string,
  limit: number = 10
): Promise<ProjectToProfileMatch[]> {
  const supabase = await createClient();

  // First, get the project and its embedding
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("embedding, creator_id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  if (!project.embedding || !Array.isArray(project.embedding)) {
    throw new Error(`Project embedding not found for project ${projectId}`);
  }

  // Call the database function to find matching profiles
  const { data, error } = await supabase.rpc("match_users_to_project", {
    project_embedding: project.embedding,
    project_id_param: projectId,
    match_limit: limit,
  });

  if (error) {
    throw new Error(`Failed to match profiles: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Check for existing match records
  const userIds = data.map((row: any) => row.user_id);
  const { data: existingMatches } = await supabase
    .from("matches")
    .select("id, user_id, similarity_score, status")
    .eq("project_id", projectId)
    .in("user_id", userIds);

  const matchMap = new Map(
    existingMatches?.map((m) => [m.user_id, m]) || []
  );

  // Transform results into match objects
  const matches: ProjectToProfileMatch[] = data.map((row: any) => {
    const profile: Profile = {
      user_id: row.user_id,
      full_name: row.full_name,
      headline: row.headline,
      bio: row.bio,
      location: null,
      experience_level: row.experience_level,
      collaboration_style: row.collaboration_style,
      availability_hours: row.availability_hours,
      skills: row.skills || [],
      interests: null,
      portfolio_url: null,
      github_url: null,
      project_preferences: {},
      embedding: null, // Don't return embedding in response
      created_at: "",
      updated_at: "",
    };

    const existingMatch = matchMap.get(row.user_id);

    return {
      profile,
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
export async function createMatchRecordsForProject(
  projectId: string,
  matches: ProjectToProfileMatch[]
): Promise<void> {
  const supabase = await createClient();

  const matchInserts = matches
    .filter((m) => !m.matchId) // Only create new matches
    .map((m) => ({
      project_id: projectId,
      user_id: m.profile.user_id,
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
