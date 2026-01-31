import { Metadata } from "next";
import Link from "next/link";
import {
  FolderKanban,
  Users,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectCard } from "@/components/project/project-card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Posted today";
  if (diffDays === 1) return "Posted 1 day ago";
  return `Posted ${diffDays} days ago`;
};

const getInitials = (name: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const persona = (user?.user_metadata?.persona as string) ?? "developer";

  // Fetch stats based on persona
  let stats: Array<{
    title: string;
    value: string;
    description: string;
    icon: typeof FolderKanban;
    href: string;
  }> = [];

  if (user) {
    if (persona === "project_owner") {
      // Owner stats
      const { count: liveProjectsCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", user.id)
        .eq("status", "open");

      // Get user's project IDs first
      const { data: userProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("creator_id", user.id);

      const projectIds = userProjects?.map((p) => p.id) || [];

      const { count: applicantsCount } = projectIds.length > 0
        ? await supabase
            .from("matches")
            .select("*", { count: "exact", head: true })
            .in("project_id", projectIds)
            .eq("status", "pending")
        : { count: 0 };

      // Get messages count
      const { count: messagesCount } = projectIds.length > 0
        ? await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .in("project_id", projectIds)
        : { count: 0 };

      // Calculate average match quality
      const { data: matchesData } = projectIds.length > 0
        ? await supabase
            .from("matches")
            .select("similarity_score")
            .in("project_id", projectIds)
        : { data: null };

      const avgMatchQuality = matchesData && matchesData.length > 0
        ? Math.round(
            (matchesData.reduce((sum, m) => sum + m.similarity_score, 0) /
              matchesData.length) *
              100
          )
        : 0;

      stats = [
        {
          title: "Live Projects",
          value: String(liveProjectsCount || 0),
          description: "Projects currently open",
          icon: FolderKanban,
          href: "/projects",
        },
        {
          title: "New Applicants",
          value: String(applicantsCount || 0),
          description: "Developers waiting on review",
          icon: Users,
          href: "/matches",
        },
        {
          title: "Messages",
          value: String(messagesCount || 0),
          description: "Total conversations",
          icon: MessageSquare,
          href: "/messages",
        },
        {
          title: "Match Quality",
          value: `${avgMatchQuality}%`,
          description: "Average match strength",
          icon: TrendingUp,
          href: "/matches",
        },
      ];
    } else {
      // Developer stats
      // Count projects where user has accepted matches
      const { data: acceptedMatches } = await supabase
        .from("matches")
        .select("project_id")
        .eq("user_id", user.id)
        .eq("status", "accepted");

      const activeProjectsCount = acceptedMatches?.length || 0;

      // Count pending matches
      const { count: pendingMatchesCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      // Count messages in projects user is involved in
      const projectIds = acceptedMatches?.map((m) => m.project_id) || [];
      const { count: messagesCount } = projectIds.length > 0
        ? await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .in("project_id", projectIds)
        : { count: 0 };

      // Calculate average match rate
      const { data: allMatches } = await supabase
        .from("matches")
        .select("similarity_score")
        .eq("user_id", user.id);

      const avgMatchRate = allMatches && allMatches.length > 0
        ? Math.round(
            (allMatches.reduce((sum, m) => sum + m.similarity_score, 0) /
              allMatches.length) *
              100
          )
        : 0;

      stats = [
        {
          title: "Active Projects",
          value: String(activeProjectsCount),
          description: "Projects you're involved in",
          icon: FolderKanban,
          href: "/projects",
        },
        {
          title: "New Matches",
          value: String(pendingMatchesCount || 0),
          description: "Projects waiting for your review",
          icon: Users,
          href: "/matches",
        },
        {
          title: "Messages",
          value: String(messagesCount || 0),
          description: "Total conversations",
          icon: MessageSquare,
          href: "/messages",
        },
        {
          title: "Match Rate",
          value: `${avgMatchRate}%`,
          description: "Average compatibility",
          icon: TrendingUp,
          href: "/matches",
        },
      ];
    }
  } else {
    // Default stats when not logged in
    stats = [
      {
        title: "Active Projects",
        value: "0",
        description: "Projects you're involved in",
        icon: FolderKanban,
        href: "/projects",
      },
      {
        title: "New Matches",
        value: "0",
        description: "Projects waiting for your review",
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
  }

  // Fetch recommended projects for developers
  let recommendedProjects: Array<{
    id: string;
    title: string;
    description: string;
    skills: string[];
    teamSize: string;
    timeline: string;
    commitment: string;
    matchScore: number;
    creator: { name: string; initials: string };
    createdAt: string;
  }> = [];

  if (user && persona === "developer") {
    const { data: topMatches } = await supabase
      .from("matches")
      .select(
        `
        projects:project_id (
          id,
          title,
          description,
          required_skills,
          team_size,
          timeline,
          commitment_hours,
          created_at,
          profiles:creator_id (
            full_name,
            user_id
          )
        ),
        similarity_score
      `
      )
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("similarity_score", { ascending: false })
      .limit(2);

    if (topMatches) {
      recommendedProjects = topMatches
        .map((match: any) => {
          const project = match.projects;
          if (!project) return null;

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

          return {
            id: project.id,
            title: project.title,
            description: project.description,
            skills: project.required_skills || [],
            teamSize: `${project.team_size} people`,
            timeline: formatTimeline(project.timeline),
            commitment: `${project.commitment_hours || 0} hrs/week`,
            matchScore: Math.round(match.similarity_score * 100),
            creator: {
              name: project.profiles?.full_name || "Unknown",
              initials: getInitials(project.profiles?.full_name),
            },
            createdAt: formatDate(project.created_at),
          };
        })
        .filter(Boolean) as typeof recommendedProjects;
    }
  }

  // Fetch project metrics for owners
  let ownerProjectMetrics: Array<{
    id: string;
    title: string;
    status: string;
    applicants: number;
    matches: number;
    views: number;
  }> = [];

  if (user && persona === "project_owner") {
    const { data: userProjects } = await supabase
      .from("projects")
      .select("id, title, status")
      .eq("creator_id", user.id)
      .eq("status", "open")
      .limit(2);

    if (userProjects) {
      const projectIds = userProjects.map((p) => p.id);

      // Get match counts for each project
      const { data: matchesData } = projectIds.length > 0
        ? await supabase
            .from("matches")
            .select("project_id, status")
            .in("project_id", projectIds)
        : { data: null };

      ownerProjectMetrics = userProjects.map((project) => {
        const projectMatches = matchesData?.filter(
          (m) => m.project_id === project.id
        ) || [];
        const applicants = projectMatches.filter(
          (m) => m.status === "pending"
        ).length;
        const totalMatches = projectMatches.length;

        return {
          id: project.id,
          title: project.title,
          status: project.status,
          applicants,
          matches: totalMatches,
          views: 0, // Views tracking not implemented yet
        };
      });
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back! Heres whats happening with your projects.
          </p>
        </div>
        {persona === "project_owner" ? (
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4" />
              Add a project
            </Link>
          </Button>
        ) : null}
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <Link
                href={stat.href}
                className="absolute inset-0"
                aria-label={`View ${stat.title}`}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {persona === "project_owner" ? (
            <Button
              variant="outline"
              className="justify-start gap-3 h-auto py-4"
              asChild
            >
              <Link href="/projects/new">
                <FolderKanban className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Create Project</div>
                  <div className="text-xs text-muted-foreground">
                    Post a new project to find collaborators
                  </div>
                </div>
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="justify-start gap-3 h-auto py-4"
              asChild
            >
              <Link href="/projects">
                <FolderKanban className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Explore Projects</div>
                  <div className="text-xs text-muted-foreground">
                    Discover projects looking for people like you
                  </div>
                </div>
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button variant="outline" className="justify-start gap-3 h-auto py-4" asChild>
            <Link href="/matches">
              <Users className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">
                  {persona === "project_owner" ? "Review Applicants" : "Review Matches"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {persona === "project_owner"
                    ? "See developers who matched your projects"
                    : "See projects that match your skills"}
                </div>
              </div>
              <ArrowRight className="ml-auto h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" className="justify-start gap-3 h-auto py-4" asChild>
            <Link href="/projects">
              <TrendingUp className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">
                  {persona === "project_owner" ? "Manage Projects" : "Explore Projects"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {persona === "project_owner"
                    ? "Track your posted projects"
                    : "Discover projects looking for people like you"}
                </div>
              </div>
              <ArrowRight className="ml-auto h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {persona === "developer" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Recommended projects</h2>
              <p className="text-sm text-muted-foreground">
                Project posters that match your profile and preferences.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/projects">Browse all projects</Link>
            </Button>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {recommendedProjects.length > 0 ? (
              recommendedProjects.map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))
            ) : (
              <Card>
                <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">
                    No recommended projects yet. Complete your profile to get personalized recommendations!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Project performance</h2>
              <p className="text-sm text-muted-foreground">
                Track your posted projects and their engagement metrics.
              </p>
            </div>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="h-4 w-4" />
                Add project
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {ownerProjectMetrics.length > 0 ? (
              ownerProjectMetrics.map((project) => (
              <Card key={project.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <Badge variant="outline">{project.status}</Badge>
                  </div>
                  <CardDescription>
                    Track applicants, matches, and views for this project.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Applicants</p>
                    <p className="text-lg font-semibold">{project.applicants}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Matches</p>
                    <p className="text-lg font-semibold">{project.matches}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Views</p>
                    <p className="text-lg font-semibold">{project.views}</p>
                  </div>
                </CardContent>
              </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">
                    You haven't created any projects yet. Create your first project to see metrics here!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Recent activity placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest matches and messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent activity yet. Create a project or explore matches to get started!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
