'use client';

/**
 * Audio Player Component
 * Plays audio from base64 data URL or regular URL
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  audioSrc?: string; // Regular URL or data URL (including data:audio/mpeg;base64,...)
  audioBase64?: string; // Raw base64 string without data URL prefix
  autoPlay?: boolean;
  onEnded?: () => void;
}

export function AudioPlayer({
  audioSrc,
  audioBase64,
  autoPlay = false,
  onEnded,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Determine the audio source
  // If audioBase64 is provided without data URL prefix, add it
  // If audioSrc is provided (could be full data URL or regular URL), use as-is
  const src = audioBase64
    ? audioBase64.startsWith('data:')
      ? audioBase64
      : `data:audio/mpeg;base64,${audioBase64}`
    : audioSrc;

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onEnded?.();
  }, [onEnded]);

  const handleCanPlay = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback((e: Event) => {
    console.error('Audio error:', e);
    setIsLoaded(false);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    // Reset state when source changes
    setIsLoaded(false);
    setIsPlaying(false);

    // Set up event listeners
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    // Load the new source
    audio.src = src;
    audio.load();

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      // Pause audio when unmounting or source changes
      audio.pause();
    };
  }, [src, handleEnded, handleCanPlay, handleError]);

  // Handle autoPlay after audio is loaded
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isLoaded || !autoPlay) return;

    // Small delay to ensure audio is ready
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          // Auto-play was prevented (common in browsers)
          console.log('Auto-play prevented:', error.message);
          setIsPlaying(false);
        });
    }
  }, [isLoaded, autoPlay]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.error('Play failed:', error);
          setIsPlaying(false);
        });
    }
  }, [isPlaying, isLoaded]);

  if (!src) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
      <audio ref={audioRef} preload="auto" />
      <Button
        onClick={togglePlay}
        size="sm"
        variant={isPlaying ? "default" : "outline"}
        className="h-10 w-10 p-0 rounded-full"
        disabled={!isLoaded}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </Button>
      
      <div className="flex items-center gap-2 flex-1">
        {isPlaying ? (
          <>
            <Volume2 className="h-4 w-4 text-primary" />
            <div className="flex gap-1 items-end">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${6 + (i % 3) * 4}px`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '0.5s',
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-2">Playing...</span>
          </>
        ) : isLoaded ? (
          <span className="text-xs text-muted-foreground">Click to play</span>
        ) : (
          <span className="text-xs text-muted-foreground">Loading audio...</span>
        )}
      </div>
    </div>
  );
}
