import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { saveVoiceProfile } from '@/lib/supabase/profiles';

/**
 * Save voice onboarding profile data
 * POST /api/profile/save
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { profileData } = await request.json();

    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 }
      );
    }

    // Save profile
    await saveVoiceProfile(user.id, profileData);

    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully',
    });

  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save profile',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
