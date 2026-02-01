import { createClient } from '@/lib/supabase/server';
import { ProfileData } from '@/lib/voice/types';

// Extended profile data for voice extraction (includes all fields from AI extractor)
interface ExtendedProfileData extends Partial<ProfileData> {
  full_name?: string;
  headline?: string;
  location?: string;
  portfolio_url?: string;
  github_url?: string;
}

/**
 * Save voice onboarding profile data to Supabase
 * Handles all fields extracted by the AI (same schema as form's AI Extract)
 */
export async function saveVoiceProfile(userId: string, data: ExtendedProfileData) {
  const supabase = await createClient();

  // Map experience years to experience level
  const experienceLevel = mapExperienceYearsToLevel(data.experience_years || 0);

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

  // Experience and availability
  if (data.experience_years !== undefined) {
    updateData.experience_level = experienceLevel;
  }

  if (data.availability_hours !== undefined) {
    const hours = typeof data.availability_hours === 'string' 
      ? parseInt(data.availability_hours, 10)
      : data.availability_hours;
    updateData.availability_hours = hours;
  }

  // Collaboration style
  if (data.collaboration_style) {
    const validStyles = ['sync', 'async', 'hybrid', 'flexible'];
    // Map 'flexible' to 'hybrid' for DB compatibility
    const style = data.collaboration_style === 'flexible' ? 'hybrid' : data.collaboration_style;
    if (validStyles.includes(style)) {
      updateData.collaboration_style = style;
    }
  }

  // URLs
  if (data.portfolio_url) {
    updateData.portfolio_url = data.portfolio_url;
  }

  if (data.github_url) {
    updateData.github_url = data.github_url;
  }

  // Update profile using user_id (not id)
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('user_id', userId);

  if (error) {
    console.error('Error saving profile:', error);
    throw error;
  }

  console.log('Profile saved successfully for user:', userId);
  return { success: true };
}

/**
 * Map years of experience to experience level
 */
function mapExperienceYearsToLevel(years: number): 'beginner' | 'intermediate' | 'advanced' {
  if (years < 2) return 'beginner';
  if (years < 5) return 'intermediate';
  return 'advanced';
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }

  return profile;
}
