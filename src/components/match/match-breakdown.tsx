"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoreBreakdown } from "@/lib/supabase/types";
import { formatScore, getScoreColorVariant } from "@/lib/matching/scoring";

export interface MatchBreakdownProps {
  breakdown: ScoreBreakdown;
  project: {
    required_skills: string[];
    experience_level: string | null;
    commitment_hours: number | null;
  };
  profile: {
    skills: string[] | null;
    experience_level: string | null;
    availability_hours: number | null;
  };
  className?: string;
}

/**
 * Visual breakdown of match scores by dimension
 * Shows progress bars and explanations for each matching attribute
 */
export function MatchBreakdown({
  breakdown,
  project,
  profile,
  className,
}: MatchBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate skills overlap details
  const userSkills = profile.skills || [];
  const requiredSkills = project.required_skills || [];
  const matchingSkills = userSkills.filter((skill) =>
    requiredSkills.includes(skill)
  );

  const dimensions = [
    {
      key: "semantic" as const,
      label: "Semantic Relevance",
      description: "Alignment in interests and project description",
      score: breakdown.semantic,
    },
    {
      key: "skills_overlap" as const,
      label: "Skills Overlap",
      description:
        requiredSkills.length > 0
          ? `${matchingSkills.length} of ${requiredSkills.length} required skills`
          : "No specific skills required",
      score: breakdown.skills_overlap,
    },
    {
      key: "experience_match" as const,
      label: "Experience Level",
      description:
        profile.experience_level && project.experience_level
          ? `You: ${profile.experience_level} | Project: ${project.experience_level}`
          : project.experience_level === "any"
          ? "Any experience level accepted"
          : "Experience level not specified",
      score: breakdown.experience_match,
    },
    {
      key: "commitment_match" as const,
      label: "Time Commitment",
      description:
        profile.availability_hours && project.commitment_hours
          ? `You: ${profile.availability_hours} hrs/week | Project: ${project.commitment_hours} hrs/week`
          : "Time commitment not specified",
      score: breakdown.commitment_match,
    },
  ];

  return (
    <div className={cn("rounded-lg border border-border bg-muted/30", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
      >
        <span className="text-sm font-medium text-foreground">
          Match Breakdown
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-4 border-t border-border p-4">
          {dimensions.map((dimension) => {
            const colorVariant = getScoreColorVariant(dimension.score);
            const colorClasses = {
              success: "bg-success",
              warning: "bg-warning",
              destructive: "bg-destructive",
            };

            return (
              <div key={dimension.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {dimension.label}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      colorVariant === "success" && "text-success",
                      colorVariant === "warning" && "text-warning",
                      colorVariant === "destructive" && "text-destructive"
                    )}
                  >
                    {formatScore(dimension.score)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      colorClasses[colorVariant]
                    )}
                    style={{ width: `${dimension.score * 100}%` }}
                  />
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground">
                  {dimension.description}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
