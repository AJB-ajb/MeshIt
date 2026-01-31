import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MatchResponse } from "@/lib/supabase/types";

/**
 * GET /api/matches/[id]
 * Returns full match details including profile and project information
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch match with joined profile and project data
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(
        `
        *,
        project:projects(*),
        profile:profiles(*)
      `
      )
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify user has access to this match
    const project = match.project as any;
    const profile = match.profile as any;

    if (
      match.user_id !== user.id &&
      project?.creator_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Transform to API response format
    const response: MatchResponse = {
      id: match.id,
      project: project,
      profile: profile,
      score: match.similarity_score,
      explanation: match.explanation,
      score_breakdown: match.score_breakdown,
      status: match.status,
      created_at: match.created_at,
    };

    return NextResponse.json({ match: response });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch match",
      },
      { status: 500 }
    );
  }
}
