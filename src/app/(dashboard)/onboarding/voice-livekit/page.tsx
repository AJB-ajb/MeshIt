/**
 * LiveKit Voice Onboarding Page
 * Test concurrent voice sessions with WebRTC
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LiveKitVoiceInterface } from '@/components/voice/livekit-voice-interface';
import type { ProfileData } from '@/lib/voice/types';

export default function LiveKitVoicePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async (profile: ProfileData) => {
    setIsSaving(true);

    try {
      console.log('✅ LiveKit voice onboarding complete:', profile);

      // TODO: Save profile to Supabase
      // const { error } = await supabase
      //   .from('profiles')
      //   .insert({ ...profile, user_id: userId });

      // For now, just log and redirect
      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push('/dashboard');
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
        <LiveKitVoiceInterface onComplete={handleComplete} />
      )}
    </div>
  );
}
