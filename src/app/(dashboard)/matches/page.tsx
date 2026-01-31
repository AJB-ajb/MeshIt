import { Metadata } from "next";
import Link from "next/link";
import { Search, Filter, Check, X, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Matches",
};

// Mock matches data
const matches = [
  {
    id: "1",
    projectTitle: "AI Recipe Generator",
    projectId: "1",
    matchScore: 92,
    status: "pending",
    explanation:
      "Your React and TypeScript skills align perfectly with this project's frontend needs. Your previous experience with image processing projects makes you an excellent fit for the computer vision component.",
    matchedAt: "2 hours ago",
  },
  {
    id: "2",
    projectTitle: "Climate Data Visualization",
    projectId: "2",
    matchScore: 88,
    status: "pending",
    explanation:
      "Your data visualization experience with D3.js and interest in environmental causes make this a strong match. The project timeline aligns well with your availability.",
    matchedAt: "5 hours ago",
  },
  {
    id: "3",
    projectTitle: "Mobile Fitness App",
    projectId: "3",
    matchScore: 75,
    status: "applied",
    explanation:
      "Your mobile development skills and experience with React Native are relevant to this project. Your interest in health tech adds extra alignment.",
    matchedAt: "1 day ago",
  },
];

const statusColors = {
  pending: "bg-warning/10 text-warning",
  applied: "bg-info/10 text-info",
  accepted: "bg-success/10 text-success",
  declined: "bg-muted text-muted-foreground",
};

const statusLabels = {
  pending: "Pending",
  applied: "Applied",
  accepted: "Accepted",
  declined: "Declined",
};

export default function MatchesPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
        <p className="mt-1 text-muted-foreground">
          Projects that match your skills and interests
        </p>
      </div>

      {/* Search and filter */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search matches..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filter</span>
        </Button>
      </div>

      {/* Matches list */}
      <div className="space-y-4">
        {matches.map((match) => (
          <Card key={match.id}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">
                      <Link
                        href={`/projects/${match.projectId}`}
                        className="hover:underline"
                      >
                        {match.projectTitle}
                      </Link>
                    </CardTitle>
                    <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      {match.matchScore}% match
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[match.status as keyof typeof statusColors]
                      }`}
                    >
                      {statusLabels[match.status as keyof typeof statusLabels]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Matched {match.matchedAt}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Why you matched */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Why you matched
                </p>
                <p className="text-sm">{match.explanation}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {match.status === "pending" && (
                  <>
                    <Button className="flex-1 sm:flex-none">
                      <Check className="h-4 w-4" />
                      Apply
                    </Button>
                    <Button variant="outline">
                      <X className="h-4 w-4" />
                      Decline
                    </Button>
                  </>
                )}
                {match.status === "applied" && (
                  <Button variant="secondary" disabled>
                    Application Sent
                  </Button>
                )}
                {match.status === "accepted" && (
                  <Button>
                    <MessageSquare className="h-4 w-4" />
                    Message Team
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link href={`/projects/${match.projectId}`}>View Project</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
