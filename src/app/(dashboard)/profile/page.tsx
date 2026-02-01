"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Github, RefreshCw, Check, AlertCircle, Sparkles } from "lucide-react";

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

// GitHub sync status type
type GitHubSyncStatus = {
  synced: boolean;
  lastSyncedAt?: string;
  syncStatus?: 'pending' | 'syncing' | 'completed' | 'failed';
  data?: {
    githubUsername: string;
    githubUrl: string;
    avatarUrl: string;
    repoCount: number;
    totalStars: number;
    primaryLanguages: string[];
    inferredSkills: string[];
    inferredInterests: string[];
    experienceLevel: string;
    experienceSignals: string[];
    codingStyle: string;
    collaborationStyle: string;
    activityLevel: string;
    suggestedBio: string;
  };
  suggestions?: {
    suggestedBio: string | null;
    suggestedSkills: string[];
    suggestedInterests: string[];
    experienceUpgrade: string | null;
  } | null;
};

type ProfileFormState = {
  fullName: string;
  headline: string;
  bio: string;
  location: string;
  locationLat: string;
  locationLng: string;
  experienceLevel: string;
  collaborationStyle: string;
  remotePreference: string;
  availabilityHours: string;
  skills: string;
  interests: string;
  languages: string;
  projectTypes: string;
  preferredRoles: string;
  preferredStack: string;
  commitmentLevel: string;
  timelinePreference: string;
  portfolioUrl: string;
  githubUrl: string;
  // Hard filters
  filterMaxDistance: string;
  filterMinHours: string;
  filterMaxHours: string;
  filterLanguages: string;
};

const defaultFormState: ProfileFormState = {
  fullName: "",
  headline: "",
  bio: "",
  location: "",
  locationLat: "",
  locationLng: "",
  experienceLevel: "intermediate",
  collaborationStyle: "async",
  remotePreference: "50",
  availabilityHours: "",
  skills: "",
  interests: "",
  languages: "",
  projectTypes: "",
  preferredRoles: "",
  preferredStack: "",
  commitmentLevel: "10",
  timelinePreference: "1_month",
  portfolioUrl: "",
  githubUrl: "",
  // Hard filters
  filterMaxDistance: "",
  filterMinHours: "",
  filterMaxHours: "",
  filterLanguages: "",
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
  
  // GitHub sync state
  const [githubSync, setGithubSync] = useState<GitHubSyncStatus | null>(null);
  const [isGithubSyncing, setIsGithubSyncing] = useState(false);
  const [githubSyncError, setGithubSyncError] = useState<string | null>(null);
  const [isGithubProvider, setIsGithubProvider] = useState(false);

  // Fetch GitHub sync status
  const fetchGithubSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/github/sync');
      if (response.ok) {
        const data = await response.json();
        setGithubSync(data);
      }
    } catch (err) {
      console.error('Failed to fetch GitHub sync status:', err);
    }
  }, []);

  // Trigger GitHub sync
  const handleGithubSync = async () => {
    setIsGithubSyncing(true);
    setGithubSyncError(null);

    try {
      const response = await fetch('/api/github/sync', {
        method: 'POST',
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = 'Failed to sync GitHub profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        setGithubSyncError(errorMessage);
        return;
      }

      const data = await response.json();

      // Refresh sync status
      await fetchGithubSyncStatus();

      // Refresh the page data to show updated profile
      window.location.reload();
    } catch (err) {
      console.error('GitHub sync error:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to sync GitHub profile. Please try again.';
      setGithubSyncError(errorMessage);
    } finally {
      setIsGithubSyncing(false);
    }
  };

  // Apply GitHub suggestion to form
  const applySuggestion = (field: 'skills' | 'interests' | 'bio', values: string | string[]) => {
    if (field === 'bio' && typeof values === 'string') {
      setForm(prev => ({ ...prev, bio: values }));
    } else if (Array.isArray(values)) {
      const currentValues = parseList(form[field]);
      const newValues = [...new Set([...currentValues, ...values])];
      setForm(prev => ({ ...prev, [field]: newValues.join(', ') }));
    }
    setIsEditing(true);
  };

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
        
        // Check if user signed in with GitHub
        // Supabase stores provider info in multiple places depending on the auth method
        const appProvider = user.app_metadata?.provider;
        const appProviders = user.app_metadata?.providers || [];
        const identities = user.identities || [];
        const hasGithubIdentity = identities.some((identity: { provider: string }) => identity.provider === 'github');
        const hasGithubProvider = appProvider === 'github' || appProviders.includes('github') || hasGithubIdentity;
        
        console.log('GitHub auth check:', { appProvider, appProviders, identities, hasGithubProvider });
        setIsGithubProvider(hasGithubProvider);
        
        // Fetch GitHub sync status if GitHub provider
        if (hasGithubProvider) {
          fetchGithubSyncStatus();
        }

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (data) {
          const preferences = data.project_preferences ?? {};
          const hardFilters = data.hard_filters ?? {};
          setForm({
            fullName: data.full_name ?? "",
            headline: data.headline ?? "",
            bio: data.bio ?? "",
            location: data.location ?? "",
            locationLat: data.location_lat?.toString() ?? "",
            locationLng: data.location_lng?.toString() ?? "",
            experienceLevel: data.experience_level ?? "intermediate",
            collaborationStyle: data.collaboration_style ?? "async",
            remotePreference: data.remote_preference?.toString() ?? "50",
            availabilityHours: data.availability_hours?.toString() ?? "",
            skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
            interests: Array.isArray(data.interests)
              ? data.interests.join(", ")
              : "",
            languages: Array.isArray(data.languages)
              ? data.languages.join(", ")
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
            // Hard filters
            filterMaxDistance: hardFilters.max_distance_km?.toString() ?? "",
            filterMinHours: hardFilters.min_hours?.toString() ?? "",
            filterMaxHours: hardFilters.max_hours?.toString() ?? "",
            filterLanguages: Array.isArray(hardFilters.languages)
              ? hardFilters.languages.join(", ")
              : "",
          });
        }
      })
      .catch(() => {
        router.replace("/login");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router, fetchGithubSyncStatus]);

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
    const locationLat = Number(form.locationLat);
    const locationLng = Number(form.locationLng);
    const remotePreference = Number(form.remotePreference);
    const filterMaxDistance = Number(form.filterMaxDistance);
    const filterMinHours = Number(form.filterMinHours);
    const filterMaxHours = Number(form.filterMaxHours);
    const filterLanguages = parseList(form.filterLanguages);

    // Build hard_filters object (only include set values)
    const hardFilters: Record<string, unknown> = {};
    if (Number.isFinite(filterMaxDistance) && filterMaxDistance > 0) {
      hardFilters.max_distance_km = filterMaxDistance;
    }
    if (Number.isFinite(filterMinHours) && filterMinHours > 0) {
      hardFilters.min_hours = filterMinHours;
    }
    if (Number.isFinite(filterMaxHours) && filterMaxHours > 0) {
      hardFilters.max_hours = filterMaxHours;
    }
    if (filterLanguages.length > 0) {
      hardFilters.languages = filterLanguages;
    }

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          full_name: form.fullName.trim(),
          headline: form.headline.trim(),
          bio: form.bio.trim(),
          location: form.location.trim(),
          location_lat: Number.isFinite(locationLat) ? locationLat : null,
          location_lng: Number.isFinite(locationLng) ? locationLng : null,
          experience_level: form.experienceLevel,
          collaboration_style: form.collaborationStyle,
          remote_preference: Number.isFinite(remotePreference)
            ? Math.min(100, Math.max(0, remotePreference))
            : null,
          availability_hours: Number.isFinite(availabilityHours)
            ? availabilityHours
            : null,
          skills: parseList(form.skills),
          interests: parseList(form.interests),
          languages: parseList(form.languages),
          portfolio_url: form.portfolioUrl.trim(),
          github_url: form.githubUrl.trim(),
          project_preferences: {
            project_types: parseList(form.projectTypes),
            preferred_roles: parseList(form.preferredRoles),
            preferred_stack: parseList(form.preferredStack),
            commitment_level: form.commitmentLevel,
            timeline_preference: form.timelinePreference,
          },
          hard_filters: Object.keys(hardFilters).length > 0 ? hardFilters : null,
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
                    placeholder="e.g., Berlin, Germany"
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
                  <p className="text-xs text-muted-foreground">
                    Your actual weekly availability for projects. This is used for matching with project requirements.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="locationLat" className="text-sm font-medium">
                    Latitude (for matching)
                  </label>
                  <Input
                    id="locationLat"
                    type="number"
                    step="any"
                    value={form.locationLat}
                    onChange={(e) => handleChange("locationLat", e.target.value)}
                    placeholder="e.g., 52.52"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="locationLng" className="text-sm font-medium">
                    Longitude (for matching)
                  </label>
                  <Input
                    id="locationLng"
                    type="number"
                    step="any"
                    value={form.locationLng}
                    onChange={(e) => handleChange("locationLng", e.target.value)}
                    placeholder="e.g., 13.405"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="remotePreference" className="text-sm font-medium">
                  Remote preference: {form.remotePreference}%
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">On-site</span>
                  <input
                    id="remotePreference"
                    type="range"
                    min="0"
                    max="100"
                    value={form.remotePreference}
                    onChange={(e) => handleChange("remotePreference", e.target.value)}
                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground">Remote</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  0% = prefer fully on-site, 100% = prefer fully remote
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="languages" className="text-sm font-medium">
                  Spoken languages (comma-separated)
                </label>
                <Input
                  id="languages"
                  value={form.languages}
                  onChange={(e) => handleChange("languages", e.target.value)}
                  placeholder="e.g., en, de, es"
                />
                <p className="text-xs text-muted-foreground">
                  Use ISO codes: en (English), de (German), es (Spanish), fr (French), etc.
                </p>
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
                Tell us what kinds of projects youre excited to join.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-md border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900 p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> "Preferred project commitment" is different from "Availability" above. 
                  Availability is your actual weekly hours available, while preferred commitment is the project 
                  commitment level you're looking for. Make sure both are set for accurate matching.
                </p>
              </div>
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
                    Preferred project commitment
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
                  <p className="text-xs text-muted-foreground">
                    Your preferred project commitment level. This helps match you with projects that fit your desired time investment.
                  </p>
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

          <Card>
            <CardHeader>
              <CardTitle>Match Filters</CardTitle>
              <CardDescription>
                Set preferences for which projects rank higher in your matches.
                Projects outside these preferences will still appear but with lower scores.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="filterMaxDistance" className="text-sm font-medium">
                    Max distance (km)
                  </label>
                  <Input
                    id="filterMaxDistance"
                    type="number"
                    min="0"
                    value={form.filterMaxDistance}
                    onChange={(e) => handleChange("filterMaxDistance", e.target.value)}
                    placeholder="e.g., 500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for no distance preference
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="filterLanguages" className="text-sm font-medium">
                    Required languages
                  </label>
                  <Input
                    id="filterLanguages"
                    value={form.filterLanguages}
                    onChange={(e) => handleChange("filterLanguages", e.target.value)}
                    placeholder="e.g., en, de"
                  />
                  <p className="text-xs text-muted-foreground">
                    Project owners must speak these languages
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="filterMinHours" className="text-sm font-medium">
                    Min hours/week
                  </label>
                  <Input
                    id="filterMinHours"
                    type="number"
                    min="0"
                    value={form.filterMinHours}
                    onChange={(e) => handleChange("filterMinHours", e.target.value)}
                    placeholder="e.g., 5"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="filterMaxHours" className="text-sm font-medium">
                    Max hours/week
                  </label>
                  <Input
                    id="filterMaxHours"
                    type="number"
                    min="0"
                    value={form.filterMaxHours}
                    onChange={(e) => handleChange("filterMaxHours", e.target.value)}
                    placeholder="e.g., 20"
                  />
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
          {/* GitHub Sync Section - Show for everyone */}
          <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  <CardTitle className="text-lg">GitHub Profile Enrichment</CardTitle>
                </div>
                {isGithubProvider && (
                  <Button
                    onClick={handleGithubSync}
                    disabled={isGithubSyncing}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {isGithubSyncing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Sync Now
                      </>
                    )}
                  </Button>
                )}
              </div>
              <CardDescription>
                Automatically enrich your profile with skills, interests, and experience from your GitHub activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isGithubProvider && (
                <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Connect with GitHub</strong> to automatically analyze your repositories, 
                    commit messages, and coding style to enrich your profile with AI-powered insights.
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Sign out and sign back in with GitHub to enable this feature.
                  </p>
                </div>
              )}

              {isGithubProvider && (
                <>
                  {githubSyncError && (
                    <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {githubSyncError}
                    </div>
                  )}

                  {githubSync?.synced && githubSync.data && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <Check className="h-4 w-4" />
                        Last synced: {new Date(githubSync.lastSyncedAt!).toLocaleDateString()} at{' '}
                        {new Date(githubSync.lastSyncedAt!).toLocaleTimeString()}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">GitHub Username</p>
                          <a
                            href={githubSync.data.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                          >
                            @{githubSync.data.githubUsername}
                          </a>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Activity</p>
                          <p className="font-medium">
                            {githubSync.data.repoCount} repos · {githubSync.data.totalStars} stars ·{' '}
                            <span className="capitalize">{githubSync.data.activityLevel}</span> activity
                          </p>
                        </div>
                      </div>

                      {githubSync.data.primaryLanguages.length > 0 && (
                        <div>
                          <p className="mb-2 text-sm text-muted-foreground">Languages Detected</p>
                          <div className="flex flex-wrap gap-2">
                            {githubSync.data.primaryLanguages.slice(0, 8).map((lang) => (
                              <Badge key={lang} variant="secondary" className="bg-purple-100 dark:bg-purple-900/30">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {githubSync.data.codingStyle && (
                        <div>
                          <p className="text-sm text-muted-foreground">Coding Style</p>
                          <p className="font-medium text-sm">{githubSync.data.codingStyle}</p>
                        </div>
                      )}

                      {githubSync.data.experienceSignals.length > 0 && (
                        <div>
                          <p className="mb-2 text-sm text-muted-foreground">Experience Signals</p>
                          <ul className="text-sm space-y-1">
                            {githubSync.data.experienceSignals.slice(0, 3).map((signal, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Sparkles className="h-3 w-3 mt-1 text-purple-500" />
                                {signal}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggestions */}
                      {githubSync.suggestions && (
                        ((githubSync.suggestions.suggestedSkills?.length ?? 0) > 0 ||
                          (githubSync.suggestions.suggestedInterests?.length ?? 0) > 0 ||
                          githubSync.suggestions.suggestedBio) && (
                          <div className="rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 p-4 space-y-3">
                            <p className="text-sm font-medium flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-purple-500" />
                              AI Suggestions from your GitHub
                            </p>

                            {(githubSync.suggestions.suggestedSkills?.length ?? 0) > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs text-muted-foreground">Suggested Skills</p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs"
                                    onClick={() => applySuggestion('skills', githubSync.suggestions!.suggestedSkills || [])}
                                  >
                                    Add All
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {(githubSync.suggestions.suggestedSkills || []).slice(0, 6).map((skill) => (
                                    <Badge
                                      key={skill}
                                      variant="outline"
                                      className="text-xs cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30"
                                      onClick={() => applySuggestion('skills', [skill])}
                                    >
                                      + {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(githubSync.suggestions.suggestedInterests?.length ?? 0) > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs text-muted-foreground">Suggested Interests</p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs"
                                    onClick={() => applySuggestion('interests', githubSync.suggestions!.suggestedInterests || [])}
                                  >
                                    Add All
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {(githubSync.suggestions.suggestedInterests || []).slice(0, 5).map((interest) => (
                                    <Badge
                                      key={interest}
                                      variant="outline"
                                      className="text-xs cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30"
                                      onClick={() => applySuggestion('interests', [interest])}
                                    >
                                      + {interest}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {githubSync.suggestions.suggestedBio && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs text-muted-foreground">Suggested Bio</p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs"
                                    onClick={() => applySuggestion('bio', githubSync.suggestions!.suggestedBio!)}
                                  >
                                    Use This
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground italic">
                                  &quot;{githubSync.suggestions.suggestedBio}&quot;
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {!githubSync?.synced && !isGithubSyncing && (
                    <p className="text-sm text-muted-foreground">
                      Click &quot;Sync Now&quot; to analyze your GitHub profile and automatically enrich your profile with skills,
                      interests, and experience level based on your repositories and commits.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

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
                    {form.locationLat && form.locationLng && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({form.locationLat}, {form.locationLng})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Availability</p>
                  <p className="font-medium">
                    {form.availabilityHours
                      ? `${form.availabilityHours} hrs/week`
                      : "Not provided"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your actual weekly availability
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Remote preference
                  </p>
                  <p className="font-medium">
                    {form.remotePreference}% remote
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Spoken languages
                  </p>
                  <p className="font-medium">
                    {form.languages || "Not provided"}
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
                    Preferred project commitment
                  </p>
                  <p className="font-medium">{form.commitmentLevel} hrs/week</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your preferred project commitment level
                  </p>
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

          <Card>
            <CardHeader>
              <CardTitle>Match Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Max distance</p>
                  <p className="font-medium">
                    {form.filterMaxDistance ? `${form.filterMaxDistance} km` : "No limit"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Required languages</p>
                  <p className="font-medium">
                    {form.filterLanguages || "Any"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Hours range</p>
                  <p className="font-medium">
                    {form.filterMinHours || form.filterMaxHours
                      ? `${form.filterMinHours || "0"} - ${form.filterMaxHours || "∞"} hrs/week`
                      : "Any"}
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
