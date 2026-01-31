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

const developerStats = [
  {
    title: "Active Projects",
    value: "3",
    description: "Projects you're involved in",
    icon: FolderKanban,
    href: "/projects",
  },
  {
    title: "New Matches",
    value: "12",
    description: "Projects waiting for your review",
    icon: Users,
    href: "/matches",
  },
  {
    title: "Messages",
    value: "5",
    description: "Unread conversations",
    icon: MessageSquare,
    href: "/messages",
  },
  {
    title: "Match Rate",
    value: "87%",
    description: "Average compatibility",
    icon: TrendingUp,
    href: "/matches",
  },
];

const ownerStats = [
  {
    title: "Live Projects",
    value: "2",
    description: "Projects currently open",
    icon: FolderKanban,
    href: "/projects",
  },
  {
    title: "New Applicants",
    value: "9",
    description: "Developers waiting on review",
    icon: Users,
    href: "/matches",
  },
  {
    title: "Messages",
    value: "4",
    description: "Unread conversations",
    icon: MessageSquare,
    href: "/messages",
  },
  {
    title: "Match Quality",
    value: "82%",
    description: "Average match strength",
    icon: TrendingUp,
    href: "/matches",
  },
];

const recommendedProjects = [
  {
    id: "alpha",
    title: "AI Wellness Companion",
    description:
      "Building a mobile-first wellness coach with mood tracking and AI suggestions.",
    skills: ["React Native", "TypeScript", "LLM", "Product"],
    teamSize: "3-4 people",
    timeline: "1 month",
    commitment: "10 hrs/week",
    matchScore: 91,
    creator: { name: "Maya Chen", initials: "MC" },
    createdAt: "Posted 2 days ago",
  },
  {
    id: "beta",
    title: "Campus Event Matcher",
    description:
      "A platform for students to find hackathon teammates and side projects.",
    skills: ["Next.js", "Supabase", "Design", "Growth"],
    teamSize: "2-3 people",
    timeline: "Ongoing",
    commitment: "15 hrs/week",
    matchScore: 86,
    creator: { name: "Jordan Lee", initials: "JL" },
    createdAt: "Posted 5 days ago",
  },
];

const ownerProjectMetrics = [
  {
    id: "creator-1",
    title: "Carbon Footprint Tracker",
    status: "Open",
    applicants: 7,
    matches: 5,
    views: 120,
  },
  {
    id: "creator-2",
    title: "AI Study Buddy",
    status: "Open",
    applicants: 4,
    matches: 3,
    views: 84,
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const persona = (user?.user_metadata?.persona as string) ?? "developer";
  const stats = persona === "project_owner" ? ownerStats : developerStats;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your projects.
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
            {recommendedProjects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
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
            {ownerProjectMetrics.map((project) => (
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
            ))}
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
