"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  type ProfileFormState,
  type ExtractedProfileV2,
  type SkillLevel,
  type AvailabilitySlots,
  type LocationMode,
  defaultFormState,
  parseList,
  mapExtractedToFormState,
} from "@/lib/types/profile";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProfileData = {
  form: ProfileFormState;
  userEmail: string | null;
  connectedProviders: {
    github: boolean;
    google: boolean;
    linkedin: boolean;
  };
  isGithubProvider: boolean;
  sourceText: string | null;
  canUndo: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseSkillLevels(raw: unknown): SkillLevel[] {
  if (raw == null) return [];
  // DB stores as { "domain": level } object or as SkillLevel[]
  if (Array.isArray(raw)) {
    return raw.filter(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "name" in item &&
        "level" in item,
    ) as SkillLevel[];
  }
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, number>).map(
      ([name, level]) => ({ name, level: Number(level) || 0 }),
    );
  }
  return [];
}

function parseLocationMode(raw: unknown): LocationMode {
  if (raw === "remote" || raw === "in_person" || raw === "either") return raw;
  return "either";
}

function parseAvailabilitySlots(raw: unknown): AvailabilitySlots {
  if (raw != null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as AvailabilitySlots;
  }
  return {};
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

async function fetchProfile(): Promise<ProfileData> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const identities = user.identities || [];
  const connectedProviders = {
    github: identities.some(
      (id: { provider: string }) => id.provider === "github",
    ),
    google: identities.some(
      (id: { provider: string }) => id.provider === "google",
    ),
    linkedin: identities.some(
      (id: { provider: string }) => id.provider === "linkedin_oidc",
    ),
  };

  const appProvider = user.app_metadata?.provider;
  const appProviders = user.app_metadata?.providers || [];
  const hasGithubIdentity = identities.some(
    (identity: { provider: string }) => identity.provider === "github",
  );
  const isGithubProvider =
    appProvider === "github" ||
    appProviders.includes("github") ||
    hasGithubIdentity;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  let form = defaultFormState;
  let sourceText: string | null = null;
  let canUndo = false;

  if (data) {
    sourceText = data.source_text ?? null;
    canUndo = !!data.previous_source_text;
    const hardFilters = data.hard_filters ?? {};
    form = {
      fullName: data.full_name ?? "",
      headline: data.headline ?? "",
      bio: data.bio ?? "",
      location: data.location ?? "",
      locationLat: data.location_lat?.toString() ?? "",
      locationLng: data.location_lng?.toString() ?? "",
      skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
      interests: Array.isArray(data.interests) ? data.interests.join(", ") : "",
      languages: Array.isArray(data.languages) ? data.languages.join(", ") : "",
      portfolioUrl: data.portfolio_url ?? "",
      githubUrl: data.github_url ?? "",
      filterMaxDistance: hardFilters.max_distance_km?.toString() ?? "",
      filterLanguages: Array.isArray(hardFilters.languages)
        ? hardFilters.languages.join(", ")
        : "",
      collaborationStyle: data.collaboration_style ?? "async",
      skillLevels: parseSkillLevels(data.skill_levels),
      locationMode: parseLocationMode(data.location_mode),
      availabilitySlots: parseAvailabilitySlots(data.availability_slots),
    };
  }

  return {
    form,
    userEmail: user.email ?? null,
    connectedProviders,
    isGithubProvider,
    sourceText,
    canUndo,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useProfile() {
  const router = useRouter();
  const {
    data,
    error: fetchError,
    isLoading,
    mutate,
  } = useSWR("profile", fetchProfile, {
    onError: () => {
      router.replace("/login");
    },
  });

  // Local UI state
  const [form, setForm] = useState<ProfileFormState>(defaultFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

  // Sync SWR data into local form state when data arrives or revalidates,
  // but only when the user is NOT actively editing.
  const isEditingRef = useRef(isEditing);
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    if (data?.form && !isEditingRef.current) {
      queueMicrotask(() => {
        setForm(data.form);
      });
    }
  }, [data]);

  const handleChange = useCallback(
    (field: keyof ProfileFormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setSuccess(false);
    },
    [],
  );

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

      const locationLat = Number(form.locationLat);
      const locationLng = Number(form.locationLng);

      // Convert skillLevels array to DB format { domain: level }
      const skillLevelsObj: Record<string, number> = {};
      for (const sl of form.skillLevels) {
        if (sl.name.trim()) {
          skillLevelsObj[sl.name.trim()] = sl.level;
        }
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
          skills: parseList(form.skills),
          interests: parseList(form.interests),
          languages: parseList(form.languages),
          portfolio_url: form.portfolioUrl.trim(),
          github_url: form.githubUrl.trim(),
          skill_levels: skillLevelsObj,
          location_mode: form.locationMode,
          availability_slots: form.availabilitySlots,
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
      await mutate();
    },
    [form, mutate],
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
        skill_levels: form.skillLevels,
        location_mode: form.locationMode,
        availability_slots: form.availabilitySlots,
      };

      // Save updated profile + undo data to DB
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          source_text: updatedText,
          previous_source_text: data?.sourceText ?? null,
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
          ...(extractedProfile.location_mode != null && {
            location_mode: extractedProfile.location_mode,
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

      // Optimistically update local form state
      setForm((prev) => mapExtractedToFormState(extractedProfile, prev));
      setSuccess(true);
      await mutate();
    },
    [form, data?.sourceText, mutate],
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
    const { data: profileData } = await supabase
      .from("profiles")
      .select("previous_source_text, previous_profile_snapshot")
      .eq("user_id", user.id)
      .single();

    if (!profileData?.previous_source_text) {
      setIsApplyingUpdate(false);
      setError("Nothing to undo.");
      return;
    }

    const snapshot = (profileData.previous_profile_snapshot ?? {}) as Record<
      string,
      unknown
    >;

    // Restore previous state
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        source_text: profileData.previous_source_text,
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
        ...(snapshot.skill_levels != null && {
          skill_levels: snapshot.skill_levels,
        }),
        ...(snapshot.location_mode != null && {
          location_mode: snapshot.location_mode,
        }),
        ...(snapshot.availability_slots != null && {
          availability_slots: snapshot.availability_slots,
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

    // Optimistically update local form state from snapshot
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
        skillLevels:
          snapshot.skill_levels != null
            ? parseSkillLevels(snapshot.skill_levels)
            : prev.skillLevels,
        locationMode:
          snapshot.location_mode != null
            ? parseLocationMode(snapshot.location_mode)
            : prev.locationMode,
        availabilitySlots:
          snapshot.availability_slots != null
            ? parseAvailabilitySlots(snapshot.availability_slots)
            : prev.availabilitySlots,
      }));
    }
    setSuccess(true);
    await mutate();
  }, [mutate]);

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
    error: error ?? (fetchError ? "Failed to load profile." : null),
    setError,
    success,
    isEditing,
    setIsEditing,
    userEmail: data?.userEmail ?? null,
    connectedProviders: data?.connectedProviders ?? {
      github: false,
      google: false,
      linkedin: false,
    },
    isGithubProvider: data?.isGithubProvider ?? false,
    handleChange,
    handleSubmit,
    handleLinkProvider,
    sourceText: data?.sourceText ?? null,
    canUndo: data?.canUndo ?? false,
    isApplyingUpdate,
    applyFreeFormUpdate,
    undoLastUpdate,
    mutate,
  };
}
