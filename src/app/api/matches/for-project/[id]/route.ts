import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  matchProjectToProfiles,
  createMatchRecordsForProject,
} from "@/lib/matching/project-to-profile";
import type { MatchResponse } from "@/lib/supabase/types";

/**
 * GET /api/matches/for-project/[id]
 * Returns profiles matching a specific project (project owner only)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is the project creator
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("creator_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.creator_id !== user.id) {
      return NextResponse.json(
        { error: "Only project creators can view matches" },
        { status: 403 }
      );
    }

    // Find matching profiles
    const matches = await matchProjectToProfiles(projectId, 10);

    // Create match records in database if they don't exist
    await createMatchRecordsForProject(projectId, matches);

    // Transform to API response format
    const response: MatchResponse[] = matches.map((match) => ({
      id: match.matchId || "",
      profile: match.profile,
      score: match.score,
      explanation: null, // Will be generated async if needed
      status: "pending",
      created_at: new Date().toISOString(),
    }));

    return NextResponse.json({ matches: response });
  } catch (error) {
    console.error("Error fetching project matches:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch project matches",
      },
      { status: 500 }
    );
  }
}
