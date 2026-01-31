import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mic } from "lucide-react";

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
  title: "Create Project",
};

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Project</h1>
        <p className="mt-1 text-muted-foreground">
          Describe your project and let AI find the perfect collaborators
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Tell us about your project in plain language. You can paste from
            Slack, Discord, or describe it yourself.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Project Title
            </label>
            <Input
              id="title"
              placeholder="e.g., AI Recipe Generator"
              className="text-lg"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <div className="relative">
              <textarea
                id="description"
                rows={6}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe your project and what kind of collaborators you're looking for...

Example: Building a Minecraft-style collaborative IDE, need 2-3 people with WebGL or game dev experience, hackathon this weekend."
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute bottom-2 right-2"
                title="Use voice input"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Our AI will extract skills, team size, and timeline from your
              description.
            </p>
          </div>

          {/* Timeline */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="timeline" className="text-sm font-medium">
                Timeline
              </label>
              <select
                id="timeline"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="weekend">This weekend</option>
                <option value="1_week">1 week</option>
                <option value="1_month">1 month</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="commitment" className="text-sm font-medium">
                Time Commitment
              </label>
              <select
                id="commitment"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="5">5 hrs/week</option>
                <option value="10">10 hrs/week</option>
                <option value="15">15 hrs/week</option>
                <option value="20">20+ hrs/week</option>
              </select>
            </div>
          </div>

          {/* Team size */}
          <div className="space-y-2">
            <label htmlFor="team-size" className="text-sm font-medium">
              Team Size
            </label>
            <select
              id="team-size"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="2">2 people</option>
              <option value="3">3 people</option>
              <option value="4">4 people</option>
              <option value="5">5 people</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              Create Project
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/projects">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <p className="text-center text-sm text-muted-foreground">
        After creating your project, our AI will immediately start finding
        matching collaborators based on your description.
      </p>
    </div>
  );
}
