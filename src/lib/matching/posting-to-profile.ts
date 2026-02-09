/**
 * Posting-to-Profile Matching
 * Finds profiles that match a posting using pgvector cosine similarity
 */

import { createClient } from "@/lib/supabase/server";
import type { Profile, ScoreBreakdown } from "@/lib/supabase/types";
import { generatePostingEmbedding } from "@/lib/ai/embeddings";
import { getTestDataValue } from "@/lib/environment";

export interface PostingToProfileMatch {
  profile: Profile;
  score: number; // 0-1 similarity score
  scoreBreakdown: ScoreBreakdown | null;
  matchId?: string; // If match record already exists
}

/**
 * Finds profiles matching a posting
 * Uses the match_users_to_posting database function with pgvector similarity
 *
 * @param postingId The posting ID to find matches for
 * @param limit Maximum number of matches to return (default: 10)
 * @returns Array of matching profiles with similarity scores
 */
export async function matchPostingToProfiles(
  postingId: string,
  limit: number = 10,
): Promise<PostingToProfileMatch[]> {
  const supabase = await createClient();

  // First, get the posting and its embedding
  const { data: posting, error: postingError } = await supabase
    .from("postings")
    .select("embedding, creator_id, title, description, skills")
    .eq("id", postingId)
    .eq("is_test_data", getTestDataValue())
    .single();

  if (postingError || !posting) {
    throw new Error(`Posting not found: ${postingId}`);
  }

  // If no embedding exists, try to generate one
  let embedding = posting.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    try {
      embedding = await generatePostingEmbedding(
        posting.title,
        posting.description,
        posting.skills,
      );

      // Save the generated embedding
      await supabase.from("postings").update({ embedding }).eq("id", postingId);
    } catch (embeddingError) {
      console.warn("Could not generate posting embedding:", embeddingError);
      throw new Error(
        "Could not generate posting embedding. Please ensure the posting has a title and description.",
      );
    }
  }

  // Call the database function to find matching profiles
  const { data, error } = await supabase.rpc("match_users_to_posting", {
    posting_embedding: embedding,
    posting_id_param: postingId,
    match_limit: limit,
  });

  if (error) {
    throw new Error(`Failed to match profiles: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Check for existing match records
  const userIds = data.map((row: { user_id: string }) => row.user_id);
  const { data: existingMatches } = await supabase
    .from("matches")
    .select("id, user_id, similarity_score, status, score_breakdown")
    .eq("posting_id", postingId)
    .in("user_id", userIds);

  const matchMap = new Map(existingMatches?.map((m) => [m.user_id, m]) || []);

  // Transform results into match objects and compute breakdowns
  const matches: PostingToProfileMatch[] = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.map(async (row: any) => {
      const profile: Profile = {
        user_id: row.user_id,
        full_name: row.full_name,
        headline: row.headline,
        bio: row.bio,
        location: row.location || null,
        location_lat: row.location_lat || null,
        location_lng: row.location_lng || null,
        skills: row.skills || [],
        skill_levels: row.skill_levels || null,
        interests: row.interests || null,
        languages: row.languages || null,
        portfolio_url: row.portfolio_url || null,
        github_url: row.github_url || null,
        location_preference: row.location_preference ?? null,
        availability_slots: row.availability_slots || null,
        embedding: null, // Don't return embedding in response
        is_test_data: row.is_test_data || false,
        created_at: row.created_at || "",
        updated_at: row.updated_at || "",
      };

      const existingMatch = matchMap.get(row.user_id);

      // Compute score breakdown using database function
      let scoreBreakdown: ScoreBreakdown | null = null;
      if (existingMatch?.score_breakdown) {
        // Use existing breakdown if available
        scoreBreakdown = existingMatch.score_breakdown as ScoreBreakdown;
      } else {
        // Compute new breakdown
        const { data: breakdown, error: breakdownError } = await supabase.rpc(
          "compute_match_breakdown",
          {
            profile_user_id: row.user_id,
            target_posting_id: postingId,
          },
        );

        if (!breakdownError && breakdown) {
          scoreBreakdown = breakdown as ScoreBreakdown;
        }
      }

      return {
        profile,
        score: row.similarity,
        scoreBreakdown,
        matchId: existingMatch?.id,
      };
    }),
  );

  return matches;
}

/**
 * Creates or updates match records in the database
 * Called after finding matches to persist them
 */
export async function createMatchRecordsForPosting(
  postingId: string,
  matches: PostingToProfileMatch[],
): Promise<void> {
  const supabase = await createClient();

  const matchInserts = matches
    .filter((m) => !m.matchId) // Only create new matches
    .map((m) => ({
      posting_id: postingId,
      user_id: m.profile.user_id,
      similarity_score: m.score,
      score_breakdown: m.scoreBreakdown,
      status: "pending" as const,
    }));

  if (matchInserts.length > 0) {
    const { error } = await supabase.from("matches").upsert(matchInserts, {
      onConflict: "posting_id,user_id",
      ignoreDuplicates: false,
    });

    if (error) {
      throw new Error(`Failed to create match records: ${error.message}`);
    }
  }

  // Update existing matches that are missing score_breakdown
  const updatesToMake = matches
    .filter((m) => m.matchId && m.scoreBreakdown) // Has matchId and computed breakdown
    .map((m) => ({
      id: m.matchId!,
      score_breakdown: m.scoreBreakdown,
    }));

  if (updatesToMake.length > 0) {
    // Update each match individually to set score_breakdown
    for (const update of updatesToMake) {
      const { error } = await supabase
        .from("matches")
        .update({ score_breakdown: update.score_breakdown })
        .eq("id", update.id)
        .is("score_breakdown", null); // Only update if currently null

      if (error) {
        console.warn(
          `Failed to update breakdown for match ${update.id}:`,
          error,
        );
        // Don't throw - this is not critical
      }
    }
  }
}
