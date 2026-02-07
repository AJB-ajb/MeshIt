"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Users, Calendar, Clock, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatScore } from "@/lib/matching/scoring";
import { getInitials } from "@/lib/format";
import { useProjects } from "@/lib/hooks/use-projects";
import type { TabId } from "@/lib/hooks/use-projects";

const tabs: { id: TabId; label: string }[] = [
  { id: "discover", label: "Discover" },
  { id: "my-projects", label: "My Projects" },
];

const formatTimeline = (timeline: string) => {
  switch (timeline) {
    case "weekend":
      return "This weekend";
    case "1_week":
      return "1 week";
    case "1_month":
      return "1 month";
    case "ongoing":
      return "Ongoing";
    default:
      return timeline;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const { projects, userId, isLoading } = useProjects(activeTab);

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.title.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      project.required_skills.some((skill) =>
        skill.toLowerCase().includes(query)
      )
    );
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-muted-foreground">
            Discover projects or manage your own
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Tabs and search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex rounded-lg border border-border bg-muted/50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                tab.id === activeTab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and filter */}
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects, skills..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {activeTab === "my-projects"
                ? "You haven't created any projects yet."
                : "No projects found."}
            </p>
            {activeTab === "my-projects" && (
              <Button asChild className="mt-4">
                <Link href="/projects/new">
                  <Plus className="h-4 w-4" />
                  Create your first project
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Projects grid */
        <div className="grid gap-6">
          {filteredProjects.map((project) => {
            const isOwner = userId === project.creator_id;
            const creatorName =
              project.profiles?.full_name || "Unknown";

            return (
              <Card key={project.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-xl">
                          <Link
                            href={`/projects/${project.id}`}
                            className="hover:underline cursor-pointer"
                          >
                            {project.title}
                          </Link>
                        </CardTitle>
                        {project.status !== "open" && (
                          <Badge
                            variant={
                              project.status === "filled"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {project.status}
                          </Badge>
                        )}
                        {/* Compatibility Score Badge */}
                        {!isOwner && project.compatibility_score !== undefined && (
                          <Badge
                            variant="default"
                            className="bg-green-500 hover:bg-green-600 flex items-center gap-1"
                          >
                            <Sparkles className="h-3 w-3" />
                            {formatScore(project.compatibility_score)} match
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" asChild>
                        <Link href={`/projects/${project.id}`}>
                          {isOwner ? "Edit" : "View Details"}
                        </Link>
                      </Button>
                      {!isOwner && project.status === "open" && (
                        <Button>Apply</Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm line-clamp-2">
                    {project.description}
                  </CardDescription>

                  {/* Compatibility Breakdown - only for non-owners with scores */}
                  {!isOwner && project.score_breakdown && (
                    <div className="rounded-lg border border-green-500/20 bg-green-50/50 dark:bg-green-950/20 p-3">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Your Compatibility Breakdown
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Skills</span>
                          <span className="font-medium text-foreground">{formatScore(project.score_breakdown.skills_overlap)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Semantic</span>
                          <span className="font-medium text-foreground">{formatScore(project.score_breakdown.semantic)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Experience</span>
                          <span className="font-medium text-foreground">{formatScore(project.score_breakdown.experience_match)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Availability</span>
                          <span className="font-medium text-foreground">{formatScore(project.score_breakdown.commitment_match)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {project.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.required_skills.slice(0, 5).map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {project.required_skills.length > 5 && (
                        <Badge variant="outline">
                          +{project.required_skills.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {project.team_size} people
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {formatTimeline(project.timeline)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {project.commitment_hours} hrs/week
                    </span>
                  </div>

                  {/* Creator */}
                  <div className="flex items-center gap-2 border-t border-border pt-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {getInitials(creatorName)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {isOwner ? "Created by you" : `Posted by ${creatorName}`}{" "}
                      • {formatDate(project.created_at)}
                    </span>
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
