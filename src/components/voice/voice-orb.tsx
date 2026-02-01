/**
 * Voice Orb Component
 * ChatGPT Voice-style minimal UI with animated orb indicator
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceOrbProps {
  state: VoiceState;
  audioLevel?: number; // 0-100
  caption?: string; // Optional single-line caption
  onEnd?: () => void;
  onMicToggle?: () => void;
  isMicEnabled?: boolean;
  className?: string;
}

/**
 * Animated voice orb that visualizes the current voice state
 */
export function VoiceOrb({
  state,
  audioLevel = 0,
  caption,
  onEnd,
  onMicToggle,
  isMicEnabled = true,
  className,
}: VoiceOrbProps) {
  // Normalize audio level for visualization (0-1)
  const normalizedLevel = Math.min(audioLevel / 100, 1);
  
  // Compute orb size based on audio level
  const baseSize = 160;
  const maxExpansion = 40;
  const orbSize = baseSize + (normalizedLevel * maxExpansion);

  const stateLabels: Record<VoiceState, string> = {
    idle: 'Tap to speak',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
  };

  const stateColors: Record<VoiceState, string> = {
    idle: 'bg-muted',
    listening: 'bg-primary',
    thinking: 'bg-amber-500',
    speaking: 'bg-emerald-500',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-8', className)}>
      {/* Main Orb */}
      <div className="relative">
        {/* Outer glow rings */}
        {(state === 'listening' || state === 'speaking') && (
          <>
            <div 
              className={cn(
                'absolute inset-0 rounded-full blur-xl opacity-30 transition-all duration-150',
                state === 'listening' ? 'bg-primary' : 'bg-emerald-500'
              )}
              style={{
                transform: `scale(${1 + normalizedLevel * 0.5})`,
              }}
            />
            <div 
              className={cn(
                'absolute inset-0 rounded-full blur-md opacity-40 transition-all duration-150',
                state === 'listening' ? 'bg-primary' : 'bg-emerald-500'
              )}
              style={{
                transform: `scale(${1 + normalizedLevel * 0.3})`,
              }}
            />
          </>
        )}
        
        {/* Pulsing ring for thinking state */}
        {state === 'thinking' && (
          <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
        )}

        {/* Main orb button */}
        <button
          onClick={onMicToggle}
          disabled={state === 'thinking' || state === 'speaking'}
          className={cn(
            'relative flex items-center justify-center rounded-full transition-all duration-150 ease-out',
            stateColors[state],
            state === 'idle' && 'hover:scale-105 active:scale-95',
            (state === 'thinking' || state === 'speaking') && 'cursor-default',
          )}
          style={{
            width: orbSize,
            height: orbSize,
          }}
        >
          {/* Icon */}
          {state === 'listening' ? (
            <Mic className="h-12 w-12 text-primary-foreground animate-pulse" />
          ) : state === 'speaking' ? (
            <Volume2 className="h-12 w-12 text-white" />
          ) : state === 'thinking' ? (
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <Mic className="h-12 w-12 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* State Label */}
      <p className="text-lg font-medium text-foreground">
        {stateLabels[state]}
      </p>

      {/* Optional Caption (last utterance) */}
      {caption && (
        <p className="max-w-md text-center text-sm text-muted-foreground line-clamp-2">
          {caption}
        </p>
      )}

      {/* End Button */}
      {onEnd && (
        <button
          onClick={onEnd}
          className="flex items-center gap-2 px-6 py-2 rounded-full border border-border hover:bg-muted transition-colors text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          End conversation
        </button>
      )}

      {/* Mic mute indicator */}
      {!isMicEnabled && state !== 'speaking' && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <MicOff className="h-4 w-4" />
          Microphone muted
        </div>
      )}
    </div>
  );
}

/**
 * Full-screen voice interface wrapper
 */
interface VoiceInterfaceProps {
  children: React.ReactNode;
  className?: string;
}

export function VoiceInterface({ children, className }: VoiceInterfaceProps) {
  return (
    <div className={cn(
      'fixed inset-0 flex items-center justify-center bg-background',
      className
    )}>
      {children}
    </div>
  );
}
