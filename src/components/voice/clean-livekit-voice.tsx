/**
 * Clean LiveKit Voice Interface
 * Simple, beautiful voice bot visualization
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, Loader2 } from 'lucide-react';
import type { ProfileData } from '@/lib/voice/types';

interface CleanLiveKitVoiceProps {
  onComplete: (profile: ProfileData) => void;
  userId?: string;
}

export function CleanLiveKitVoice({
  onComplete,
  userId,
}: CleanLiveKitVoiceProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [roomName] = useState(`voice_${Date.now()}_${Math.random().toString(36).substring(7)}`);

  const audioElementRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const VOICE_THRESHOLD = 45;
  const SILENCE_DURATION = 1200;

  useEffect(() => {
    startVoiceSession();
    return () => cleanup();
  }, []);

  const startVoiceSession = async () => {
    try {
      setIsInitializing(true);

      // Initialize session
      const response = await fetch('/api/livekit/agent/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, userId }),
      });

      if (!response.ok) throw new Error('Failed to initialize session');

      const data = await response.json();

      // Play greeting
      if (data.audio && audioElementRef.current) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        audioElementRef.current.src = URL.createObjectURL(audioBlob);
        setIsAgentSpeaking(true);
        await audioElementRef.current.play();
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

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Setup audio analysis
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

      // Start VAD
      detectVoiceActivity(analyzer, stream);
    } catch (err) {
      console.error('❌ Error starting microphone:', err);
      setError('Please allow microphone access');
    }
  };

  const detectVoiceActivity = (analyzer: AnalyserNode, stream: MediaStream) => {
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let silenceStartRef = Date.now();
    let isSpeaking = false;
    let speechStartTime = 0;

    const checkAudio = () => {
      if (!mediaRecorderRef.current) return;

      analyzer.getByteFrequencyData(dataArray);
      const rms = Math.sqrt(
        dataArray.reduce((sum, value) => sum + value * value, 0) / bufferLength
      );

      setAudioLevel(rms);
      const speaking = rms > VOICE_THRESHOLD;

      if (speaking) {
        if (!isSpeaking) {
          speechStartTime = Date.now();
          setIsUserSpeaking(true);
        }
        isSpeaking = true;
        silenceStartRef = Date.now();
      } else if (isSpeaking) {
        const silenceDuration = Date.now() - silenceStartRef;
        const speechDuration = Date.now() - speechStartTime;

        if (silenceDuration > SILENCE_DURATION && speechDuration > 500) {
          console.log('🔇 Silence detected, processing speech...');
          setIsUserSpeaking(false);
          isSpeaking = false;

          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }

          // Restart listening after processing
          setTimeout(() => {
            if (!isAgentSpeaking) {
              const newRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
              });

              newRecorder.ondataavailable = mediaRecorderRef.current!.ondataavailable;
              newRecorder.onstop = mediaRecorderRef.current!.onstop;
              mediaRecorderRef.current = newRecorder;
              newRecorder.start();
            }
          }, 500);
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    };

    checkAudio();
  };

  const processUserSpeech = async (audioBlob: Blob) => {
    try {
      setIsUserSpeaking(false);

      const formData = new FormData();
      formData.append('roomName', roomName);
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/livekit/agent/turn', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.details || errorData.error || 'Failed to process speech');
      }

      const data = await response.json();

      // Play agent response
      if (data.audio && audioElementRef.current) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        audioElementRef.current.src = URL.createObjectURL(audioBlob);
        setIsAgentSpeaking(true);
        await audioElementRef.current.play();
      }

      // Check if complete
      if (data.completed) {
        await completeOnboarding();
      }
    } catch (err) {
      console.error('❌ Error processing speech:', err);
      setError(err instanceof Error ? err.message : 'Processing failed');
    }
  };

  const completeOnboarding = async () => {
    try {
      const response = await fetch('/api/livekit/agent/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName }),
      });

      if (!response.ok) throw new Error('Failed to complete');

      const data = await response.json();
      onComplete(data.profile);
    } catch (err) {
      console.error('❌ Error completing onboarding:', err);
      setError('Failed to save profile');
    }
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // Audio ended handler
  useEffect(() => {
    if (audioElementRef.current) {
      const handleEnded = () => setIsAgentSpeaking(false);
      audioElementRef.current.addEventListener('ended', handleEnded);
      return () => audioElementRef.current?.removeEventListener('ended', handleEnded);
    }
  }, []);

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
        <div
          className={`absolute inset-0 rounded-full blur-3xl transition-all duration-500 ${
            isAgentSpeaking
              ? 'bg-primary/40 scale-150'
              : isUserSpeaking
              ? 'bg-blue-500/30 scale-125'
              : 'bg-primary/20 scale-100'
          }`}
        />

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
