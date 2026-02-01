'use client';

/**
 * Match Audio Player Component
 * Plays match explanation as audio
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2 } from 'lucide-react';
import { AudioPlayer } from '@/components/voice';

interface MatchAudioPlayerProps {
  matchId: string;
  explanation: string;
}

export function MatchAudioPlayer({ explanation }: MatchAudioPlayerProps) {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAudio = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: explanation }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const data = await response.json();
      setAudioSrc(data.audio);
    } catch (err) {
      console.error('Audio generation failed:', err);
      setError('Failed to generate audio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioEnded = () => {
    // Could cache the audio here for future plays
  };

  if (error) {
    return (
      <Button
        onClick={generateAudio}
        variant="ghost"
        size="sm"
        className="text-destructive"
      >
        <Volume2 className="h-4 w-4 mr-2" />
        Retry
      </Button>
    );
  }

  if (!audioSrc) {
    return (
      <Button
        onClick={generateAudio}
        variant="ghost"
        size="sm"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4 mr-2" />
            Listen
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <AudioPlayer audioSrc={audioSrc} onEnded={handleAudioEnded} />
      <span className="text-xs text-muted-foreground">Listen to explanation</span>
    </div>
  );
}
