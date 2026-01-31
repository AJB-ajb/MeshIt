import { Metadata } from "next";
import Link from "next/link";
import { Search, Filter, Check, X, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Matches",
};

const statusColors = {
  pending: "bg-warning/10 text-warning",
  applied: "bg-info/10 text-info",
  accepted: "bg-success/10 text-success",
  declined: "bg-muted text-muted-foreground",
};

const statusLabels = {
  pending: "Pending",
  applied: "Applied",
  accepted: "Accepted",
  declined: "Declined",
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
};

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let matches: Array<{
    id: string;
    projectTitle: string;
    projectId: string;
    matchScore: number;
    status: string;
    explanation: string | null;
    matchedAt: string;
  }> = [];

  if (user) {
    const { data: matchesData, error } = await supabase
      .from("matches")
      .select(
        `
        id,
        similarity_score,
        explanation,
        status,
        created_at,
        projects:project_id (
          id,
          title
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && matchesData) {
      matches = matchesData.map((match: any) => ({
        id: match.id,
        projectTitle: match.projects?.title || "Unknown Project",
        projectId: match.projects?.id || "",
        matchScore: Math.round(match.similarity_score * 100),
        status: match.status,
        explanation: match.explanation || "No explanation available.",
        matchedAt: formatTimeAgo(match.created_at),
      }));
    }
  }
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
        <p className="mt-1 text-muted-foreground">
          Projects that match your skills and interests
        </p>
      </div>

      {/* Search and filter */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search matches..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filter</span>
        </Button>
      </div>

      {/* Matches list */}
      <div className="space-y-4">
        {matches.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                No matches found. Keep your profile updated to discover matching projects!
              </p>
            </CardContent>
          </Card>
        ) : (
          matches.map((match) => (
          <Card key={match.id}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">
                      <Link
                        href={`/projects/${match.projectId}`}
                        className="hover:underline"
                      >
                        {match.projectTitle}
                      </Link>
                    </CardTitle>
                    <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      {match.matchScore}% match
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[match.status as keyof typeof statusColors]
                      }`}
                    >
                      {statusLabels[match.status as keyof typeof statusLabels]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Matched {match.matchedAt}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Why you matched */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Why you matched
                </p>
                <p className="text-sm">{match.explanation}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {match.status === "pending" && (
                  <>
                    <Button className="flex-1 sm:flex-none">
                      <Check className="h-4 w-4" />
                      Apply
                    </Button>
                    <Button variant="outline">
                      <X className="h-4 w-4" />
                      Decline
                    </Button>
                  </>
                )}
                {match.status === "applied" && (
                  <Button variant="secondary" disabled>
                    Application Sent
                  </Button>
                )}
                {match.status === "accepted" && (
                  <Button>
                    <MessageSquare className="h-4 w-4" />
                    Message Team
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link href={`/projects/${match.projectId}`}>View Project</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </div>
  );
}
