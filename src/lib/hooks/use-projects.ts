import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { formatScore } from "@/lib/matching/scoring";
import type { ScoreBreakdown } from "@/lib/supabase/types";

type Posting = {
  id: string;
  title: string;
  description: string;
  skills: string[];
  team_size_min: number;
  team_size_max: number;
  category:
    | "study"
    | "hackathon"
    | "personal"
    | "professional"
    | "social"
    | null;
  tags: string[];
  mode: "open" | "friend_ask";
  location_preference: number | null;
  estimated_time: string | null;
  skill_level_min: number | null;
  context_identifier: string | null;
  natural_language_criteria: string | null;
  status: string;
  created_at: string;
  creator_id: string;
  profiles?: {
    full_name: string | null;
    user_id: string;
  };
};

/** @deprecated Use Posting */
type Project = Posting;

type PostingWithScore = Posting & {
  compatibility_score?: number;
  score_breakdown?: ScoreBreakdown;
};

/** @deprecated Use PostingWithScore */
type ProjectWithScore = PostingWithScore;

type TabId = "discover" | "my-postings";

type PostingsResult = {
  postings: PostingWithScore[];
  userId: string | null;
  isLoadingScores: boolean;
};

async function fetchPostings(key: string): Promise<PostingsResult> {
  const tab = key.split("/")[1] as TabId;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("postings")
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

  if (tab === "my-postings" && user) {
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

  const postings = (data || []) as PostingWithScore[];

  // Compute compatibility scores for discover tab
  if (tab === "discover" && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      const scored = await Promise.all(
        postings.map(async (posting) => {
          try {
            const { data: breakdown, error: rpcError } = await supabase.rpc(
              "compute_match_breakdown",
              {
                profile_user_id: user.id,
                target_posting_id: posting.id,
              },
            );

            if (!rpcError && breakdown) {
              const overallScore =
                breakdown.semantic * 0.3 +
                breakdown.availability * 0.3 +
                breakdown.skill_level * 0.2 +
                breakdown.location * 0.2;

              return {
                ...posting,
                compatibility_score: overallScore,
                score_breakdown: breakdown as ScoreBreakdown,
              };
            }
          } catch (err) {
            console.error(
              `Failed to compute score for posting ${posting.id}:`,
              err,
            );
          }
          return posting;
        }),
      );
      return {
        postings: scored,
        userId: user?.id ?? null,
        isLoadingScores: false,
      };
    }
  }

  return { postings, userId: user?.id ?? null, isLoadingScores: false };
}

export function usePostings(tab: TabId) {
  const { data, error, isLoading } = useSWR(`postings/${tab}`, fetchPostings, {
    keepPreviousData: true,
  });

  return {
    postings: data?.postings ?? [],
    userId: data?.userId ?? null,
    error,
    isLoading,
  };
}

/** @deprecated Use usePostings */
export const useProjects = usePostings;

export { formatScore };
export type { Posting, PostingWithScore, Project, ProjectWithScore, TabId };
