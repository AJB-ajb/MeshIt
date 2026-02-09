"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  type ProfileFormState,
  type ExtractedProfileV2,
  defaultFormState,
  parseList,
  mapExtractedToFormState,
} from "@/lib/types/profile";

export function useProfile() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileFormState>(defaultFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [connectedProviders, setConnectedProviders] = useState<{
    github: boolean;
    google: boolean;
    linkedin: boolean;
  }>({
    github: false,
    google: false,
    linkedin: false,
  });
  const [isGithubProvider, setIsGithubProvider] = useState(false);
  const [sourceText, setSourceText] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

  const handleChange = useCallback(
    (field: keyof ProfileFormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setSuccess(false);
    },
    [],
  );

  const fetchProfile = useCallback(async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return { hasGithubProvider: false };
      }

      setUserEmail(user.email ?? null);

      const identities = user.identities || [];
      setConnectedProviders({
        github: identities.some(
          (id: { provider: string }) => id.provider === "github",
        ),
        google: identities.some(
          (id: { provider: string }) => id.provider === "google",
        ),
        linkedin: identities.some(
          (id: { provider: string }) => id.provider === "linkedin_oidc",
        ),
      });

      const appProvider = user.app_metadata?.provider;
      const appProviders = user.app_metadata?.providers || [];
      const hasGithubIdentity = identities.some(
        (identity: { provider: string }) => identity.provider === "github",
      );
      const hasGithubProvider =
        appProvider === "github" ||
        appProviders.includes("github") ||
        hasGithubIdentity;

      setIsGithubProvider(hasGithubProvider);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setSourceText(data.source_text ?? null);
        setCanUndo(!!data.previous_source_text);
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
          filterMaxDistance: hardFilters.max_distance_km?.toString() ?? "",
          filterMinHours: hardFilters.min_hours?.toString() ?? "",
          filterMaxHours: hardFilters.max_hours?.toString() ?? "",
          filterLanguages: Array.isArray(hardFilters.languages)
            ? hardFilters.languages.join(", ")
            : "",
        });
      }

      return { hasGithubProvider };
    } catch {
      router.replace("/login");
      return { hasGithubProvider: false };
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
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

      const { error: upsertError } = await supabase.from("profiles").upsert(
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
          hard_filters:
            Object.keys(hardFilters).length > 0 ? hardFilters : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      setIsSaving(false);

      if (upsertError) {
        setError("We couldn't save your profile. Please try again.");
        return;
      }

      setSuccess(true);
      setIsEditing(false);
    },
    [form],
  );

  const applyFreeFormUpdate = useCallback(
    async (updatedText: string, extractedProfile: ExtractedProfileV2) => {
      setError(null);
      setIsApplyingUpdate(true);

      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setIsApplyingUpdate(false);
        setError("Please sign in again.");
        return;
      }

      // Build snapshot of current profile fields for undo
      const currentSnapshot: Record<string, unknown> = {
        full_name: form.fullName,
        headline: form.headline,
        bio: form.bio,
        location: form.location,
        skills: parseList(form.skills),
        interests: parseList(form.interests),
        languages: parseList(form.languages),
        portfolio_url: form.portfolioUrl,
        github_url: form.githubUrl,
      };

      // Save updated profile + undo data to DB
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          source_text: updatedText,
          previous_source_text: sourceText,
          previous_profile_snapshot: currentSnapshot,
          // Apply extracted fields
          ...(extractedProfile.full_name != null && {
            full_name: extractedProfile.full_name,
          }),
          ...(extractedProfile.headline != null && {
            headline: extractedProfile.headline,
          }),
          ...(extractedProfile.bio != null && { bio: extractedProfile.bio }),
          ...(extractedProfile.location != null && {
            location: extractedProfile.location,
          }),
          ...(extractedProfile.skills != null && {
            skills: extractedProfile.skills,
          }),
          ...(extractedProfile.interests != null && {
            interests: extractedProfile.interests,
          }),
          ...(extractedProfile.languages != null && {
            languages: extractedProfile.languages,
          }),
          ...(extractedProfile.portfolio_url != null && {
            portfolio_url: extractedProfile.portfolio_url,
          }),
          ...(extractedProfile.github_url != null && {
            github_url: extractedProfile.github_url,
          }),
          ...(extractedProfile.skill_levels != null && {
            skill_levels: extractedProfile.skill_levels,
          }),
          ...(extractedProfile.location_preference != null && {
            location_preference: extractedProfile.location_preference,
          }),
          ...(extractedProfile.availability_slots != null && {
            availability_slots: extractedProfile.availability_slots,
          }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      setIsApplyingUpdate(false);

      if (upsertError) {
        setError("Failed to save update. Please try again.");
        return;
      }

      // Update local state
      setSourceText(updatedText);
      setCanUndo(true);
      setForm((prev) => mapExtractedToFormState(extractedProfile, prev));
      setSuccess(true);
    },
    [form, sourceText],
  );

  const undoLastUpdate = useCallback(async () => {
    setError(null);
    setIsApplyingUpdate(true);

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsApplyingUpdate(false);
      setError("Please sign in again.");
      return;
    }

    // Fetch the previous snapshot from DB
    const { data } = await supabase
      .from("profiles")
      .select("previous_source_text, previous_profile_snapshot")
      .eq("user_id", user.id)
      .single();

    if (!data?.previous_source_text) {
      setIsApplyingUpdate(false);
      setError("Nothing to undo.");
      return;
    }

    const snapshot = (data.previous_profile_snapshot ?? {}) as Record<
      string,
      unknown
    >;

    // Restore previous state
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        source_text: data.previous_source_text,
        previous_source_text: null,
        previous_profile_snapshot: null,
        ...(snapshot.full_name != null && { full_name: snapshot.full_name }),
        ...(snapshot.headline != null && { headline: snapshot.headline }),
        ...(snapshot.bio != null && { bio: snapshot.bio }),
        ...(snapshot.location != null && { location: snapshot.location }),
        ...(snapshot.skills != null && { skills: snapshot.skills }),
        ...(snapshot.interests != null && { interests: snapshot.interests }),
        ...(snapshot.languages != null && { languages: snapshot.languages }),
        ...(snapshot.portfolio_url != null && {
          portfolio_url: snapshot.portfolio_url,
        }),
        ...(snapshot.github_url != null && {
          github_url: snapshot.github_url,
        }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    setIsApplyingUpdate(false);

    if (upsertError) {
      setError("Failed to undo. Please try again.");
      return;
    }

    // Update local state
    setSourceText(data.previous_source_text);
    setCanUndo(false);
    if (snapshot) {
      setForm((prev) => ({
        ...prev,
        fullName: (snapshot.full_name as string) ?? prev.fullName,
        headline: (snapshot.headline as string) ?? prev.headline,
        bio: (snapshot.bio as string) ?? prev.bio,
        location: (snapshot.location as string) ?? prev.location,
        skills: Array.isArray(snapshot.skills)
          ? snapshot.skills.join(", ")
          : prev.skills,
        interests: Array.isArray(snapshot.interests)
          ? snapshot.interests.join(", ")
          : prev.interests,
        languages: Array.isArray(snapshot.languages)
          ? snapshot.languages.join(", ")
          : prev.languages,
        portfolioUrl: (snapshot.portfolio_url as string) ?? prev.portfolioUrl,
        githubUrl: (snapshot.github_url as string) ?? prev.githubUrl,
      }));
    }
    setSuccess(true);
  }, []);

  const handleLinkProvider = useCallback(
    async (provider: "github" | "google" | "linkedin_oidc") => {
      const supabase = createClient();
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      });

      if (error) {
        setError(`Failed to link ${provider}: ${error.message}`);
      }
    },
    [],
  );

  return {
    form,
    setForm,
    isLoading,
    isSaving,
    error,
    setError,
    success,
    isEditing,
    setIsEditing,
    userEmail,
    connectedProviders,
    isGithubProvider,
    handleChange,
    handleSubmit,
    handleLinkProvider,
    fetchProfile,
    sourceText,
    canUndo,
    isApplyingUpdate,
    applyFreeFormUpdate,
    undoLastUpdate,
  };
}
