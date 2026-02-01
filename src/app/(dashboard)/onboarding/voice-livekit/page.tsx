/**
 * LiveKit Voice Onboarding Page
 * Clean voice bot visualization with auto-redirect
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CleanLiveKitVoice } from '@/components/voice/clean-livekit-voice';
import { createClient } from '@/lib/supabase/client';
import type { ProfileData } from '@/lib/voice/types';

export default function LiveKitVoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);

  const next = useMemo(() => {
    const value = searchParams.get('next') ?? '';
    return value && !value.startsWith('/onboarding') ? value : '/dashboard';
  }, [searchParams]);

  const handleComplete = async (profile: ProfileData) => {
    setIsSaving(true);

    try {
      console.log('✅ LiveKit voice onboarding complete:', profile);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('❌ No user found');
        router.push('/login');
        return;
      }

      // Map experience years to level
      const getExperienceLevel = (years: number): string => {
        if (years < 2) return 'junior';
        if (years < 5) return 'intermediate';
        if (years < 10) return 'senior';
        return 'lead';
      };

      // Save profile to Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || '',
          headline: profile.role || '',
          bio: profile.bio || '',
          skills: profile.skills || [],
          experience_level: getExperienceLevel(profile.experience_years || 0),
          interests: profile.interests || [],
          availability_hours: typeof profile.availability_hours === 'string'
            ? parseInt(profile.availability_hours, 10)
            : (profile.availability_hours || 0),
          collaboration_style: profile.collaboration_style || 'async',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('❌ Error saving profile:', error);
        throw error;
      }

      // Mark profile as completed
      await supabase.auth.updateUser({
        data: { profile_completed: true },
      });

      console.log('✅ Profile saved to Supabase, redirecting...');

      // Redirect to destination
      router.push(next);
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      {isSaving ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Saving your profile...</p>
        </div>
      ) : (
        <CleanLiveKitVoice onComplete={handleComplete} />
      )}
    </div>
  );
}
