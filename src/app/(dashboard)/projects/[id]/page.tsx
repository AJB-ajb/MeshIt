import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Share2,
  Flag,
  MessageSquare,
  Check,
  X,
  Sparkles,
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
  title: "Project Details",
};

// Mock project data
const project = {
  id: "1",
  title: "AI Recipe Generator",
  status: "active",
  description:
    "Build an AI-powered app that suggests recipes based on available ingredients. The app should be able to take a photo of ingredients and suggest recipes. We're looking for someone with experience in AI/ML, especially computer vision, and frontend development skills to build a clean, intuitive interface.",
  skills: ["React", "TypeScript", "AI/ML", "Computer Vision", "Node.js"],
  teamSize: "2-3",
  timeline: "4 weeks",
  commitment: "10-15 hrs/week",
  creator: {
    name: "Alex Chen",
    initials: "AC",
    bio: "ML Engineer passionate about food tech",
    skills: ["Python", "TensorFlow", "Backend"],
  },
  createdAt: "2 days ago",
};

// Mock matched collaborators
const matchedCollaborators = [
  {
    id: "1",
    name: "Sarah Johnson",
    initials: "SJ",
    matchScore: 95,
    description:
      "Strong React and TypeScript skills, previous experience with image recognition projects",
    skills: ["React", "TypeScript", "TensorFlow.js"],
    availability: "12 hrs/week",
  },
  {
    id: "2",
    name: "Mike Brown",
    initials: "MB",
    matchScore: 89,
    description:
      "Excellent frontend development skills and interest in AI applications",
    skills: ["React", "Node.js", "AI/ML"],
    availability: "10 hrs/week",
  },
];

export default function ProjectDetailPage() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {project.title}
            </h1>
            <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
              {project.status}
            </span>
          </div>
          <p className="text-muted-foreground">
            Created by {project.creator.name} • {project.createdAt}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About this project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{project.description}</p>

              {/* Skills */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {project.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-border bg-muted/50 px-2.5 py-1 text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Meta */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-4">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Team Size</p>
                  <p className="font-medium">{project.teamSize}</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Timeline</p>
                  <p className="font-medium">{project.timeline}</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Commitment</p>
                  <p className="font-medium">{project.commitment}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Matched Collaborators */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <CardTitle>Matched Collaborators</CardTitle>
              </div>
              <CardDescription>
                People who match your project requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {matchedCollaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="rounded-lg border border-border p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {collaborator.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{collaborator.name}</h4>
                          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                            {collaborator.matchScore}% match
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {collaborator.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">
                        <Check className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button size="sm" variant="outline">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {collaborator.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available: {collaborator.availability}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Creator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {project.creator.initials}
                </div>
                <div>
                  <h4 className="font-medium">{project.creator.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {project.creator.bio}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {project.creator.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-border px-2 py-0.5 text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <Button className="w-full">
                <MessageSquare className="h-4 w-4" />
                Contact Creator
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Share2 className="h-4 w-4" />
                Share Project
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Flag className="h-4 w-4" />
                Report Issue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
