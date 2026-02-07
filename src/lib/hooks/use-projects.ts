import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { formatScore } from "@/lib/matching/scoring";
import type { ScoreBreakdown } from "@/lib/supabase/types";

type Project = {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  team_size: number;
  timeline: string;
  commitment_hours: number;
  status: string;
  created_at: string;
  creator_id: string;
  profiles?: {
    full_name: string | null;
    user_id: string;
  };
};

type ProjectWithScore = Project & {
  compatibility_score?: number;
  score_breakdown?: ScoreBreakdown;
};

type TabId = "discover" | "my-projects";

type ProjectsResult = {
  projects: ProjectWithScore[];
  userId: string | null;
  isLoadingScores: boolean;
};

async function fetchProjects(key: string): Promise<ProjectsResult> {
  const tab = key.split("/")[1] as TabId;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("projects")
    .select(
      `
      *,
      profiles:creator_id (
        full_name,
        user_id
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (tab === "my-projects" && user) {
    query = query.eq("creator_id", user.id);
  } else {
    query = query.eq("status", "open");
    if (user) {
      query = query.neq("creator_id", user.id);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const projects = (data || []) as ProjectWithScore[];

  // Compute compatibility scores for discover tab
  if (tab === "discover" && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      const scored = await Promise.all(
        projects.map(async (project) => {
          try {
            const { data: breakdown, error: rpcError } = await supabase.rpc(
              "compute_match_breakdown",
              {
                profile_user_id: user.id,
                target_project_id: project.id,
              },
            );

            if (!rpcError && breakdown) {
              const overallScore =
                breakdown.semantic * 0.4 +
                breakdown.skills_overlap * 0.3 +
                breakdown.experience_match * 0.15 +
                breakdown.commitment_match * 0.15;

              return {
                ...project,
                compatibility_score: overallScore,
                score_breakdown: breakdown as ScoreBreakdown,
              };
            }
          } catch (err) {
            console.error(
              `Failed to compute score for project ${project.id}:`,
              err,
            );
          }
          return project;
        }),
      );
      return {
        projects: scored,
        userId: user?.id ?? null,
        isLoadingScores: false,
      };
    }
  }

  return { projects, userId: user?.id ?? null, isLoadingScores: false };
}

export function useProjects(tab: TabId) {
  const { data, error, isLoading } = useSWR(`projects/${tab}`, fetchProjects, {
    keepPreviousData: true,
  });

  return {
    projects: data?.projects ?? [],
    userId: data?.userId ?? null,
    error,
    isLoading,
  };
}

export { formatScore };
export type { Project, ProjectWithScore, TabId };
