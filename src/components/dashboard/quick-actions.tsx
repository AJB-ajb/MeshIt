import Link from "next/link";
import {
  FolderKanban,
  Users,
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

export function QuickActions({ persona }: { persona: string }) {
  return (
    <Card data-testid="quick-actions">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to get started</CardDescription>
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
                <div className="font-medium">Create Posting</div>
                <div className="text-xs text-muted-foreground">
                  Create a new posting to find collaborators
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
                <div className="font-medium">Explore Postings</div>
                <div className="text-xs text-muted-foreground">
                  Discover postings looking for people like you
                </div>
              </div>
              <ArrowRight className="ml-auto h-4 w-4" />
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          className="justify-start gap-3 h-auto py-4"
          asChild
        >
          <Link href="/matches">
            <Users className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">
                {persona === "project_owner"
                  ? "Review Applicants"
                  : "Review Matches"}
              </div>
              <div className="text-xs text-muted-foreground">
                {persona === "project_owner"
                  ? "See people who matched your postings"
                  : "See postings that match your skills"}
              </div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="outline"
          className="justify-start gap-3 h-auto py-4"
          asChild
        >
          <Link href="/projects">
            <TrendingUp className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">
                {persona === "project_owner"
                  ? "Manage Postings"
                  : "Explore Postings"}
              </div>
              <div className="text-xs text-muted-foreground">
                {persona === "project_owner"
                  ? "Track your postings"
                  : "Discover postings looking for people like you"}
              </div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
