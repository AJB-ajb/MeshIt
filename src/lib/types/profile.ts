export type GitHubSyncStatus = {
  synced: boolean;
  lastSyncedAt?: string;
  syncStatus?: "pending" | "syncing" | "completed" | "failed";
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

export type ProfileFormState = {
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
  filterMaxDistance: string;
  filterMinHours: string;
  filterMaxHours: string;
  filterLanguages: string;
};

export const defaultFormState: ProfileFormState = {
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
  filterMaxDistance: "",
  filterMinHours: "",
  filterMaxHours: "",
  filterLanguages: "",
};

export const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/** Extracted profile matching the post-redesign DB schema */
export type ExtractedProfileV2 = {
  full_name?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  interests?: string[];
  languages?: string[];
  portfolio_url?: string;
  github_url?: string;
  skill_levels?: Record<string, number>;
  location_preference?: number;
  availability_slots?: Record<string, unknown>;
};

export type ProfileUpdateResponse = {
  success: boolean;
  updatedSourceText: string;
  extractedProfile: ExtractedProfileV2;
};

/**
 * Map new-schema extraction results to old ProfileFormState.
 * Only overwrites fields that were actually extracted (non-undefined).
 */
export function mapExtractedToFormState(
  extracted: ExtractedProfileV2,
  current: ProfileFormState,
): ProfileFormState {
  return {
    ...current,
    ...(extracted.full_name != null && { fullName: extracted.full_name }),
    ...(extracted.headline != null && { headline: extracted.headline }),
    ...(extracted.bio != null && { bio: extracted.bio }),
    ...(extracted.location != null && { location: extracted.location }),
    ...(extracted.skills != null && { skills: extracted.skills.join(", ") }),
    ...(extracted.interests != null && {
      interests: extracted.interests.join(", "),
    }),
    ...(extracted.languages != null && {
      languages: extracted.languages.join(", "),
    }),
    ...(extracted.portfolio_url != null && {
      portfolioUrl: extracted.portfolio_url,
    }),
    ...(extracted.github_url != null && { githubUrl: extracted.github_url }),
    ...(extracted.location_preference != null && {
      remotePreference: (extracted.location_preference * 100).toString(),
    }),
  };
}
