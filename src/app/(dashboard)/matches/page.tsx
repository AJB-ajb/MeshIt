"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, Check, X, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchBreakdown } from "@/components/match/match-breakdown";
import type { MatchResponse, Profile } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { formatScore } from "@/lib/matching/scoring";

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

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const supabase = createClient();

        // Fetch matches
        const matchesResponse = await fetch("/api/matches/for-me");
        if (!matchesResponse.ok) {
          throw new Error("Failed to fetch matches");
        }
        const matchesData = await matchesResponse.json();
        setMatches(matchesData.matches || []);

        // Fetch current user's profile for breakdown display
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (!profileError && profileData) {
            setProfile(profileData);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load matches");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
          <p className="mt-1 text-muted-foreground">
            Projects that match your skills and interests
          </p>
        </div>
        <div className="text-muted-foreground">Loading matches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
          <p className="mt-1 text-muted-foreground">
            Projects that match your skills and interests
          </p>
        </div>
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
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
      {matches.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground">
            No matches found. Complete your profile to get better matches!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            if (!match.project) return null;

            // Format time ago
            const matchDate = new Date(match.created_at);
            const now = new Date();
            const diffMs = now.getTime() - matchDate.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            let timeAgo: string;
            if (diffMins < 1) {
              timeAgo = "just now";
            } else if (diffMins < 60) {
              timeAgo = `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
            } else if (diffHours < 24) {
              timeAgo = `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
            } else {
              timeAgo = `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
            }

            return (
              <Card key={match.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-xl">
                          <Link
                            href={`/projects/${match.project.id}`}
                            className="hover:underline"
                          >
                            {match.project.title}
                          </Link>
                        </CardTitle>
                        <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                          {formatScore(match.score)} match
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusColors[match.status]
                          }`}
                        >
                          {statusLabels[match.status]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Matched {timeAgo}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Why you matched */}
                  {match.explanation && (
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Why you matched
                      </p>
                      <p className="text-sm">{match.explanation}</p>
                    </div>
                  )}

                  {/* Match Breakdown */}
                  {match.score_breakdown && match.project && profile && (
                    <MatchBreakdown
                      breakdown={match.score_breakdown}
                      project={{
                        required_skills: match.project.required_skills,
                        experience_level: match.project.experience_level,
                        commitment_hours: match.project.commitment_hours,
                      }}
                      profile={{
                        skills: profile.skills,
                        experience_level: profile.experience_level,
                        availability_hours: profile.availability_hours,
                      }}
                    />
                  )}

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
                      <Link href={`/projects/${match.project.id}`}>
                        View Project
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
