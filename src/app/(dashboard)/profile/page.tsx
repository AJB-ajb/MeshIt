"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

type ProfileFormState = {
  fullName: string;
  headline: string;
  bio: string;
  location: string;
  experienceLevel: string;
  collaborationStyle: string;
  availabilityHours: string;
  skills: string;
  interests: string;
  projectTypes: string;
  preferredRoles: string;
  preferredStack: string;
  commitmentLevel: string;
  timelinePreference: string;
  portfolioUrl: string;
  githubUrl: string;
};

const defaultFormState: ProfileFormState = {
  fullName: "",
  headline: "",
  bio: "",
  location: "",
  experienceLevel: "intermediate",
  collaborationStyle: "async",
  availabilityHours: "",
  skills: "",
  interests: "",
  projectTypes: "",
  preferredRoles: "",
  preferredStack: "",
  commitmentLevel: "10",
  timelinePreference: "1_month",
  portfolioUrl: "",
  githubUrl: "",
};

const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileFormState>(defaultFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!user) {
          router.replace("/login");
          return;
        }

        setUserEmail(user.email ?? null);

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (data) {
          const preferences = data.project_preferences ?? {};
          setForm({
            fullName: data.full_name ?? "",
            headline: data.headline ?? "",
            bio: data.bio ?? "",
            location: data.location ?? "",
            experienceLevel: data.experience_level ?? "intermediate",
            collaborationStyle: data.collaboration_style ?? "async",
            availabilityHours: data.availability_hours?.toString() ?? "",
            skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
            interests: Array.isArray(data.interests)
              ? data.interests.join(", ")
              : "",
            projectTypes: Array.isArray(preferences.project_types)
              ? preferences.project_types.join(", ")
              : "",
            preferredRoles: Array.isArray(preferences.preferred_roles)
              ? preferences.preferred_roles.join(", ")
              : "",
            preferredStack: Array.isArray(preferences.preferred_stack)
              ? preferences.preferred_stack.join(", ")
              : "",
            commitmentLevel: preferences.commitment_level ?? "10",
            timelinePreference: preferences.timeline_preference ?? "1_month",
            portfolioUrl: data.portfolio_url ?? "",
            githubUrl: data.github_url ?? "",
          });
        }
      })
      .catch(() => {
        router.replace("/login");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsSaving(false);
      setError("Please sign in again to save your profile.");
      return;
    }

    const availabilityHours = Number(form.availabilityHours);
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          full_name: form.fullName.trim(),
          headline: form.headline.trim(),
          bio: form.bio.trim(),
          location: form.location.trim(),
          experience_level: form.experienceLevel,
          collaboration_style: form.collaborationStyle,
          availability_hours: Number.isFinite(availabilityHours)
            ? availabilityHours
            : null,
          skills: parseList(form.skills),
          interests: parseList(form.interests),
          portfolio_url: form.portfolioUrl.trim(),
          github_url: form.githubUrl.trim(),
          project_preferences: {
            project_types: parseList(form.projectTypes),
            preferred_roles: parseList(form.preferredRoles),
            preferred_stack: parseList(form.preferredStack),
            commitment_level: form.commitmentLevel,
            timeline_preference: form.timelinePreference,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    setIsSaving(false);

    if (upsertError) {
      setError("We couldn't save your profile. Please try again.");
      return;
    }

    setSuccess(true);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const skillsList = parseList(form.skills);
  const interestsList = parseList(form.interests);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="mt-1 text-muted-foreground">
            {userEmail && <span className="text-sm">{userEmail}</span>}
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          Profile updated successfully!
        </p>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Share the essentials about who you are and how you like to work.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium">
                    Full name
                  </label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    placeholder="e.g., Alex Johnson"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="headline" className="text-sm font-medium">
                    Headline
                  </label>
                  <Input
                    id="headline"
                    value={form.headline}
                    onChange={(e) => handleChange("headline", e.target.value)}
                    placeholder="e.g., Full-stack developer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium">
                  About you
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  placeholder="What do you enjoy building? What makes you unique?"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Location
                  </label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="e.g., Lagos, Remote"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="availabilityHours"
                    className="text-sm font-medium"
                  >
                    Availability (hrs/week)
                  </label>
                  <Input
                    id="availabilityHours"
                    value={form.availabilityHours}
                    onChange={(e) =>
                      handleChange("availabilityHours", e.target.value)
                    }
                    placeholder="e.g., 10"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="experienceLevel"
                    className="text-sm font-medium"
                  >
                    Experience level
                  </label>
                  <select
                    id="experienceLevel"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={form.experienceLevel}
                    onChange={(e) =>
                      handleChange("experienceLevel", e.target.value)
                    }
                  >
                    <option value="junior">Junior</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="collaborationStyle"
                    className="text-sm font-medium"
                  >
                    Collaboration style
                  </label>
                  <select
                    id="collaborationStyle"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={form.collaborationStyle}
                    onChange={(e) =>
                      handleChange("collaborationStyle", e.target.value)
                    }
                  >
                    <option value="async">Mostly async</option>
                    <option value="sync">Mostly sync</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="skills" className="text-sm font-medium">
                    Skills (comma-separated)
                  </label>
                  <Input
                    id="skills"
                    value={form.skills}
                    onChange={(e) => handleChange("skills", e.target.value)}
                    placeholder="e.g., React, TypeScript, Supabase"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="interests" className="text-sm font-medium">
                    Interests (comma-separated)
                  </label>
                  <Input
                    id="interests"
                    value={form.interests}
                    onChange={(e) => handleChange("interests", e.target.value)}
                    placeholder="e.g., AI, fintech, education"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="portfolioUrl" className="text-sm font-medium">
                    Portfolio link
                  </label>
                  <Input
                    id="portfolioUrl"
                    value={form.portfolioUrl}
                    onChange={(e) =>
                      handleChange("portfolioUrl", e.target.value)
                    }
                    placeholder="https://your-portfolio.com"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="githubUrl" className="text-sm font-medium">
                    GitHub link
                  </label>
                  <Input
                    id="githubUrl"
                    value={form.githubUrl}
                    onChange={(e) => handleChange("githubUrl", e.target.value)}
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Preferences</CardTitle>
              <CardDescription>
                Tell us what kinds of projects you&apos;re excited to join.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="projectTypes" className="text-sm font-medium">
                    Project types (comma-separated)
                  </label>
                  <Input
                    id="projectTypes"
                    value={form.projectTypes}
                    onChange={(e) =>
                      handleChange("projectTypes", e.target.value)
                    }
                    placeholder="e.g., SaaS, hackathon, open source"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="preferredRoles"
                    className="text-sm font-medium"
                  >
                    Preferred roles (comma-separated)
                  </label>
                  <Input
                    id="preferredRoles"
                    value={form.preferredRoles}
                    onChange={(e) =>
                      handleChange("preferredRoles", e.target.value)
                    }
                    placeholder="e.g., Frontend, Backend, PM"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="preferredStack" className="text-sm font-medium">
                  Preferred tech stack (comma-separated)
                </label>
                <Input
                  id="preferredStack"
                  value={form.preferredStack}
                  onChange={(e) =>
                    handleChange("preferredStack", e.target.value)
                  }
                  placeholder="e.g., React, Node, Postgres"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="commitmentLevel"
                    className="text-sm font-medium"
                  >
                    Time commitment
                  </label>
                  <select
                    id="commitmentLevel"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={form.commitmentLevel}
                    onChange={(e) =>
                      handleChange("commitmentLevel", e.target.value)
                    }
                  >
                    <option value="5">5 hrs/week</option>
                    <option value="10">10 hrs/week</option>
                    <option value="15">15 hrs/week</option>
                    <option value="20">20+ hrs/week</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="timelinePreference"
                    className="text-sm font-medium"
                  >
                    Timeline preference
                  </label>
                  <select
                    id="timelinePreference"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={form.timelinePreference}
                    onChange={(e) =>
                      handleChange("timelinePreference", e.target.value)
                    }
                  >
                    <option value="weekend">This weekend</option>
                    <option value="1_week">1 week</option>
                    <option value="1_month">1 month</option>
                    <option value="ongoing">Ongoing</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* View mode */}
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Full name</p>
                  <p className="font-medium">
                    {form.fullName || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Headline</p>
                  <p className="font-medium">
                    {form.headline || "Not provided"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">About</p>
                <p className="font-medium">{form.bio || "Not provided"}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {form.location || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Availability</p>
                  <p className="font-medium">
                    {form.availabilityHours
                      ? `${form.availabilityHours} hrs/week`
                      : "Not provided"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Experience level
                  </p>
                  <p className="font-medium capitalize">
                    {form.experienceLevel}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Collaboration style
                  </p>
                  <p className="font-medium capitalize">
                    {form.collaborationStyle === "async"
                      ? "Mostly async"
                      : form.collaborationStyle === "sync"
                        ? "Mostly sync"
                        : "Hybrid"}
                  </p>
                </div>
              </div>

              {skillsList.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {interestsList.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Interests
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {interestsList.map((interest) => (
                      <Badge key={interest} variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio</p>
                  {form.portfolioUrl ? (
                    <a
                      href={form.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {form.portfolioUrl}
                    </a>
                  ) : (
                    <p className="font-medium">Not provided</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GitHub</p>
                  {form.githubUrl ? (
                    <a
                      href={form.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {form.githubUrl}
                    </a>
                  ) : (
                    <p className="font-medium">Not provided</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Project types</p>
                  <p className="font-medium">
                    {form.projectTypes || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Preferred roles
                  </p>
                  <p className="font-medium">
                    {form.preferredRoles || "Not provided"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Preferred tech stack
                </p>
                <p className="font-medium">
                  {form.preferredStack || "Not provided"}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Time commitment
                  </p>
                  <p className="font-medium">{form.commitmentLevel} hrs/week</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Timeline preference
                  </p>
                  <p className="font-medium">
                    {form.timelinePreference === "weekend"
                      ? "This weekend"
                      : form.timelinePreference === "1_week"
                        ? "1 week"
                        : form.timelinePreference === "1_month"
                          ? "1 month"
                          : "Ongoing"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
