import { createClient } from "@/lib/supabase/server";

// Profile data interface (previously from voice types)
interface ProfileData {
  bio?: string;
  skills?: string[];
  interests?: string[];
  role?: string;
}

// Extended profile data for AI extraction (includes all fields from AI extractor)
interface ExtendedProfileData extends Partial<ProfileData> {
  full_name?: string;
  headline?: string;
  location?: string;
  portfolio_url?: string;
  github_url?: string;
}

/**
 * Save AI-extracted profile data to Supabase
 * Handles all fields extracted by the AI (same schema as form's AI Extract)
 */
export async function saveVoiceProfile(
  userId: string,
  data: ExtendedProfileData,
) {
  const supabase = await createClient();

  console.log(
    "saveVoiceProfile called with data:",
    JSON.stringify(data, null, 2),
  );

  // Prepare update data - include ALL fields the AI extractor can return
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Core identity fields
  if (data.full_name) {
    updateData.full_name = data.full_name;
  }

  if (data.headline) {
    updateData.headline = data.headline;
  }

  if (data.bio) {
    updateData.bio = data.bio;
  }

  if (data.location) {
    updateData.location = data.location;
  }

  // Skills and interests
  if (data.skills && data.skills.length > 0) {
    updateData.skills = data.skills;
  }

  if (data.interests && data.interests.length > 0) {
    updateData.interests = data.interests;
  }

  // URLs
  if (data.portfolio_url) {
    updateData.portfolio_url = data.portfolio_url;
  }

  if (data.github_url) {
    updateData.github_url = data.github_url;
  }

  // Add user_id for upsert
  updateData.user_id = userId;

  // Upsert profile (insert if not exists, update if exists)
  const { error } = await supabase.from("profiles").upsert(updateData, {
    onConflict: "user_id",
    ignoreDuplicates: false,
  });

  if (error) {
    console.error("Error saving profile:", error);
    throw error;
  }

  console.log("Profile saved successfully for user:", userId);
  return { success: true };
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }

  return profile;
}
