import { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Filter, Users, Calendar, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Projects",
};

// Mock data for demo
const projects = [
  {
    id: "1",
    title: "AI Recipe Generator",
    description:
      "Build an AI-powered app that suggests recipes based on available ingredients. Looking for someone with experience in AI/ML and frontend development.",
    skills: ["React", "TypeScript", "AI/ML", "Node.js"],
    teamSize: "2-3 people",
    timeline: "4 weeks",
    commitment: "10-15 hrs/week",
    matchScore: 92,
    creator: {
      name: "Alex Chen",
      initials: "AC",
    },
    createdAt: "2 days ago",
  },
  {
    id: "2",
    title: "Climate Data Visualization",
    description:
      "Create interactive visualizations for climate change data. Need someone strong in data visualization and passionate about environmental causes.",
    skills: ["D3.js", "Python", "Data Science", "React"],
    teamSize: "2-4 people",
    timeline: "6 weeks",
    commitment: "8-12 hrs/week",
    matchScore: 88,
    creator: {
      name: "Sam Wilson",
      initials: "SW",
    },
    createdAt: "3 days ago",
  },
];

const tabs = [
  { id: "discover", label: "Discover" },
  { id: "matched", label: "Matched" },
  { id: "my-projects", label: "My Projects" },
];

export default function ProjectsPage() {
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
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                tab.id === "discover"
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
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </div>
      </div>

      {/* Projects grid */}
      <div className="grid gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                    <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      {project.matchScore}% match
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href={`/projects/${project.id}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button>Apply</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-sm">
                {project.description}
              </CardDescription>

              {/* Skills */}
              <div className="flex flex-wrap gap-2">
                {project.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {project.teamSize}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {project.timeline}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {project.commitment}
                </span>
              </div>

              {/* Creator */}
              <div className="flex items-center gap-2 border-t border-border pt-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {project.creator.initials}
                </div>
                <span className="text-sm text-muted-foreground">
                  Posted by {project.creator.name} • {project.createdAt}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
