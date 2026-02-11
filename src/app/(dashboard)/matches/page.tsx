"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Check,
  MessageSquare,
  Loader2,
  Heart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useMatches } from "@/lib/hooks/use-matches";
import { useInterests } from "@/lib/hooks/use-interests";
import type { Posting } from "@/lib/supabase/types";
import { getInitials } from "@/lib/format";

const statusColors = {
  pending: "bg-warning/10 text-warning",
  applied: "bg-info/10 text-info",
  accepted: "bg-success/10 text-success",
  declined: "bg-muted text-muted-foreground",
  interested: "bg-pink-500/10 text-pink-600",
};

const statusLabels = {
  pending: "Pending",
  applied: "Applied",
  accepted: "Accepted",
  declined: "Declined",
  interested: "Interested",
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
}

export default function MatchesPage() {
  const {
    matches,
    apiError,
    error: fetchError,
    isLoading: matchesLoading,
    mutate,
  } = useMatches();
  const {
    myInterests,
    interestsReceived,
    isLoading: interestsLoading,
  } = useInterests();
  const [applyingMatchId, setApplyingMatchId] = useState<string | null>(null);

  const isLoading = matchesLoading || interestsLoading;

  const error = fetchError
    ? fetchError instanceof Error
      ? fetchError.message
      : "Failed to load matches"
    : apiError;

  const handleApply = async (matchId: string) => {
    try {
      setApplyingMatchId(matchId);
      const response = await fetch(`/api/matches/${matchId}/apply`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to apply");
      }

      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplyingMatchId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    const isProfileError = error.toLowerCase().includes("profile");
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
          <p className="mt-1 text-muted-foreground">
            Postings that match your skills and interests
          </p>
        </div>
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-warning/10 p-3">
                <Search className="h-6 w-6 text-warning" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">
                  {isProfileError
                    ? "Complete Your Profile"
                    : "Unable to Find Matches"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {error}
                </p>
              </div>
              {isProfileError && (
                <Button asChild>
                  <Link href="/profile">Go to Profile</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasAnyContent =
    matches.length > 0 ||
    myInterests.length > 0 ||
    interestsReceived.length > 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
        <p className="mt-1 text-muted-foreground">
          Postings that match your skills and interests
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

      {!hasAnyContent ? (
        <EmptyState
          title="No matches yet"
          description="Complete your profile to start seeing matches that align with your skills and interests."
          action={{
            label: "Complete Profile",
            href: "/profile",
          }}
        />
      ) : (
        <div className="space-y-8">
          {/* Interests Received section */}
          {interestsReceived.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Interests Received
                <Badge variant="secondary">{interestsReceived.length}</Badge>
              </h2>
              <div className="space-y-4">
                {interestsReceived.map((interest) => {
                  const posting = interest.postings;
                  const profile = interest.profiles;
                  const profileName = profile?.full_name || "Unknown user";

                  return (
                    <Card key={interest.id}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-lg">
                                {profileName} is interested in your posting
                              </CardTitle>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors.interested}`}
                              >
                                {statusLabels.interested}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatTimeAgo(interest.created_at)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Posting info */}
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Posting
                          </p>
                          <p className="text-sm font-medium">
                            {posting?.title}
                          </p>
                        </div>

                        {/* Interested user info */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                            {getInitials(profileName)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{profileName}</p>
                            {profile?.headline && (
                              <p className="text-xs text-muted-foreground">
                                {profile.headline}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Interested user skills */}
                        {profile?.skills && profile.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.slice(0, 5).map((skill) => (
                              <span
                                key={skill}
                                className="rounded-md border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {profile.skills.length > 5 && (
                              <span className="rounded-md border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium">
                                +{profile.skills.length - 5}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {posting && (
                            <Button variant="outline" asChild>
                              <Link href={`/postings/${posting.id}`}>
                                View Posting
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* My Interests section */}
          {myInterests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5" />
                My Interests
                <Badge variant="secondary">{myInterests.length}</Badge>
              </h2>
              <div className="space-y-4">
                {myInterests.map((interest) => {
                  const posting = interest.postings;

                  return (
                    <Card key={interest.id}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-lg">
                                <Link
                                  href={`/postings/${posting?.id}`}
                                  className="hover:underline"
                                >
                                  {posting?.title}
                                </Link>
                              </CardTitle>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors.interested}`}
                              >
                                {statusLabels.interested}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Expressed interest{" "}
                              {formatTimeAgo(interest.created_at)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {posting?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {posting.description}
                          </p>
                        )}

                        {posting?.skills && posting.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {posting.skills.slice(0, 5).map((skill) => (
                              <span
                                key={skill}
                                className="rounded-md border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {posting.skills.length > 5 && (
                              <span className="rounded-md border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium">
                                +{posting.skills.length - 5}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {posting && (
                            <Button variant="outline" asChild>
                              <Link href={`/postings/${posting.id}`}>
                                View Details
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Matches section */}
          {matches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">AI Matches</h2>
              <div className="space-y-4">
                {matches.map((match) => {
                  const posting = match.posting as Posting;
                  const matchScore = Math.round(match.score * 100);
                  const matchedAt = formatTimeAgo(match.created_at);

                  return (
                    <Card key={match.id}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-xl">
                                <Link
                                  href={`/matches/${match.id}`}
                                  className="hover:underline"
                                >
                                  {posting.title}
                                </Link>
                              </CardTitle>
                              <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                                {matchScore}% match
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  statusColors[
                                    match.status as keyof typeof statusColors
                                  ]
                                }`}
                              >
                                {
                                  statusLabels[
                                    match.status as keyof typeof statusLabels
                                  ]
                                }
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Matched {matchedAt}
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

                        {/* Posting description */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {posting.description}
                        </p>

                        {/* Skills */}
                        {posting.skills && posting.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {posting.skills.slice(0, 5).map((skill) => (
                              <span
                                key={skill}
                                className="rounded-md border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {posting.skills.length > 5 && (
                              <span className="rounded-md border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium">
                                +{posting.skills.length - 5}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {match.status === "pending" && (
                            <>
                              <Button
                                className="flex-1 sm:flex-none"
                                onClick={() => handleApply(match.id)}
                                disabled={applyingMatchId === match.id}
                              >
                                {applyingMatchId === match.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                Apply
                              </Button>
                            </>
                          )}
                          {match.status === "applied" && (
                            <Button variant="secondary" disabled>
                              Application Sent
                            </Button>
                          )}
                          {match.status === "accepted" && (
                            <Button asChild>
                              <Link href={`/inbox`}>
                                <MessageSquare className="h-4 w-4" />
                                Message Team
                              </Link>
                            </Button>
                          )}
                          <Button variant="outline" asChild>
                            <Link href={`/matches/${match.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
