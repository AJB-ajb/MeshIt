import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MatchResponse } from "@/lib/supabase/types";

/**
 * PATCH /api/matches/[id]/apply
 * User applies to a project match
 * Changes status from 'pending' to 'applied'
 */
export async function PATCH(
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

    // Fetch the match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify user owns this match
    if (match.user_id !== user.id) {
      return NextResponse.json(
        { error: "Only the matched user can apply" },
        { status: 403 }
      );
    }

    // Verify match is in pending status
    if (match.status !== "pending") {
      return NextResponse.json(
        { error: `Match is already ${match.status}` },
        { status: 400 }
      );
    }

    // Update match status to 'applied'
    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update({
        status: "applied",
        responded_at: new Date().toISOString(),
      })
      .eq("id", matchId)
      .select(
        `
        *,
        project:projects(*),
        profile:profiles(*)
      `
      )
      .single();

    if (updateError || !updatedMatch) {
      return NextResponse.json(
        { error: "Failed to update match" },
        { status: 500 }
      );
    }

    const project = updatedMatch.project as any;
    const profile = updatedMatch.profile as any;

    const response: MatchResponse = {
      id: updatedMatch.id,
      project: project,
      profile: profile,
      score: updatedMatch.similarity_score,
      explanation: updatedMatch.explanation,
      score_breakdown: updatedMatch.score_breakdown,
      status: updatedMatch.status,
      created_at: updatedMatch.created_at,
    };

    return NextResponse.json({ match: response });
  } catch (error) {
    console.error("Error applying to match:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to apply to match",
      },
      { status: 500 }
    );
  }
}
