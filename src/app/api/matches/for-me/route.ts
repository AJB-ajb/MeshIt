import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { matchProfileToProjects, createMatchRecords } from "@/lib/matching/profile-to-project";
import type { MatchResponse } from "@/lib/supabase/types";

/**
 * GET /api/matches/for-me
 * Returns projects matching the authenticated user's profile
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find matching projects
    const matches = await matchProfileToProjects(user.id, 10);

    // Create match records in database if they don't exist
    await createMatchRecords(user.id, matches);

    // Transform to API response format
    const response: MatchResponse[] = matches.map((match) => ({
      id: match.matchId || "",
      project: match.project,
      score: match.score,
      explanation: null, // Will be generated async if needed
      status: "pending",
      created_at: match.project.created_at,
    }));

    return NextResponse.json({ matches: response });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
