import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MatchResponse } from "@/lib/supabase/types";

/**
 * PATCH /api/matches/[id]/decline
 * Project owner declines an applicant
 * Changes status from 'applied' to 'declined'
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

    // Fetch the match with project info
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(`
        *,
        project:projects(*)
      `)
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const project = match.project as any;

    // Verify user is the project creator
    if (project?.creator_id !== user.id) {
      return NextResponse.json(
        { error: "Only project creators can decline applicants" },
        { status: 403 }
      );
    }

    // Verify match is in applied status
    if (match.status !== "applied") {
      return NextResponse.json(
        { error: `Match is not in 'applied' status (current: ${match.status})` },
        { status: 400 }
      );
    }

    // Update match status to 'declined'
    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update({
        status: "declined",
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

    const updatedProject = updatedMatch.project as any;
    const profile = updatedMatch.profile as any;

    const response: MatchResponse = {
      id: updatedMatch.id,
      project: updatedProject,
      profile: profile,
      score: updatedMatch.similarity_score,
      explanation: updatedMatch.explanation,
      status: updatedMatch.status,
      created_at: updatedMatch.created_at,
    };

    return NextResponse.json({ match: response });
  } catch (error) {
    console.error("Error declining match:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to decline match",
      },
      { status: 500 }
    );
  }
}
