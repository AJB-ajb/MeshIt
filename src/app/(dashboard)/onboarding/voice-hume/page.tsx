'use client';

/**
 * Real-Time Voice Onboarding with Hume AI EVI
 * Minimal, tight conversation to collect profile data
 * 
 * Features:
 * - WebSocket streaming (true real-time)
 * - Tight conversational prompts (cost-efficient)
 * - Auto-redirect to profile after completion
 * - AI Elements Persona animation
 * - Caption display underneath
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Persona, type PersonaState } from '@/components/ai-elements/persona';
import { cn } from '@/lib/utils';

type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';

// Map voice state to Persona state
const mapToPersonaState = (state: VoiceState): PersonaState => {
  switch (state) {
    case 'idle': return 'idle';
    case 'connecting': return 'thinking';
    case 'listening': return 'listening';
    case 'thinking': return 'thinking';
    case 'speaking': return 'speaking';
    default: return 'idle';
  }
};

// Conversational system prompt - warm, natural, efficient
const SYSTEM_PROMPT = `You are Mesh, a friendly voice assistant helping developers set up their profile on MeshIt - a platform to find collaborators.

## Your Vibe
- Warm, casual, like talking to a colleague at a coffee shop
- Keep responses SHORT (1-2 sentences). No lectures.
- React naturally to what they say - "Oh nice!", "That's cool!", "Awesome!"
- If they're chatty, vibe with them. If they're brief, be brief.

## What You Need to Learn
Through natural conversation, find out:
- Their name and what they build (tech stack, languages)
- How experienced they are (junior/mid/senior vibes)
- What projects excite them (AI? Games? SaaS? Open source?)
- How much time they have (roughly hours/week)
- How they like to work (calls? async messages? flexible?)

## How to Flow
Don't interrogate. Just chat. Weave questions naturally.

Start: "Hey! I'm Mesh. Tell me a bit about yourself - what do you build?"

Then just flow with it:
- If they mention React: "Oh nice, React! How long have you been doing frontend stuff?"
- If they seem senior: "Sounds like you've got solid experience. What kind of projects are you looking to jump into?"
- If they mention time: "Gotcha. And when you're collabing - you more of a hop-on-a-call person or async messages?"

## Wrapping Up
When you have a good picture, summarize casually:
"Alright, so you're [name], you work with [skills], interested in [interests], got about [hours] hours a week, and you're flexible with [collab style]. Did I get that right?"

When they confirm (yes/yeah/sounds good/that's right):
Say: "Awesome! Let me set up your profile - one sec!"
Then on a new line write: PROFILE_COMPLETE

## Important
- Don't be robotic. No "Step 1" or "Question 2" stuff.
- If they ramble, that's fine - extract what you can
- If something's unclear, ask casually: "Wait, so you're more into backend or full-stack?"
- NEVER say PROFILE_COMPLETE until they confirm the summary`;

export default function HumeRealTimeVoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/profile';
  
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [caption, setCaption] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const conversationRef = useRef<string[]>([]);

  // Define stopPlayback first (no deps)
  const stopPlayback = useCallback(() => {
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    audioElementRef.current?.pause();
  }, []);

  // Define disconnect (depends on stopPlayback)
  const disconnect = useCallback(() => {
    // Stop recorder safely
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    
    // Stop all tracks
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    
    // Close AudioContext only if not already closed
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close().catch(() => {});
    }
    audioContextRef.current = null;
    
    // Close WebSocket
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
    socketRef.current = null;
    
    stopPlayback();
  }, [stopPlayback]);

  // Play next audio in queue
  const playNextAudio = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setVoiceState(prev => prev === 'speaking' ? 'listening' : prev);
      return;
    }

    isPlayingRef.current = true;
    const data = audioQueueRef.current.shift()!;
    
    if (audioElementRef.current) {
      audioElementRef.current.src = `data:audio/mp3;base64,${data}`;
      audioElementRef.current.play().catch(() => playNextAudio());
    }
  }, []);

  // Setup audio element
  useEffect(() => {
    audioElementRef.current = new Audio();
    audioElementRef.current.onended = () => playNextAudio();
    return () => disconnect();
  }, [disconnect, playNextAudio]);

  // Save profile and redirect to developer form with filled data
  const handleProfileComplete = useCallback(async () => {
    setIsComplete(true);
    disconnect();
    
    // Combine all conversation into text for the extraction API
    const conversationText = conversationRef.current.join('\n');
    
    try {
      // Step 1: Use the SAME extraction API as the AI form extractor
      // This uses OpenAI function calling with structured schema (same as the form's AI Extract)
      const extractResponse = await fetch('/api/extract/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: conversationText }),
      });
      
      if (!extractResponse.ok) {
        throw new Error('Extraction failed');
      }
      
      const { profile: extractedData } = await extractResponse.json();
      console.log('Extracted profile from voice:', extractedData);
      
      // Step 2: Save extracted profile directly to Supabase using existing endpoint
      const saveResponse = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileData: {
            skills: extractedData.skills || [],
            interests: extractedData.interests || [],
            experience_years: mapExperienceLevelToYears(extractedData.experience_level),
            availability_hours: extractedData.availability_hours,
            collaboration_style: extractedData.collaboration_style,
            bio: extractedData.bio || extractedData.headline,
            // These will be picked up by the form when it loads
            full_name: extractedData.full_name,
            headline: extractedData.headline,
            location: extractedData.location,
            portfolio_url: extractedData.portfolio_url,
            github_url: extractedData.github_url,
          },
        }),
      });
      
      if (!saveResponse.ok) {
        console.warn('Profile save returned error, but continuing...');
      }
      
      // Redirect to developer form - it will load the saved data from DB
      const redirectUrl = `/onboarding/developer?voice_complete=true${nextUrl !== '/profile' ? `&next=${encodeURIComponent(nextUrl)}` : ''}`;
      setTimeout(() => router.push(redirectUrl), 1500);
      
    } catch (err) {
      console.error('Voice extraction error:', err);
      // Still redirect - user can fill form manually
      const redirectUrl = `/onboarding/developer?voice_complete=true`;
      setTimeout(() => router.push(redirectUrl), 1500);
    }
  }, [disconnect, nextUrl, router]);

  // Helper to convert experience level string to years (for the save API)
  const mapExperienceLevelToYears = (level?: string): number => {
    switch (level) {
      case 'junior': return 1;
      case 'intermediate': return 3;
      case 'senior': return 6;
      case 'lead': return 10;
      default: return 2;
    }
  };

  // Handle Hume messages
  const handleMessage = useCallback((msg: Record<string, unknown>) => {
    const type = msg.type as string;
    
    switch (type) {
      case 'audio_output':
        if (msg.data) {
          audioQueueRef.current.push(msg.data as string);
          if (!isPlayingRef.current) {
            setVoiceState('speaking');
            playNextAudio();
          }
        }
        break;

      case 'assistant_message':
        const content = (msg.message as Record<string, unknown>)?.content as string;
        if (content) {
          // Check for completion signal
          if (content.includes('PROFILE_COMPLETE')) {
            const cleanCaption = content.replace('PROFILE_COMPLETE', '').trim();
            setCaption(cleanCaption);
            conversationRef.current.push(`Assistant: ${cleanCaption}`);
            handleProfileComplete();
          } else {
            setCaption(content);
            conversationRef.current.push(`Assistant: ${content}`);
          }
        }
        break;

      case 'user_message':
        const userContent = (msg.message as Record<string, unknown>)?.content as string;
        if (userContent) {
          setUserTranscript(userContent);
          conversationRef.current.push(`User: ${userContent}`);
        }
        setVoiceState('thinking');
        break;

      case 'assistant_end':
        if (!isPlayingRef.current) setVoiceState('listening');
        setUserTranscript('');
        break;

      case 'user_interruption':
        stopPlayback();
        setVoiceState('listening');
        break;

      case 'error':
        setError((msg.message as string) || 'Error occurred');
        break;
    }
  }, [handleProfileComplete, playNextAudio, stopPlayback]);

  // Start microphone streaming
  const startMicrophone = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    streamRef.current = stream;
    audioContextRef.current = new AudioContext();

    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    recorder.ondataavailable = async (e) => {
      if (e.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
        const base64 = await blobToBase64(e.data);
        socketRef.current.send(JSON.stringify({ type: 'audio_input', data: base64 }));
      }
    };
    recorder.start(100);
    recorderRef.current = recorder;
  }, []);

  // Connect to Hume EVI WebSocket
  const connect = useCallback(async () => {
    try {
      setVoiceState('connecting');
      setError(null);
      setCaption('');

      const tokenRes = await fetch('/api/voice/hume/token');
      if (!tokenRes.ok) throw new Error('Failed to get credentials');
      const { apiKey } = await tokenRes.json();

      const ws = new WebSocket(`wss://api.hume.ai/v0/evi/chat?api_key=${apiKey}`);
      socketRef.current = ws;

      ws.onopen = async () => {
        console.log('✅ Hume EVI connected');
        
        // Configure with tight system prompt
        ws.send(JSON.stringify({
          type: 'session_settings',
          system_prompt: SYSTEM_PROMPT,
        }));

        await startMicrophone();
        setVoiceState('listening');
      };

      ws.onmessage = (e) => handleMessage(JSON.parse(e.data));
      
      ws.onerror = () => {
        setError('Connection failed');
        setVoiceState('idle');
      };
      
      ws.onclose = () => {
        if (!isComplete) setVoiceState('idle');
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setVoiceState('idle');
    }
  }, [handleMessage, isComplete, startMicrophone]);

  const handleDone = () => {
    handleProfileComplete();
  };

  const handleBack = () => {
    disconnect();
    router.push('/onboarding/developer');
  };

  const blobToBase64 = (blob: Blob): Promise<string> => 
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(blob);
    });

  // State labels
  const stateConfig: Record<VoiceState, { label: string; sublabel?: string }> = {
    idle: { label: 'Tap to start', sublabel: 'Quick voice setup' },
    connecting: { label: 'Connecting...', sublabel: 'Setting up your session' },
    listening: { label: 'Listening', sublabel: userTranscript || 'Speak naturally' },
    thinking: { label: 'Thinking...', sublabel: userTranscript },
    speaking: { label: 'Mesh', sublabel: undefined },
  };

  const { label, sublabel } = stateConfig[voiceState];

  return (
    <div className="fixed inset-0 flex flex-col bg-background dark:bg-black">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack} 
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <span className="text-sm font-medium text-foreground">
          Voice Setup
        </span>
        
        {/* Empty div for spacing */}
        <div className="w-20" />
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        {error ? (
          <div className="text-center animate-in fade-in">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => { setError(null); connect(); }} variant="outline">
              Try Again
            </Button>
          </div>
        ) : isComplete ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">All set!</h2>
            <p className="text-muted-foreground">Taking you to your profile...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center max-w-lg">
            {/* Persona Animation */}
            <button
              onClick={() => voiceState === 'idle' && connect()}
              disabled={voiceState !== 'idle'}
              className={cn(
                'relative transition-all duration-300',
                voiceState === 'idle' && 'cursor-pointer hover:scale-105 active:scale-95',
                voiceState !== 'idle' && 'cursor-default'
              )}
            >
              <Persona
                variant="obsidian"
                state={mapToPersonaState(voiceState)}
                className="size-48"
              />
            </button>

            {/* State Label */}
            <div className="mt-8 text-center">
              <p className="text-xl font-medium text-foreground">
                {label}
              </p>
              {sublabel && (
                <p className="text-sm text-muted-foreground mt-1 max-w-xs truncate">
                  {sublabel}
                </p>
              )}
            </div>

            {/* Caption - AI Response */}
            {caption && voiceState !== 'idle' && (
              <div className="mt-6 p-4 rounded-2xl bg-muted/50 border border-border/50 max-w-md animate-in fade-in slide-in-from-bottom-2">
                <p className="text-foreground text-base leading-relaxed text-center">
                  "{caption}"
                </p>
              </div>
            )}

            {/* User transcript while speaking */}
            {userTranscript && voiceState === 'thinking' && (
              <div className="mt-4 text-sm text-muted-foreground italic animate-in fade-in">
                You said: "{userTranscript}"
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      {voiceState !== 'idle' && !isComplete && (
        <footer className="flex justify-center gap-4 pb-8 animate-in fade-in slide-in-from-bottom-4">
          <button
            onClick={handleDone}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all"
          >
            <Check className="h-4 w-4" />
            Done
          </button>
        </footer>
      )}

      {/* Powered by */}
      <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-muted-foreground/50">
        Powered by Hume AI
      </div>
    </div>
  );
}
