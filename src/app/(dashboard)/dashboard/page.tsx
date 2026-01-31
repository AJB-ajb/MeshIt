import { Metadata } from "next";
import Link from "next/link";
import {
  FolderKanban,
  Users,
  MessageSquare,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Mock stats for demo
const stats = [
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
    description: "Waiting for your review",
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

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your projects.
        </p>
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
          <Button variant="outline" className="justify-start gap-3 h-auto py-4" asChild>
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
          <Button variant="outline" className="justify-start gap-3 h-auto py-4" asChild>
            <Link href="/matches">
              <Users className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Review Matches</div>
                <div className="text-xs text-muted-foreground">
                  See who matched with your projects
                </div>
              </div>
              <ArrowRight className="ml-auto h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" className="justify-start gap-3 h-auto py-4" asChild>
            <Link href="/projects">
              <TrendingUp className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Explore Projects</div>
                <div className="text-xs text-muted-foreground">
                  Discover projects looking for people like you
                </div>
              </div>
              <ArrowRight className="ml-auto h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

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
