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

    // Check if user has a profile first
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("bio, skills, headline")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { 
          error: "Profile not found. Please complete your profile first.",
          matches: []
        },
        { status: 200 }
      );
    }

    // Check if profile has enough data for matching
    const hasData = profile.bio || (profile.skills && profile.skills.length > 0) || profile.headline;
    if (!hasData) {
      return NextResponse.json(
        { 
          error: "Please add a bio, skills, or headline to your profile to find matches.",
          matches: []
        },
        { status: 200 }
      );
    }

    // Find matching projects
    const matches = await matchProfileToProjects(user.id, 10);

    // Create match records in database if they don't exist
    if (matches.length > 0) {
      await createMatchRecords(user.id, matches);
    }

    // Transform to API response format
    const response: MatchResponse[] = matches.map((match) => ({
      id: match.matchId || "",
      project: match.project,
      score: match.score,
      explanation: null, // Will be generated async if needed
      score_breakdown: match.scoreBreakdown,
      status: "pending",
      created_at: match.project.created_at,
    }));

    return NextResponse.json({ matches: response });
  } catch (error) {
    console.error("Error fetching matches:", error);
    
    // Return helpful error message
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch matches";
    
    // Check if it's an OpenAI API key issue
    if (errorMessage.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { 
          error: "Matching service is temporarily unavailable. Please try again later.",
          matches: []
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage, matches: [] },
      { status: 500 }
    );
  }
}
