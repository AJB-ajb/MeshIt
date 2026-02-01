/**
 * Simple Voice Onboarding
 * Clean voice-only onboarding with animated avatar
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, Loader2 } from 'lucide-react';
import type { ProfileData } from '@/lib/voice/types';

interface SimpleVoiceOnboardingProps {
  onComplete: (profile: ProfileData) => void;
  userId?: string;
}

export function SimpleVoiceOnboarding({
  onComplete,
  userId,
}: SimpleVoiceOnboardingProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sessionIdRef = useRef<string>(`voice_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number>(0);
  const audioElementRef = useRef<HTMLAudioElement>(null);

  // Voice activity detection parameters
  const VOICE_THRESHOLD = 35; // Audio level to detect speech
  const SILENCE_DURATION = 2500; // 2.5 seconds of silence to stop

  /**
   * Initialize voice session
   */
  useEffect(() => {
    startVoiceSession();
    
    return () => {
      cleanup();
    };
  }, []);

  const startVoiceSession = async () => {
    try {
      setIsInitializing(true);

      // Initialize session on server
      const response = await fetch('/api/livekit/agent/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: sessionIdRef.current,
          userId,
        }),
      });

      if (!response.ok) throw new Error('Failed to initialize session');

      const data = await response.json();

      // Play greeting
      if (data.audio) {
        await playAudio(data.audio);
      }

      // Start listening
      await startListening();

      setIsInitializing(false);
    } catch (err) {
      console.error('❌ Error starting session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start');
      setIsInitializing(false);
    }
  };

  /**
   * Start listening to user
   */
  const startListening = async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      // Setup audio analysis for visualization
      const audioContext = new AudioContext();
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      analyzer.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);

      audioContextRef.current = audioContext;
      analyzerRef.current = analyzer;

      // Start recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm;codecs=opus',
          });

          if (audioBlob.size > 5000) {
            await processUserSpeech(audioBlob);
          }
        }

        audioChunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      // Start voice activity detection
      detectVoiceActivity(analyzer);
    } catch (err) {
      console.error('❌ Error starting microphone:', err);
      setError('Please allow microphone access');
    }
  };

  /**
   * Detect when user speaks and stops
   */
  const detectVoiceActivity = (analyzer: AnalyserNode) => {
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let wasSpeaking = false;

    const checkAudio = () => {
      if (!mediaRecorderRef.current) return;

      analyzer.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;

      // Update visualization
      setAudioLevel(average);

      const isSpeaking = average > VOICE_THRESHOLD;

      if (isSpeaking) {
        if (!wasSpeaking) {
          setIsUserSpeaking(true);
          wasSpeaking = true;
        }
        silenceStartRef.current = Date.now();
      } else if (wasSpeaking) {
        const silenceDuration = Date.now() - silenceStartRef.current;

        if (silenceDuration > SILENCE_DURATION) {
          // User stopped speaking
          console.log('🔇 User finished speaking');
          setIsUserSpeaking(false);
          wasSpeaking = false;

          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    };

    silenceStartRef.current = Date.now();
    checkAudio();
  };

  /**
   * Process user's speech
   */
  const processUserSpeech = async (audioBlob: Blob) => {
    try {
      setIsUserSpeaking(false);

      console.log('📤 Sending audio to server...', { size: audioBlob.size });

      // Send to server
      const formData = new FormData();
      formData.append('roomName', sessionIdRef.current);
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/livekit/agent/turn', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Server error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to process speech');
      }

      const data = await response.json();
      console.log('📥 Received response:', {
        transcription: data.transcription,
        hasAudio: !!data.audio,
        completed: data.completed,
        extractedData: data.extractedData,
      });

      // Play agent response
      if (data.audio) {
        await playAudio(data.audio);
      }

      // Check if complete
      if (data.completed) {
        console.log('✅ Onboarding complete!');
        await completeOnboarding(data.extractedData);
      } else {
        // Continue listening
        console.log('🔄 Continuing conversation...');
        restartListening();
      }
    } catch (err) {
      console.error('❌ Error processing speech:', err);
      setError(err instanceof Error ? err.message : 'Processing failed');
      
      // Don't restart if it's a critical error
      const errorMessage = err instanceof Error ? err.message : '';
      if (!errorMessage.includes('Session not found')) {
        setTimeout(() => {
          setError(null);
          restartListening();
        }, 2000);
      }
    }
  };

  /**
   * Play audio response
   */
  const playAudio = async (audioBase64: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!audioElementRef.current) {
        resolve();
        return;
      }

      const audioBlob = new Blob(
        [Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);

      audioElementRef.current.src = audioUrl;
      setIsAgentSpeaking(true);

      audioElementRef.current.onended = () => {
        setIsAgentSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        resolve();
      };

      audioElementRef.current.onerror = (err) => {
        setIsAgentSpeaking(false);
        reject(err);
      };

      audioElementRef.current.play().catch(reject);
    });
  };

  /**
   * Restart listening after agent speaks
   */
  const restartListening = () => {
    if (mediaStreamRef.current && !isAgentSpeaking) {
      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm;codecs=opus',
          });

          if (audioBlob.size > 5000) {
            await processUserSpeech(audioBlob);
          }
        }

        audioChunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      // Restart VAD
      if (analyzerRef.current) {
        silenceStartRef.current = Date.now();
        detectVoiceActivity(analyzerRef.current);
      }
    }
  };

  /**
   * Complete onboarding
   */
  const completeOnboarding = async (extractedData: Partial<ProfileData>) => {
    try {
      const response = await fetch('/api/livekit/agent/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: sessionIdRef.current }),
      });

      if (!response.ok) throw new Error('Failed to complete');

      const data = await response.json();
      onComplete(data.profile);
    } catch (err) {
      console.error('❌ Error completing onboarding:', err);
      setError('Failed to save profile');
    }
  };

  /**
   * Cleanup resources
   */
  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // Calculate bar heights for audio visualization
  const getBars = () => {
    const barCount = 24;
    const bars = [];
    const intensity = isUserSpeaking ? audioLevel / 255 : isAgentSpeaking ? 0.6 : 0.1;

    for (let i = 0; i < barCount; i++) {
      const height = Math.random() * intensity * 100 + 20;
      bars.push(height);
    }

    return bars;
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Initializing voice agent...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="text-center max-w-md">
          <p className="text-lg text-destructive mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/20">
      <audio ref={audioElementRef} className="hidden" />

      {/* Agent Avatar */}
      <div className="relative mb-12">
        {/* Outer glow */}
        <div
          className={`absolute inset-0 rounded-full blur-3xl transition-all duration-500 ${
            isAgentSpeaking
              ? 'bg-primary/40 scale-150'
              : isUserSpeaking
              ? 'bg-blue-500/30 scale-125'
              : 'bg-primary/20 scale-100'
          }`}
        />

        {/* Avatar circle */}
        <div
          className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${
            isAgentSpeaking
              ? 'bg-primary/20 scale-110'
              : isUserSpeaking
              ? 'bg-blue-500/20 scale-105'
              : 'bg-muted/50'
          }`}
        >
          {isAgentSpeaking ? (
            <Volume2 className="w-24 h-24 text-primary animate-pulse" />
          ) : (
            <Mic className={`w-24 h-24 ${isUserSpeaking ? 'text-blue-500' : 'text-muted-foreground'}`} />
          )}
        </div>
      </div>

      {/* Audio Visualization */}
      <div className="flex items-center justify-center gap-1 h-32 mb-8">
        {getBars().map((height, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-150 ${
              isAgentSpeaking
                ? 'bg-primary'
                : isUserSpeaking
                ? 'bg-blue-500'
                : 'bg-muted-foreground/30'
            }`}
            style={{
              height: `${height}%`,
              animation: isAgentSpeaking || isUserSpeaking ? `pulse ${Math.random() * 0.5 + 0.5}s ease-in-out infinite` : 'none',
            }}
          />
        ))}
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className="text-xl font-medium mb-2">
          {isAgentSpeaking ? 'AI is speaking...' : isUserSpeaking ? 'Listening to you...' : 'Waiting for you to speak...'}
        </p>
        <p className="text-sm text-muted-foreground">
          {isAgentSpeaking
            ? 'Please wait'
            : isUserSpeaking
            ? 'Keep talking, I\'m listening'
            : 'Start speaking when ready'}
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.5);
          }
        }
      `}</style>
    </div>
  );
}
