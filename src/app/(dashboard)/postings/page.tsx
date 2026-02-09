"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  Clock,
  Loader2,
  Sparkles,
} from "lucide-react";

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
import { usePostings } from "@/lib/hooks/use-postings";
import type { Posting, TabId } from "@/lib/hooks/use-postings";

const tabs: { id: TabId; label: string }[] = [
  { id: "discover", label: "Discover" },
  { id: "my-postings", label: "My Postings" },
];

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

export default function PostingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const { postings, userId, isLoading } = usePostings(activeTab);

  const filteredPostings = postings.filter((posting: Posting) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      posting.title.toLowerCase().includes(query) ||
      posting.description.toLowerCase().includes(query) ||
      posting.skills.some((skill: string) =>
        skill.toLowerCase().includes(query),
      )
    );
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Postings</h1>
          <p className="mt-1 text-muted-foreground">
            Discover postings or manage your own
          </p>
        </div>
        <Button asChild>
          <Link href="/postings/new">
            <Plus className="h-4 w-4" />
            New Posting
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
              placeholder="Search postings, skills..."
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
      ) : filteredPostings.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {activeTab === "my-postings"
                ? "You haven't created any postings yet."
                : "No postings found."}
            </p>
            {activeTab === "my-postings" && (
              <Button asChild className="mt-4">
                <Link href="/postings/new">
                  <Plus className="h-4 w-4" />
                  Create your first posting
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Postings grid */
        <div className="grid gap-6">
          {filteredPostings.map((posting) => {
            const isOwner = userId === posting.creator_id;
            const creatorName = posting.profiles?.full_name || "Unknown";

            return (
              <Card key={posting.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-xl">
                          <Link
                            href={`/postings/${posting.id}`}
                            className="hover:underline cursor-pointer"
                          >
                            {posting.title}
                          </Link>
                        </CardTitle>
                        {posting.status !== "open" && (
                          <Badge
                            variant={
                              posting.status === "filled"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {posting.status}
                          </Badge>
                        )}
                        {/* Compatibility Score Badge */}
                        {!isOwner &&
                          posting.compatibility_score !== undefined && (
                            <Badge
                              variant="default"
                              className="bg-green-500 hover:bg-green-600 flex items-center gap-1"
                            >
                              <Sparkles className="h-3 w-3" />
                              {formatScore(posting.compatibility_score)} match
                            </Badge>
                          )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" asChild>
                        <Link href={`/postings/${posting.id}`}>
                          {isOwner ? "Edit" : "View Details"}
                        </Link>
                      </Button>
                      {!isOwner && posting.status === "open" && (
                        <Button>Apply</Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm line-clamp-2">
                    {posting.description}
                  </CardDescription>

                  {/* Compatibility Breakdown - only for non-owners with scores */}
                  {!isOwner && posting.score_breakdown && (
                    <div className="rounded-lg border border-green-500/20 bg-green-50/50 dark:bg-green-950/20 p-3">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Your Compatibility Breakdown
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">
                            Semantic
                          </span>
                          <span className="font-medium text-foreground">
                            {formatScore(posting.score_breakdown.semantic)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">
                            Availability
                          </span>
                          <span className="font-medium text-foreground">
                            {formatScore(posting.score_breakdown.availability)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">
                            Skill Level
                          </span>
                          <span className="font-medium text-foreground">
                            {formatScore(posting.score_breakdown.skill_level)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">
                            Location
                          </span>
                          <span className="font-medium text-foreground">
                            {formatScore(posting.score_breakdown.location)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {posting.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {posting.skills.slice(0, 5).map((skill: string) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {posting.skills.length > 5 && (
                        <Badge variant="outline">
                          +{posting.skills.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {posting.team_size_min}-{posting.team_size_max} people
                    </span>
                    {posting.estimated_time && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {posting.estimated_time}
                      </span>
                    )}
                    {posting.category && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {posting.category}
                      </span>
                    )}
                  </div>

                  {/* Creator */}
                  <div className="flex items-center gap-2 border-t border-border pt-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {getInitials(creatorName)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {isOwner ? "Created by you" : `Posted by ${creatorName}`}{" "}
                      • {formatDate(posting.created_at)}
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
