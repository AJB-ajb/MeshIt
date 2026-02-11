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
  X,
  Heart,
} from "lucide-react";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { transcribeAudio } from "@/lib/transcribe";

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

const categories = [
  { value: "all", label: "All" },
  { value: "study", label: "Study" },
  { value: "hackathon", label: "Hackathon" },
  { value: "personal", label: "Personal" },
  { value: "professional", label: "Professional" },
  { value: "social", label: "Social" },
] as const;

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
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMode, setFilterMode] = useState<string>("all");
  const [interestingIds, setInterestingIds] = useState<Set<string>>(new Set());

  const { postings, userId, interestedPostingIds, isLoading, mutate } =
    usePostings(activeTab, filterCategory);

  const hasActiveFilters = filterMode !== "all";

  const clearFilters = () => {
    setFilterMode("all");
  };

  const handleExpressInterest = async (postingId: string) => {
    setInterestingIds((prev) => new Set(prev).add(postingId));
    try {
      const response = await fetch("/api/matches/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posting_id: postingId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to express interest");
      }

      await mutate();
    } catch (err) {
      setInterestingIds((prev) => {
        const next = new Set(prev);
        next.delete(postingId);
        return next;
      });
      alert(err instanceof Error ? err.message : "Failed to express interest");
    }
  };

  const filteredPostings = postings.filter((posting: Posting) => {
    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        posting.title.toLowerCase().includes(query) ||
        posting.description.toLowerCase().includes(query) ||
        posting.skills.some((skill: string) =>
          skill.toLowerCase().includes(query),
        );
      if (!matchesSearch) return false;
    }

    // Mode filter (category is now handled at the hook/query level)
    if (filterMode !== "all" && posting.mode !== filterMode) return false;

    return true;
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
              className="pl-9 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SpeechInput
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              size="icon"
              variant="ghost"
              onAudioRecorded={transcribeAudio}
              onTranscriptionChange={(text) => setSearchQuery(text)}
            />
          </div>
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="icon"
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filterCategory === cat.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filter panel (mode only — category handled by chips) */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Filters</h3>
              <div className="flex gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Mode
              </label>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="all">Any mode</option>
                <option value="open">Open</option>
                <option value="friend_ask">Friend Ask</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

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
            const isAlreadyInterested = interestedPostingIds.includes(
              posting.id,
            );
            const isInteresting = interestingIds.has(posting.id);
            const showInterestButton =
              !isOwner &&
              activeTab === "discover" &&
              posting.mode === "open" &&
              !isAlreadyInterested;

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
                        {posting.context_identifier && (
                          <Badge variant="secondary" className="text-xs">
                            {posting.context_identifier}
                          </Badge>
                        )}
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
                      {/* "I'm Interested" button */}
                      {showInterestButton && (
                        <Button
                          variant="outline"
                          onClick={() => handleExpressInterest(posting.id)}
                          disabled={isInteresting}
                        >
                          {isInteresting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Heart className="h-4 w-4" />
                          )}
                          {isInteresting
                            ? "Expressing Interest..."
                            : "I'm Interested"}
                        </Button>
                      )}
                      {/* Already interested indicator */}
                      {!isOwner &&
                        activeTab === "discover" &&
                        isAlreadyInterested && (
                          <Button variant="secondary" disabled>
                            <Heart className="h-4 w-4 fill-current" />
                            Interested
                          </Button>
                        )}
                      <Button variant="outline" asChild>
                        <Link href={`/postings/${posting.id}`}>
                          {isOwner ? "Edit" : "View Details"}
                        </Link>
                      </Button>
                      {!isOwner &&
                        posting.status === "open" &&
                        !isAlreadyInterested &&
                        posting.mode !== "open" && <Button>Apply</Button>}
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
