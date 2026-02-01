'use client';

/**
 * Gemini Voice Interface Component
 * Complete voice onboarding using Gemini Live API
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { VoiceRecorder } from './voice-recorder';
import { Button } from '@/components/ui/button';
import { Volume2, CheckCircle, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

interface GeminiVoiceInterfaceProps {
  onComplete: (profileData: any) => void;
  onCancel?: () => void;
}

export function GeminiVoiceInterface({
  onComplete,
  onCancel,
}: GeminiVoiceInterfaceProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [extractedData, setExtractedData] = useState<any>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation on mount
  useEffect(() => {
    startConversation();
  }, []);

  const startConversation = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const response = await fetch('/api/voice/gemini/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start conversation');
      }

      setSessionId(data.sessionId);
      setMessages([
        {
          role: 'agent',
          text: data.greeting,
          timestamp: new Date(),
        },
      ]);

      // Play greeting audio
      await playAudio(data.audio);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = async (audioBase64: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg');
        const audioUrl = URL.createObjectURL(audioBlob);

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audioRef.current.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          reject(e);
        };

        setIsPlaying(true);
        
        // Play with error handling
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('🔊 Audio playing successfully');
            })
            .catch((error) => {
              console.error('❌ Audio play failed:', error);
              setIsPlaying(false);
              // Still resolve to not block the conversation
              resolve();
            });
        }
      } catch (err) {
        console.error('❌ Audio setup failed:', err);
        reject(err);
      }
    });
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (!sessionId) {
      setError('No active session');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Send audio to API
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('audio', audioBlob);

      const response = await fetch('/api/voice/gemini/turn', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to process audio');
      }

      // Add user message
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          text: data.transcription,
          timestamp: new Date(),
        },
      ]);

      // Update extracted data
      setExtractedData(data.extractedData);

      // Add agent response
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: data.nextQuestion,
          timestamp: new Date(),
        },
      ]);

      // Play agent response audio automatically
      if (data.audio) {
        try {
          await playAudio(data.audio);
        } catch (audioError) {
          console.warn('⚠️ Audio playback failed (non-blocking):', audioError);
          // Don't throw - allow conversation to continue even if audio fails
        }
      }

      // Check if complete
      if (data.completed) {
        setIsComplete(true);
        await handleComplete();
      }
    } catch (err) {
      console.error('Failed to process recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to process recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/voice/gemini/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to complete conversation');
      }

      // Call completion callback with profile data
      onComplete(data.profile);
    } catch (err) {
      console.error('Failed to complete conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete conversation');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Voice Onboarding</h2>
        <p className="text-sm text-muted-foreground">
          Have a conversation with our AI to set up your profile
        </p>
      </div>

      {/* Conversation Display */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-4 border rounded-lg p-4 bg-muted/20">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isPlaying && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
            <Volume2 className="h-4 w-4" />
            <span>🔊 AI is speaking... (audio will auto-play)</span>
          </div>
        )}

        {isProcessing && !isPlaying && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Processing your response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Extracted Data Preview */}
      {Object.keys(extractedData).length > 0 && (
        <div className="mb-4 p-3 border rounded-lg bg-muted/30">
          <p className="text-xs font-semibold mb-2">Extracted Information:</p>
          <div className="text-xs space-y-1">
            {extractedData.skills && (
              <p>✓ Skills: {extractedData.skills.join(', ')}</p>
            )}
            {extractedData.experience_years && (
              <p>✓ Experience: {extractedData.experience_years} years</p>
            )}
            {extractedData.role && <p>✓ Role: {extractedData.role}</p>}
            {extractedData.interests && (
              <p>✓ Interests: {extractedData.interests.join(', ')}</p>
            )}
            {extractedData.availability_hours && (
              <p>✓ Availability: {extractedData.availability_hours} hours/week</p>
            )}
            {extractedData.collaboration_style && (
              <p>✓ Style: {extractedData.collaboration_style}</p>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900 dark:text-red-100">
              Error
            </p>
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Voice Recorder */}
      {!isComplete && sessionId && (
        <div className="mb-4">
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            isProcessing={isProcessing || isPlaying}
            maxDuration={30}
          />
        </div>
      )}

      {/* Complete State */}
      {isComplete && (
        <div className="flex flex-col items-center gap-4 p-6 border border-green-200 rounded-lg bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <div className="text-center">
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Profile Complete!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your profile has been created successfully
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      {onCancel && !isComplete && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
