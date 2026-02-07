import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";

type SearchResult = {
  id: string;
  type: "project" | "profile";
  title: string;
  subtitle: string;
  skills: string[];
  status?: string;
};

async function fetchSearchResults(key: string): Promise<SearchResult[]> {
  const query = key.replace("search/", "");
  if (!query.trim()) return [];

  const supabase = createClient();
  const searchTerm = `%${query.toLowerCase()}%`;

  const [{ data: projects }, { data: profiles }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, description, required_skills, status")
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(5),
    supabase
      .from("profiles")
      .select("user_id, full_name, headline, skills")
      .or(`full_name.ilike.${searchTerm},headline.ilike.${searchTerm}`)
      .limit(5),
  ]);

  const projectResults: SearchResult[] = (projects || []).map((p) => ({
    id: p.id,
    type: "project",
    title: p.title,
    subtitle:
      p.description?.slice(0, 80) + (p.description?.length > 80 ? "..." : "") ||
      "",
    skills: p.required_skills || [],
    status: p.status,
  }));

  const profileResults: SearchResult[] = (profiles || []).map((p) => ({
    id: p.user_id,
    type: "profile",
    title: p.full_name || "Unknown",
    subtitle: p.headline || "",
    skills: p.skills || [],
  }));

  return [...projectResults, ...profileResults];
}

export function useSearch(query: string) {
  const { data, error, isLoading } = useSWR(
    query.trim() ? `search/${query}` : null,
    fetchSearchResults,
    { dedupingInterval: 300, keepPreviousData: true },
  );

  return {
    results: data ?? [],
    error,
    isLoading,
  };
}

export type { SearchResult };
