/**
 * POST /api/voice/conversational/complete
 * Complete voice onboarding and save profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { completeConversationalSession } from '@/lib/ai/conversational-voice-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`✅ Completing voice onboarding for session ${sessionId}`);

    // Complete session and get profile data
    const { profile, completionMessage } = await completeConversationalSession(sessionId);

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Map voice profile data to database schema
    const dbProfile = {
      user_id: user.id,
      full_name: profile.full_name || user.user_metadata?.full_name || '',
      headline: profile.headline || profile.role || '',
      bio: profile.bio || '',
      location: profile.location || profile.timezone || '',
      experience_level: mapExperienceLevel(profile.experience_level, profile.experience_years),
      collaboration_style: mapCollaborationStyle(profile.collaboration_style),
      availability_hours: parseAvailabilityHours(profile.availability_hours),
      skills: profile.skills || [],
      interests: profile.interests || [],
      project_preferences: {
        project_types: profile.project_types || profile.interests || [],
        preferred_stack: profile.preferred_stack || profile.skills || [],
        preferred_roles: profile.role ? [profile.role] : [],
        commitment_level: profile.availability_hours?.toString() || '10',
        timeline_preference: '1_month',
        compensation_preference: profile.compensation_preference || 'flexible',
      },
      updated_at: new Date().toISOString(),
    };

    // Upsert profile
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(dbProfile, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('❌ Failed to save profile:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save profile', details: upsertError.message },
        { status: 500 }
      );
    }

    // Update user metadata
    await supabase.auth.updateUser({
      data: { profile_completed: true },
    });

    console.log('✅ Profile saved successfully');

    return NextResponse.json({
      success: true,
      profile: dbProfile,
      completionMessage,
    });

  } catch (error) {
    console.error('❌ Voice completion error:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete onboarding',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Map experience level from voice data to DB enum
 */
function mapExperienceLevel(
  level?: string,
  years?: number
): 'beginner' | 'intermediate' | 'advanced' {
  if (level) {
    const normalized = level.toLowerCase();
    if (normalized.includes('beginner') || normalized.includes('junior')) {
      return 'beginner';
    }
    if (normalized.includes('advanced') || normalized.includes('senior') || normalized.includes('expert')) {
      return 'advanced';
    }
  }
  
  if (years !== undefined) {
    if (years < 2) return 'beginner';
    if (years >= 5) return 'advanced';
  }
  
  return 'intermediate';
}

/**
 * Map collaboration style from voice data
 */
function mapCollaborationStyle(style?: string): 'sync' | 'async' | 'flexible' {
  if (!style) return 'flexible';
  
  const normalized = style.toLowerCase();
  if (normalized.includes('sync') || normalized.includes('synchronous') || normalized.includes('call')) {
    return 'sync';
  }
  if (normalized.includes('async') || normalized.includes('asynchronous') || normalized.includes('message')) {
    return 'async';
  }
  
  return 'flexible';
}

/**
 * Parse availability hours from various formats
 */
function parseAvailabilityHours(hours?: number | string): number | null {
  if (hours === undefined || hours === null) return null;
  
  if (typeof hours === 'number') {
    return hours;
  }
  
  // Handle string formats like "10-15", "15 hours", etc.
  const match = hours.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return null;
}
