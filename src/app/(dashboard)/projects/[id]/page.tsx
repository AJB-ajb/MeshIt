"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

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
import { createClient } from "@/lib/supabase/client";

type Project = {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  team_size: number;
  timeline: string;
  commitment_hours: number;
  experience_level: string;
  status: string;
  created_at: string;
  expires_at: string;
  creator_id: string;
  profiles?: {
    full_name: string | null;
    headline: string | null;
    skills: string[] | null;
    user_id: string;
  };
};

type ProjectFormState = {
  title: string;
  description: string;
  requiredSkills: string;
  timeline: string;
  commitmentHours: string;
  teamSize: string;
  experienceLevel: string;
  status: string;
};

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

const getInitials = (name: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormState>({
    title: "",
    description: "",
    requiredSkills: "",
    timeline: "1_month",
    commitmentHours: "10",
    teamSize: "3",
    experienceLevel: "any",
    status: "open",
  });

  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetch project with creator profile
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          profiles:creator_id (
            full_name,
            headline,
            skills,
            user_id
          )
        `
        )
        .eq("id", projectId)
        .single();

      if (error || !data) {
        console.error("Error fetching project:", error);
        setIsLoading(false);
        return;
      }

      setProject(data);
      setIsOwner(user?.id === data.creator_id);
      setForm({
        title: data.title,
        description: data.description,
        requiredSkills: data.required_skills?.join(", ") || "",
        timeline: data.timeline || "1_month",
        commitmentHours: data.commitment_hours?.toString() || "10",
        teamSize: data.team_size?.toString() || "3",
        experienceLevel: data.experience_level || "any",
        status: data.status || "open",
      });
      setIsLoading(false);
    };

    fetchProject();
  }, [projectId]);

  const handleChange = (field: keyof ProjectFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const parseList = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        title: form.title.trim(),
        description: form.description.trim(),
        required_skills: parseList(form.requiredSkills),
        timeline: form.timeline,
        commitment_hours: Number(form.commitmentHours),
        team_size: Number(form.teamSize),
        experience_level: form.experienceLevel,
        status: form.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    setIsSaving(false);

    if (updateError) {
      setError("Failed to update project. Please try again.");
      return;
    }

    // Refresh project data
    const { data } = await supabase
      .from("projects")
      .select(
        `
        *,
        profiles:creator_id (
          full_name,
          headline,
          skills,
          user_id
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (data) {
      setProject(data);
    }

    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (deleteError) {
      setIsDeleting(false);
      setError("Failed to delete project. Please try again.");
      return;
    }

    router.push("/projects");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Project not found.</p>
            <Button asChild className="mt-4">
              <Link href="/projects">Browse Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const creatorName = project.profiles?.full_name || "Unknown";
  const creatorHeadline = project.profiles?.headline || "";
  const creatorSkills = project.profiles?.skills || [];

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

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <Input
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="text-2xl font-bold"
              />
            ) : (
              <h1 className="text-3xl font-bold tracking-tight">
                {project.title}
              </h1>
            )}
            <Badge
              variant={
                project.status === "open"
                  ? "default"
                  : project.status === "filled"
                    ? "secondary"
                    : "outline"
              }
            >
              {project.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Created by {creatorName} • {formatDate(project.created_at)}
          </p>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}
          </div>
        )}
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
              {isEditing ? (
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {project.description}
                </p>
              )}

              {/* Skills */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Required Skills</h4>
                {isEditing ? (
                  <Input
                    value={form.requiredSkills}
                    onChange={(e) =>
                      handleChange("requiredSkills", e.target.value)
                    }
                    placeholder="React, TypeScript, Node.js (comma-separated)"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {project.required_skills?.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {(!project.required_skills ||
                      project.required_skills.length === 0) && (
                      <span className="text-sm text-muted-foreground">
                        No specific skills listed
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Meta */}
              {isEditing ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timeline</label>
                    <select
                      value={form.timeline}
                      onChange={(e) => handleChange("timeline", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="weekend">This weekend</option>
                      <option value="1_week">1 week</option>
                      <option value="1_month">1 month</option>
                      <option value="ongoing">Ongoing</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Commitment</label>
                    <select
                      value={form.commitmentHours}
                      onChange={(e) =>
                        handleChange("commitmentHours", e.target.value)
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="5">5 hrs/week</option>
                      <option value="10">10 hrs/week</option>
                      <option value="15">15 hrs/week</option>
                      <option value="20">20+ hrs/week</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Team Size</label>
                    <select
                      value={form.teamSize}
                      onChange={(e) => handleChange("teamSize", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="2">2 people</option>
                      <option value="3">3 people</option>
                      <option value="4">4 people</option>
                      <option value="5">5 people</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="open">Open</option>
                      <option value="filled">Filled</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-border p-4">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Team Size
                    </p>
                    <p className="font-medium">{project.team_size} people</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Timeline
                    </p>
                    <p className="font-medium">
                      {formatTimeline(project.timeline)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Commitment
                    </p>
                    <p className="font-medium">
                      {project.commitment_hours} hrs/week
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Matched Collaborators (placeholder for now) */}
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
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI matching will find collaborators once your project is
                published. Check back soon!
              </p>
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
                  {getInitials(creatorName)}
                </div>
                <div>
                  <h4 className="font-medium">{creatorName}</h4>
                  {creatorHeadline && (
                    <p className="text-sm text-muted-foreground">
                      {creatorHeadline}
                    </p>
                  )}
                </div>
              </div>
              {creatorSkills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {creatorSkills.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {!isOwner && (
                <Button className="w-full">
                  <MessageSquare className="h-4 w-4" />
                  Contact Creator
                </Button>
              )}
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
