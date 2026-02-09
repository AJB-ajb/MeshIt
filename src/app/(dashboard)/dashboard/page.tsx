import { Metadata } from "next";
import Link from "next/link";
import {
  FolderKanban,
  Users,
  MessageSquare,
  TrendingUp,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTestDataValue } from "@/lib/environment";
import { formatDate, formatTimeAgo, getInitials } from "@/lib/format";
import {
  StatsOverview,
  type StatItem,
} from "@/components/dashboard/stats-overview";
import { QuickActions } from "@/components/dashboard/quick-actions";
import {
  RecommendedPostings,
  type RecommendedPosting,
} from "@/components/dashboard/recommended-postings";
import {
  PostingPerformance,
  type PostingMetric,
} from "@/components/dashboard/posting-performance";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function RecentActivityList({
  supabase,
  userId,
  persona,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  persona: string;
}) {
  const activities: Array<{
    type: "match" | "application" | "message" | "project";
    title: string;
    description: string;
    time: string;
    href: string;
  }> = [];

  if (persona === "project_owner") {
    // Get user's postings IDs
    const { data: userPostings } = await supabase
      .from("postings")
      .select("id")
      .eq("creator_id", userId)
      .eq("is_test_data", getTestDataValue());

    const postingIds = userPostings?.map((p) => p.id) || [];

    if (postingIds.length > 0) {
      // Get recent applications
      const { data: recentApplications } = await supabase
        .from("applications")
        .select(
          `
          id,
          created_at,
          status,
          postings:posting_id (
            id,
            title
          ),
          profiles:applicant_id (
            full_name,
            user_id
          )
        `,
        )
        .in("posting_id", postingIds)
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentApplications) {
        recentApplications.forEach((app: unknown) => {
          const a = app as Record<string, unknown>;
          const profiles = a.profiles as Record<string, unknown> | null;
          const postings = a.postings as Record<string, unknown> | null;
          activities.push({
            type: "application",
            title: `New application from ${profiles?.full_name || "Someone"}`,
            description: `Applied to "${postings?.title || "Posting"}"`,
            time: formatTimeAgo(a.created_at as string),
            href: `/projects/${postings?.id}`,
          });
        });
      }

      // Get recent matches
      const { data: recentMatches } = await supabase
        .from("matches")
        .select(
          `
          id,
          created_at,
          status,
          postings:posting_id (
            id,
            title
          ),
          profiles:user_id (
            full_name,
            user_id
          )
        `,
        )
        .in("posting_id", postingIds)
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentMatches) {
        recentMatches.forEach((match: unknown) => {
          const m = match as Record<string, unknown>;
          const profiles = m.profiles as Record<string, unknown> | null;
          const postings = m.postings as Record<string, unknown> | null;
          activities.push({
            type: "match",
            title: `New match: ${profiles?.full_name || "Developer"}`,
            description: `Matched with "${postings?.title || "Posting"}"`,
            time: formatTimeAgo(m.created_at as string),
            href: `/matches`,
          });
        });
      }
    }
  } else {
    // Developer: Get recent applications
    const { data: recentApplications } = await supabase
      .from("applications")
      .select(
        `
        id,
        created_at,
        status,
        postings:posting_id (
          id,
          title
        )
      `,
      )
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (recentApplications) {
      recentApplications.forEach((app: unknown) => {
        const a = app as Record<string, unknown>;
        const postings = a.postings as Record<string, unknown> | null;
        activities.push({
          type: "application",
          title: `Application to "${postings?.title || "Posting"}"`,
          description: `Status: ${a.status}`,
          time: formatTimeAgo(a.created_at as string),
          href: `/projects/${postings?.id}`,
        });
      });
    }

    // Get recent matches
    const { data: recentMatches } = await supabase
      .from("matches")
      .select(
        `
        id,
        created_at,
        status,
        similarity_score,
        postings:posting_id (
          id,
          title
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (recentMatches) {
      recentMatches.forEach((match: unknown) => {
        const m = match as Record<string, unknown>;
        const postings = m.postings as Record<string, unknown> | null;
        activities.push({
          type: "match",
          title: `New match: "${postings?.title || "Posting"}"`,
          description: `Match score: ${Math.round(((m.similarity_score as number) || 0) * 100)}%`,
          time: formatTimeAgo(m.created_at as string),
          href: `/matches`,
        });
      });
    }
  }

  // Get recent messages
  const { data: userConversations } = await supabase
    .from("conversations")
    .select("id")
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

  const conversationIds = userConversations?.map((c) => c.id) || [];
  if (conversationIds.length > 0) {
    const { data: recentMessages } = await supabase
      .from("messages")
      .select(
        `
        id,
        content,
        created_at,
        sender_id,
        conversations:conversation_id (
          id
        )
      `,
      )
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false })
      .limit(3);

    if (recentMessages) {
      recentMessages.forEach((msg: unknown) => {
        const m = msg as Record<string, unknown>;
        const content = m.content as string;
        const conversations = m.conversations as Record<string, unknown> | null;
        activities.push({
          type: "message",
          title: "New message",
          description:
            content.slice(0, 50) + (content.length > 50 ? "..." : ""),
          time: formatTimeAgo(m.created_at as string),
          href: `/inbox?conversation=${conversations?.id}`,
        });
      });
    }
  }

  // Sort by time and limit to 5 most recent
  const sortedActivities = [...activities].sort((a, b) => {
    const timeA = a.time.includes("Just now")
      ? 0
      : a.time.includes("minute")
        ? 1
        : a.time.includes("hour")
          ? 2
          : a.time.includes("day")
            ? 3
            : 4;
    const timeB = b.time.includes("Just now")
      ? 0
      : b.time.includes("minute")
        ? 1
        : b.time.includes("hour")
          ? 2
          : b.time.includes("day")
            ? 3
            : 4;
    return timeA - timeB;
  });
  const recentActivities = sortedActivities.slice(0, 5);

  if (recentActivities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No recent activity yet. Create a posting or explore matches to get
        started!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {recentActivities.map((activity, index) => (
        <Link
          key={index}
          href={activity.href}
          className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
        >
          <div className="mt-0.5">
            {activity.type === "match" && (
              <Users className="h-4 w-4 text-primary" />
            )}
            {activity.type === "application" && (
              <FolderKanban className="h-4 w-4 text-primary" />
            )}
            {activity.type === "message" && (
              <MessageSquare className="h-4 w-4 text-primary" />
            )}
            {activity.type === "project" && (
              <TrendingUp className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{activity.title}</p>
            <p className="text-xs text-muted-foreground">
              {activity.description}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {activity.time}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

async function fetchOwnerStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<StatItem[]> {
  const { count: livePostingsCount } = await supabase
    .from("postings")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", userId)
    .eq("status", "open")
    .eq("is_test_data", getTestDataValue());

  const { data: userPostings } = await supabase
    .from("postings")
    .select("id")
    .eq("creator_id", userId)
    .eq("is_test_data", getTestDataValue());

  const postingIds = userPostings?.map((p) => p.id) || [];

  const { count: applicationsCount } =
    postingIds.length > 0
      ? await supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .in("posting_id", postingIds)
          .eq("status", "pending")
      : { count: 0 };

  const { count: matchesCount } =
    postingIds.length > 0
      ? await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .in("posting_id", postingIds)
          .eq("status", "pending")
      : { count: 0 };

  const applicantsCount = (applicationsCount || 0) + (matchesCount || 0);

  const { count: conversationsCount } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

  const { data: userConversations } = await supabase
    .from("conversations")
    .select("id")
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

  const conversationIds = userConversations?.map((c) => c.id) || [];

  const { count: unreadMessagesCount } =
    conversationIds.length > 0
      ? await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", conversationIds)
          .eq("read", false)
          .neq("sender_id", userId)
      : { count: 0 };

  const { data: matchesData } =
    postingIds.length > 0
      ? await supabase
          .from("matches")
          .select("similarity_score")
          .in("posting_id", postingIds)
      : { data: null };

  const avgMatchQuality =
    matchesData && matchesData.length > 0
      ? Math.round(
          (matchesData.reduce((sum, m) => sum + m.similarity_score, 0) /
            matchesData.length) *
            100,
        )
      : 0;

  return [
    {
      title: "Live Postings",
      value: String(livePostingsCount || 0),
      description: "Postings currently open",
      icon: FolderKanban,
      href: "/projects",
    },
    {
      title: "New Applicants",
      value: String(applicantsCount || 0),
      description: "Applications + matches pending",
      icon: Users,
      href: "/matches",
    },
    {
      title: "Conversations",
      value: String(conversationsCount || 0),
      description: `${unreadMessagesCount || 0} unread messages`,
      icon: MessageSquare,
      href: "/inbox",
    },
    {
      title: "Match Quality",
      value: `${avgMatchQuality}%`,
      description: "Average match strength",
      icon: TrendingUp,
      href: "/matches",
    },
  ];
}

async function fetchDeveloperStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<StatItem[]> {
  const { data: acceptedMatches } = await supabase
    .from("matches")
    .select("posting_id")
    .eq("user_id", userId)
    .eq("status", "accepted");

  const activePostingsCount = acceptedMatches?.length || 0;

  const { count: pendingMatchesCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "pending");

  const { count: applicationsCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("applicant_id", userId)
    .eq("status", "pending");

  const { count: conversationsCount } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

  const { data: userConversations } = await supabase
    .from("conversations")
    .select("id")
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

  const conversationIds = userConversations?.map((c) => c.id) || [];

  const { count: unreadMessagesCount } =
    conversationIds.length > 0
      ? await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", conversationIds)
          .eq("read", false)
          .neq("sender_id", userId)
      : { count: 0 };

  return [
    {
      title: "Active Postings",
      value: String(activePostingsCount),
      description: "Postings you're involved in",
      icon: FolderKanban,
      href: "/projects",
    },
    {
      title: "New Matches",
      value: String(pendingMatchesCount || 0),
      description: "Postings waiting for your review",
      icon: Users,
      href: "/matches",
    },
    {
      title: "Applications",
      value: String(applicationsCount || 0),
      description: "Applications you've submitted",
      icon: TrendingUp,
      href: "/projects",
    },
    {
      title: "Conversations",
      value: String(conversationsCount || 0),
      description: `${unreadMessagesCount || 0} unread messages`,
      icon: MessageSquare,
      href: "/inbox",
    },
  ];
}

async function fetchRecommendedPostings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<RecommendedPosting[]> {
  const { data: topMatches } = await supabase
    .from("matches")
    .select(
      `
      postings:posting_id (
        id,
        title,
        description,
        skills,
        team_size_min,
        team_size_max,
        estimated_time,
        category,
        created_at,
        profiles:creator_id (
          full_name,
          user_id
        )
      ),
      similarity_score
    `,
    )
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("similarity_score", { ascending: false })
    .limit(2);

  if (!topMatches) return [];

  return topMatches
    .map((match: unknown) => {
      const m = match as Record<string, unknown>;
      const posting = m.postings as Record<string, unknown> | null;
      if (!posting) return null;

      const profiles = posting.profiles as Record<string, unknown> | null;
      return {
        id: posting.id,
        title: posting.title,
        description: posting.description,
        skills: (posting.skills as string[]) || [],
        teamSize: `${posting.team_size_min}-${posting.team_size_max} people`,
        estimatedTime: (posting.estimated_time as string) || "",
        category: (posting.category as string) || "",
        matchScore: Math.round((m.similarity_score as number) * 100),
        creator: {
          name: (profiles?.full_name as string) || "Unknown",
          initials: getInitials((profiles?.full_name as string) || null),
        },
        createdAt: formatDate(posting.created_at as string),
      };
    })
    .filter(Boolean) as RecommendedPosting[];
}

async function fetchOwnerPostingMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<PostingMetric[]> {
  const { data: userPostings } = await supabase
    .from("postings")
    .select("id, title, status")
    .eq("creator_id", userId)
    .eq("status", "open")
    .eq("is_test_data", getTestDataValue())
    .limit(2);

  if (!userPostings) return [];

  const postingIds = userPostings.map((p) => p.id);

  const { data: matchesData } =
    postingIds.length > 0
      ? await supabase
          .from("matches")
          .select("posting_id, status")
          .in("posting_id", postingIds)
      : { data: null };

  return userPostings.map((posting: { id: string; title: string; status: string }) => {
    const postingMatches =
      matchesData?.filter((m) => m.posting_id === posting.id) || [];
    const applicants = postingMatches.filter(
      (m) => m.status === "pending",
    ).length;
    const totalMatches = postingMatches.length;

    return {
      id: posting.id,
      title: posting.title,
      status: posting.status,
      applicants,
      matches: totalMatches,
      views: 0,
    };
  });
}

const defaultStats: StatItem[] = [
  {
    title: "Active Postings",
    value: "0",
    description: "Postings you're involved in",
    icon: FolderKanban,
    href: "/projects",
  },
  {
    title: "New Matches",
    value: "0",
    description: "Postings waiting for your review",
    icon: Users,
    href: "/matches",
  },
  {
    title: "Messages",
    value: "0",
    description: "Total conversations",
    icon: MessageSquare,
    href: "/messages",
  },
  {
    title: "Match Rate",
    value: "0%",
    description: "Average compatibility",
    icon: TrendingUp,
    href: "/matches",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const persona = (user?.user_metadata?.persona as string) ?? "developer";

  let stats: StatItem[] = defaultStats;
  let recommendedPostings: RecommendedPosting[] = [];
  let ownerPostingMetrics: PostingMetric[] = [];

  if (user) {
    if (persona === "project_owner") {
      [stats, ownerPostingMetrics] = await Promise.all([
        fetchOwnerStats(supabase, user.id),
        fetchOwnerPostingMetrics(supabase, user.id),
      ]);
    } else {
      [stats, recommendedPostings] = await Promise.all([
        fetchDeveloperStats(supabase, user.id),
        fetchRecommendedPostings(supabase, user.id),
      ]);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back! Heres whats happening with your postings.
          </p>
        </div>
        {persona === "project_owner" ? (
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4" />
              Add a posting
            </Link>
          </Button>
        ) : null}
      </div>

      <StatsOverview stats={stats} />
      <QuickActions persona={persona} />

      {persona === "developer" ? (
        <RecommendedPostings postings={recommendedPostings} />
      ) : (
        <PostingPerformance metrics={ownerPostingMetrics} />
      )}

      {/* Recent activity */}
      <Card data-testid="recent-activity">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest matches, applications, and messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <RecentActivityList
              supabase={supabase}
              userId={user.id}
              persona={persona}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Sign in to see your recent activity
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
