"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Check, MessageSquare, Calendar, Clock, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MatchResponse, Project, Profile } from "@/lib/supabase/types";

export default function MatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params?.id as string;

  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/matches/${matchId}`);

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        throw new Error("Failed to fetch match");
      }

      const data = await response.json();
      setMatch(data.match);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load match");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!match) return;

    try {
      setIsApplying(true);
      const response = await fetch(`/api/matches/${match.id}/apply`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to apply");
      }

      const data = await response.json();
      setMatch(data.match);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/matches"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to matches
        </Link>
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || "Match not found"}
        </div>
      </div>
    );
  }

  const project = match.project as Project;
  const profile = match.profile as Profile;
  const matchScore = Math.round(match.score * 100);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/matches"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to matches
      </Link>

      {/* Match Score Badge */}
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-success/10 px-4 py-2">
          <span className="text-2xl font-bold text-success">{matchScore}%</span>
          <span className="ml-2 text-sm text-muted-foreground">Match</span>
        </div>
        <Badge
          variant={
            match.status === "accepted"
              ? "default"
              : match.status === "applied"
                ? "secondary"
                : "outline"
          }
        >
          {match.status === "pending"
            ? "Pending"
            : match.status === "applied"
              ? "Applied"
              : match.status === "accepted"
                ? "Accepted"
                : "Declined"}
        </Badge>
      </div>

      {/* Match Explanation */}
      {match.explanation && (
        <Card>
          <CardHeader>
            <CardTitle>Why you matched</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{match.explanation}</p>
          </CardContent>
        </Card>
      )}

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>{project.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>

          {project.required_skills && project.required_skills.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {project.required_skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {project.team_size && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Team Size</p>
                  <p className="text-sm font-medium">{project.team_size} people</p>
                </div>
              </div>
            )}
            {project.commitment_hours && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Commitment</p>
                  <p className="text-sm font-medium">{project.commitment_hours} hrs/week</p>
                </div>
              </div>
            )}
            {project.timeline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Timeline</p>
                  <p className="text-sm font-medium capitalize">
                    {project.timeline.replace("_", " ")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Details (if viewing as project owner) */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>How you appear to project creators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.headline && (
              <div>
                <h4 className="text-sm font-medium mb-1">Headline</h4>
                <p className="text-sm text-muted-foreground">{profile.headline}</p>
              </div>
            )}
            {profile.bio && (
              <div>
                <h4 className="text-sm font-medium mb-1">About</h4>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            )}
            {profile.skills && profile.skills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {profile.availability_hours && (
              <div>
                <h4 className="text-sm font-medium mb-1">Availability</h4>
                <p className="text-sm text-muted-foreground">
                  {profile.availability_hours} hours per week
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {match.status === "pending" && (
          <Button onClick={handleApply} disabled={isApplying} className="w-full sm:w-auto">
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Apply to Project
              </>
            )}
          </Button>
        )}
        {match.status === "applied" && (
          <Button variant="secondary" disabled className="w-full sm:w-auto">
            Application Sent
          </Button>
        )}
        {match.status === "accepted" && (
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/messages?project=${project.id}`}>
              <MessageSquare className="h-4 w-4" />
              Message Team
            </Link>
          </Button>
        )}
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href={`/projects/${project.id}`}>View Full Project</Link>
        </Button>
      </div>
    </div>
  );
}
