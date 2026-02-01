/**
 * LiveKit Voice Interface Component
 * Real-time voice conversation with automatic listening (hands-free)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  LocalAudioTrack,
  RemoteAudioTrack,
  AudioCaptureOptions,
  createLocalAudioTrack,
} from 'livekit-client';
import { Button } from '@/components/ui/button';
import type { ProfileData } from '@/lib/voice/types';

interface LiveKitVoiceInterfaceProps {
  onComplete: (profile: ProfileData) => void;
  userId?: string;
}

export function LiveKitVoiceInterface({
  onComplete,
  userId,
}: LiveKitVoiceInterfaceProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');
  const [transcription, setTranscription] = useState('');
  const [extractedData, setExtractedData] = useState<Partial<ProfileData>>({});
  const [roomName] = useState(`voice_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  
  const roomRef = useRef<Room | null>(null);
  const greetingAudioRef = useRef<HTMLAudioElement>(null);
  const localTrackRef = useRef<LocalAudioTrack | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const silenceStartRef = useRef<number>(0);

  /**
   * Initialize LiveKit connection and start agent
   */
  const startConversation = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      console.log(`🔗 Connecting to LiveKit room: ${roomName}`);

      // Get access token from server
      const tokenResponse = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantName: userId || `user_${Date.now()}`,
          metadata: JSON.stringify({ userId }),
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get LiveKit token');
      }

      const { token, wsUrl } = await tokenResponse.json();

      // Create and connect to room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720 },
        },
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        } as AudioCaptureOptions,
      });

      roomRef.current = room;

      // Set up event listeners
      room.on(RoomEvent.Connected, async () => {
        console.log('✅ Connected to LiveKit room');
        setIsConnected(true);
        setIsConnecting(false);
        
        // Enable microphone automatically
        await enableMicrophone();
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('📴 Disconnected from LiveKit room');
        setIsConnected(false);
        stopListening();
      });

      room.on(RoomEvent.TrackSubscribed, (track: Track, publication, participant) => {
        console.log('🎵 Track subscribed:', track.kind, 'from', participant.identity);
        
        if (track.kind === Track.Kind.Audio) {
          const audioTrack = track as RemoteAudioTrack;
          const audioElement = audioTrack.attach();
          document.body.appendChild(audioElement);
          setIsAgentSpeaking(true);
          
          // Stop listening when agent speaks
          if (isListening) {
            pauseListening();
          }

          // Remove when track unsubscribes
          track.once('ended', () => {
            audioElement.remove();
            setIsAgentSpeaking(false);
            // Resume listening when agent stops
            if (isConnected && !isMuted) {
              resumeListening();
            }
          });
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, () => {
        setIsAgentSpeaking(false);
        // Resume listening when agent finishes
        if (isConnected && !isMuted) {
          resumeListening();
        }
      });

      // Connect to room
      await room.connect(wsUrl, token);

      // Start the agent session
      const agentResponse = await fetch('/api/livekit/agent/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, userId }),
      });

      if (!agentResponse.ok) {
        throw new Error('Failed to start agent');
      }

      const agentData = await agentResponse.json();
      setGreeting(agentData.greeting);

      // Play greeting audio
      if (agentData.audio && greetingAudioRef.current) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(agentData.audio), (c) => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        greetingAudioRef.current.src = audioUrl;
        setIsAgentSpeaking(true);
        
        try {
          await greetingAudioRef.current.play();
        } catch (playError) {
          console.warn('Auto-play prevented, user interaction required');
        }
      }
    } catch (err) {
      console.error('❌ Error starting LiveKit conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnecting(false);
    }
  };

  /**
   * Enable microphone and start continuous listening
   */
  const enableMicrophone = async () => {
    try {
      console.log('🎤 Enabling microphone...');
      
      // Create local audio track
      const track = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      localTrackRef.current = track;

      // Publish track to room
      if (roomRef.current) {
        await roomRef.current.localParticipant.publishTrack(track);
        console.log('✅ Microphone enabled and published');
      }

      // Start continuous listening with Voice Activity Detection
      startContinuousListening(track);
    } catch (err) {
      console.error('❌ Error enabling microphone:', err);
      setError('Failed to access microphone. Please grant permission.');
    }
  };

  /**
   * Start continuous listening with automatic voice detection
   */
  const startContinuousListening = async (audioTrack: LocalAudioTrack) => {
    try {
      const stream = new MediaStream([audioTrack.mediaStreamTrack]);
      
      // Create AudioContext for voice activity detection
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const audioContext = audioContextRef.current;
      
      // Create analyzer for audio level detection
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      analyzer.smoothingTimeConstant = 0.8;
      analyzerRef.current = analyzer;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);
      
      // Create MediaRecorder for capturing audio
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop audio analysis
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        if (audioChunksRef.current.length > 0 && !isAgentSpeaking) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm;codecs=opus',
          });
          
          // Only process if audio is substantial
          if (audioBlob.size > 5000) {
            await processVoiceInput(audioBlob);
          }
        }
        
        audioChunksRef.current = [];
        isSpeakingRef.current = false;
        
        // Continue listening if not muted and not agent speaking
        if (!isMuted && !isAgentSpeaking && isConnected && localTrackRef.current) {
          setTimeout(() => {
            // Create new MediaRecorder instance - can't reuse old one
            if (localTrackRef.current && !isAgentSpeaking && !isMuted) {
              startContinuousListening(localTrackRef.current);
            }
          }, 500);
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsListening(true);
      console.log('🎧 Continuous listening started with VAD');

      // Start real-time voice activity detection
      detectVoiceActivity(analyzer);
    } catch (err) {
      console.error('❌ Error starting continuous listening:', err);
      setError('Failed to start listening');
    }
  };

  /**
   * Real-time voice activity detection
   */
  const detectVoiceActivity = (analyzer: AnalyserNode) => {
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Improved thresholds for better voice detection
    const VOICE_THRESHOLD = 45; // Higher threshold to avoid background noise (0-255)
    const SILENCE_DURATION = 1200; // Reduced to 1.2 seconds for faster response
    const MIN_SPEECH_DURATION = 500; // Minimum 0.5s of speech before processing

    let speechStartTime = 0;

    const checkAudioLevel = () => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
        return;
      }

      analyzer.getByteFrequencyData(dataArray);

      // Calculate RMS (Root Mean Square) for better voice detection
      const rms = Math.sqrt(
        dataArray.reduce((sum, value) => sum + value * value, 0) / bufferLength
      );

      const isSpeaking = rms > VOICE_THRESHOLD;

      // Debug logging (remove in production)
      if (isSpeaking !== isSpeakingRef.current) {
        console.log(`🎤 Voice ${isSpeaking ? 'DETECTED' : 'STOPPED'} (level: ${rms.toFixed(1)})`);
      }

      if (isSpeaking) {
        // User is speaking - reset silence timer
        if (!isSpeakingRef.current) {
          speechStartTime = Date.now();
        }
        isSpeakingRef.current = true;
        silenceStartRef.current = Date.now();
      } else if (isSpeakingRef.current) {
        // User was speaking but might have stopped
        const silenceDuration = Date.now() - silenceStartRef.current;
        const speechDuration = Date.now() - speechStartTime;

        if (silenceDuration > SILENCE_DURATION && speechDuration > MIN_SPEECH_DURATION) {
          // Detected silence for long enough - stop recording
          console.log(`🔇 Silence detected (${(silenceDuration/1000).toFixed(1)}s), processing speech...`);
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsListening(false);
          }
          return;
        }
      }

      // Continue checking
      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    // Start detection
    silenceStartRef.current = Date.now();
    checkAudioLevel();
  };

  /**
   * Pause listening (when agent speaks)
   */
  const pauseListening = () => {
    // Stop audio analysis
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsListening(false);
      console.log('⏸️  Listening paused');
    }
  };

  /**
   * Resume listening (when agent stops)
   */
  const resumeListening = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsListening(true);
      
      // Resume VAD if we have an analyzer
      if (analyzerRef.current) {
        silenceStartRef.current = Date.now();
        isSpeakingRef.current = false;
        detectVoiceActivity(analyzerRef.current);
      }
      
      console.log('▶️  Listening resumed');
    } else if (localTrackRef.current && !isAgentSpeaking && !isMuted) {
      // Restart if needed
      startContinuousListening(localTrackRef.current);
    }
  };

  /**
   * Stop listening completely
   */
  const stopListening = () => {
    // Stop audio analysis
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    setIsListening(false);
    console.log('🛑 Listening stopped');
  };

  /**
   * Toggle mute
   */
  const toggleMute = () => {
    if (isMuted) {
      // Unmute and resume listening
      setIsMuted(false);
      if (localTrackRef.current && !isAgentSpeaking) {
        startContinuousListening(localTrackRef.current);
      }
    } else {
      // Mute and stop listening
      setIsMuted(true);
      stopListening();
    }
  };

  /**
   * Process captured voice input
   */
  const processVoiceInput = async (audioBlob: Blob) => {
    if (!isConnected || !roomRef.current || isAgentSpeaking) {
      console.log('⏭️  Skipping voice input:', { isConnected, hasRoom: !!roomRef.current, isAgentSpeaking });
      return;
    }

    try {
      console.log(`🎙️ Processing voice input for room ${roomName}... (${audioBlob.size} bytes, ${audioBlob.type})`);
      setTranscription('Processing...');

      // Validate audio blob
      if (audioBlob.size < 1000) {
        console.warn('⚠️ Audio blob too small, skipping');
        setTranscription('');
        resumeListening();
        return;
      }

      // Send audio to agent for processing
      const formData = new FormData();
      formData.append('roomName', roomName);
      formData.append('audio', audioBlob, 'recording.webm');

      console.log('📤 Sending audio to server...');

      const response = await fetch('/api/livekit/agent/turn', {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Server error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to process voice input');
      }

      const data = await response.json();
      console.log('✅ Received data:', {
        transcription: data.transcription,
        responseLength: data.response?.length,
        hasAudio: !!data.audio,
        extractedData: data.extractedData,
        completed: data.completed,
      });

      setTranscription(data.transcription || 'No transcription available');

      // Update extracted data
      if (data.extractedData) {
        setExtractedData((prev) => ({ ...prev, ...data.extractedData }));
      }

      // Play agent response
      if (data.audio && greetingAudioRef.current) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (greetingAudioRef.current) {
          greetingAudioRef.current.pause();
          greetingAudioRef.current.currentTime = 0;
        }
        
        greetingAudioRef.current.src = audioUrl;
        setIsAgentSpeaking(true);
        
        try {
          await greetingAudioRef.current.play();
        } catch (playError) {
          console.error('Error playing audio:', playError);
          setIsAgentSpeaking(false);
          // Resume listening if audio fails
          resumeListening();
        }
      }

      // Check if conversation is complete
      if (data.completed) {
        await handleComplete();
      }
    } catch (err) {
      console.error('❌ Error processing voice input:', err);
      setError(err instanceof Error ? err.message : 'Processing failed');
      setTranscription('');
      // Resume listening after error
      if (!isAgentSpeaking && !isMuted) {
        resumeListening();
      }
    }
  };

  /**
   * Complete the conversation
   */
  const handleComplete = async () => {
    try {
      const response = await fetch('/api/livekit/agent/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete conversation');
      }

      const data = await response.json();
      
      // Disconnect from room
      if (roomRef.current) {
        roomRef.current.disconnect();
      }

      onComplete(data.profile);
    } catch (err) {
      console.error('❌ Error completing conversation:', err);
      setError(err instanceof Error ? err.message : 'Completion failed');
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopListening();
      if (localTrackRef.current) {
        localTrackRef.current.stop();
      }
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  /**
   * Handle greeting audio end - resume listening
   */
  useEffect(() => {
    if (greetingAudioRef.current) {
      const handleEnded = () => {
        setIsAgentSpeaking(false);
        // Resume listening when agent finishes speaking
        if (isConnected && !isMuted) {
          setTimeout(resumeListening, 500);
        }
      };
      
      greetingAudioRef.current.addEventListener('ended', handleEnded);
      
      return () => {
        greetingAudioRef.current?.removeEventListener('ended', handleEnded);
      };
    }
  }, [isConnected, isMuted]);

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            LiveKit Voice Onboarding
          </h2>
          <p className="text-muted-foreground">
            Hands-free real-time conversation with automatic listening
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected
                  ? 'bg-green-500 animate-pulse'
                  : isConnecting
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-gray-400'
              }`}
            />
            <span className="text-sm">
              {isConnected
                ? 'Connected'
                : isConnecting
                  ? 'Connecting...'
                  : 'Not Connected'}
            </span>
          </div>
          {isConnected && (
            <>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isListening ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm">
                  {isListening ? 'Listening...' : 'Idle'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isAgentSpeaking ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm">
                  {isAgentSpeaking ? 'Agent Speaking' : 'Agent Idle'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            <p className="text-sm font-medium">Error: {error}</p>
          </div>
        )}

        {/* Greeting Display */}
        {greeting && (
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-sm">{greeting}</p>
          </div>
        )}

        {/* Transcription Display */}
        {transcription && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">You said:</p>
            <p className="text-sm">{transcription}</p>
          </div>
        )}

        {/* Start/Control Buttons */}
        {!isConnected ? (
          <div className="flex justify-center">
            <Button
              onClick={startConversation}
              disabled={isConnecting}
              size="lg"
              className="w-full max-w-xs"
            >
              {isConnecting ? 'Connecting...' : '🎙️ Start Voice Conversation'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mute/Unmute Button */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={toggleMute}
                variant={isMuted ? 'destructive' : 'outline'}
                size="lg"
                className="w-48"
              >
                {isMuted ? '🔇 Unmute' : '🎤 Mute'}
              </Button>
            </div>

            {/* Status Messages */}
            {isAgentSpeaking && (
              <div className="text-center text-sm text-purple-600 dark:text-purple-400 animate-pulse">
                🔊 AI is speaking...
              </div>
            )}
            
            {isListening && !isAgentSpeaking && (
              <div className="text-center text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                🎧 Listening for your voice...
              </div>
            )}

            {!isListening && !isAgentSpeaking && !isMuted && (
              <div className="text-center text-sm text-muted-foreground">
                Speak naturally - I'll detect your voice automatically
              </div>
            )}

            {isMuted && (
              <div className="text-center text-sm text-muted-foreground">
                Microphone muted - Click "Unmute" to continue conversation
              </div>
            )}

            {/* Extracted Data Preview */}
            {Object.keys(extractedData).length > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-medium mb-2">Profile Progress:</h3>
                <div className="text-xs space-y-1">
                  {extractedData.skills && extractedData.skills.length > 0 && (
                    <p>✅ Skills: {extractedData.skills.join(', ')}</p>
                  )}
                  {extractedData.experience_years !== undefined && (
                    <p>✅ Experience: {extractedData.experience_years} years</p>
                  )}
                  {extractedData.role && <p>✅ Role: {extractedData.role}</p>}
                  {extractedData.interests && extractedData.interests.length > 0 && (
                    <p>✅ Interests: {extractedData.interests.join(', ')}</p>
                  )}
                  {extractedData.availability_hours !== undefined && (
                    <p>
                      ✅ Availability: {extractedData.availability_hours} hrs/week
                    </p>
                  )}
                  {extractedData.collaboration_style && (
                    <p>✅ Style: {extractedData.collaboration_style}</p>
                  )}
                </div>
              </div>
            )}

            {/* Manual Complete */}
            <div className="flex justify-center">
              <Button
                onClick={handleComplete}
                variant="outline"
                size="sm"
                disabled={Object.keys(extractedData).length === 0}
              >
                Complete Profile
              </Button>
            </div>
          </div>
        )}

        {/* Hidden audio element for agent responses */}
        <audio
          ref={greetingAudioRef}
          className="hidden"
        />
      </div>
    </div>
  );
}
