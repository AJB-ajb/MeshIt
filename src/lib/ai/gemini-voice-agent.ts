/**
 * Gemini Voice Agent Orchestrator
 * High-level orchestration for Gemini Live voice conversations
 */

import {
  startGeminiLiveSession,
  generateGreeting,
  processVoiceInput,
  generateCompletionSummary,
  closeGeminiLiveSession,
  type GeminiLiveSession,
} from '../voice/gemini-live';
import { synthesizeSpeech } from '../voice/tts';
import type { ProfileData, AgentResponse } from '../voice/types';

// In-memory session storage (in production, use Redis or database)
const sessions = new Map<string, GeminiLiveSession>();

/**
 * Start a new Gemini voice conversation and return first greeting
 */
export async function startGeminiVoiceConversation(
  userId?: string
): Promise<{
  sessionId: string;
  greeting: string;
  audio: ArrayBuffer;
}> {
  try {
    console.log('🎙️ Starting Gemini voice conversation...');

    const session = await startGeminiLiveSession(userId);
    const greeting = await generateGreeting(session);

    // Store session
    sessions.set(session.sessionId, session);

    // Generate audio for greeting
    const audio = await synthesizeSpeech(greeting);

    console.log(`✅ Voice conversation started: ${session.sessionId}`);

    return {
      sessionId: session.sessionId,
      greeting,
      audio,
    };
  } catch (error) {
    console.error('❌ Failed to start voice conversation:', error);
    throw new Error(
      `Failed to start conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Process a voice turn with transcription
 */
export async function processGeminiVoiceTurn(
  sessionId: string,
  transcription: string
): Promise<AgentResponse> {
  let session = sessions.get(sessionId);
  
  // If session not found, try to recover by creating a new one
  if (!session) {
    console.warn(`⚠️ Session ${sessionId} not found. Available sessions: ${Array.from(sessions.keys()).join(', ')}`);
    console.warn('⚠️ This likely means the server restarted. Creating a new session...');
    
    // Create a fresh session
    const newSession = await startGeminiLiveSession();
    sessions.set(sessionId, newSession);
    session = newSession;
    
    console.log(`✅ Recovered with new session: ${sessionId}`);
  }

  try {
    console.log(`🎙️ Processing Gemini voice turn for ${sessionId}...`);

    const { response, extractedData, isComplete } = await processVoiceInput(
      session,
      transcription
    );

    // Generate audio for response
    const audioBuffer = await synthesizeSpeech(response);
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    const agentResponse: AgentResponse = {
      transcription,
      extractedData,
      nextQuestion: response,
      audio: audioBase64,
      completed: isComplete,
      state: isComplete ? 'complete' : 'skills', // Simplified state
    };

    console.log(`✅ Gemini turn processed. Complete: ${isComplete}`);

    return agentResponse;
  } catch (error) {
    console.error('❌ Failed to process Gemini voice turn:', error);
    throw new Error(
      `Failed to process turn: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Complete the voice conversation and return final profile
 */
export async function completeGeminiVoiceConversation(
  sessionId: string
): Promise<{
  profile: ProfileData;
  summary: string;
}> {
  const session = sessions.get(sessionId);
  if (!session) {
    console.warn(`⚠️ Session ${sessionId} not found during completion. Returning empty profile.`);
    // Return a basic profile if session is lost
    return {
      profile: {
        skills: [],
        experience_years: 0,
        role: '',
        interests: [],
        availability_hours: 0,
        collaboration_style: 'flexible',
      },
      summary: 'Your profile has been created.',
    };
  }

  try {
    console.log(`✅ Completing Gemini voice conversation: ${sessionId}`);

    // Generate completion summary
    const summary = await generateCompletionSummary(session);

    // Validate required fields
    const required: (keyof ProfileData)[] = [
      'skills',
      'experience_years',
      'role',
      'interests',
      'availability_hours',
      'collaboration_style',
    ];

    const missing = required.filter((field) => !session.extractedData[field]);
    if (missing.length > 0) {
      console.warn(`⚠️ Missing fields: ${missing.join(', ')}`);
    }

    const profile = session.extractedData as ProfileData;

    // Clean up session
    closeGeminiLiveSession(session);
    sessions.delete(sessionId);

    return { profile, summary };
  } catch (error) {
    console.error('❌ Failed to complete Gemini voice conversation:', error);
    throw new Error(
      `Failed to complete conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get session status
 */
export function getGeminiSessionStatus(sessionId: string): {
  exists: boolean;
  extractedData?: Partial<ProfileData>;
  turnCount?: number;
} {
  const session = sessions.get(sessionId);
  if (!session) {
    return { exists: false };
  }

  return {
    exists: true,
    extractedData: session.extractedData,
    turnCount: session.conversationHistory.length,
  };
}

/**
 * Cancel and clean up session
 */
export function cancelGeminiSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (session) {
    closeGeminiLiveSession(session);
    sessions.delete(sessionId);
    console.log(`🗑️ Gemini session cancelled: ${sessionId}`);
    return true;
  }
  return false;
}

/**
 * Clean up old sessions
 */
export function cleanupGeminiSessions(maxAgeMinutes: number = 30): number {
  const now = Date.now();
  const maxAge = maxAgeMinutes * 60 * 1000;
  let cleaned = 0;

  for (const [sessionId, session] of sessions.entries()) {
    const age = now - session.updatedAt.getTime();
    if (age > maxAge) {
      closeGeminiLiveSession(session);
      sessions.delete(sessionId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} old Gemini sessions`);
  }

  return cleaned;
}
