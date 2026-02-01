/**
 * Conversational Voice Agent
 * ChatGPT Voice-style natural conversation engine
 */

import OpenAI from 'openai';
import type { ConversationTurn, ProfileData } from '../voice/types';
import {
  buildConversationalPrompt,
  buildConversationalGreeting,
  buildCompletionMessage,
  type VoiceProfileData,
  type AgentAction,
} from './conversational-prompts';

// Configuration
const CONFIG = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  MODEL: 'gpt-4o-mini',
  GENERATION_CONFIG: {
    temperature: 0.8, // Slightly higher for more natural conversation
    max_tokens: 512, // Keep responses short
  },
};

// Initialize OpenAI
const openai = CONFIG.OPENAI_API_KEY
  ? new OpenAI({ apiKey: CONFIG.OPENAI_API_KEY })
  : null;

/**
 * Conversation session for voice onboarding
 */
export interface VoiceSession {
  sessionId: string;
  userId?: string;
  history: ConversationTurn[];
  extractedData: Partial<VoiceProfileData>;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response from processing a conversation turn
 */
export interface ConversationResponse {
  text: string; // Agent's spoken response
  extractedData: Partial<VoiceProfileData>;
  isComplete: boolean;
  action?: AgentAction;
}

// In-memory session storage
const sessions = new Map<string, VoiceSession>();

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `voice_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Start a new conversational voice session
 */
export async function startConversationalSession(userId?: string): Promise<{
  sessionId: string;
  greeting: string;
}> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('🎙️ Starting conversational voice session...');

  try {
    // Generate greeting
    const completion = await openai.chat.completions.create({
      model: CONFIG.MODEL,
      messages: [
        {
          role: 'user',
          content: buildConversationalGreeting(),
        },
      ],
      temperature: CONFIG.GENERATION_CONFIG.temperature,
      max_tokens: CONFIG.GENERATION_CONFIG.max_tokens,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(response);

    const session: VoiceSession = {
      sessionId: generateSessionId(),
      userId,
      history: [
        {
          role: 'agent',
          text: parsed.greeting,
          timestamp: new Date(),
        },
      ],
      extractedData: {},
      isComplete: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    sessions.set(session.sessionId, session);
    console.log(`✅ Session created: ${session.sessionId}`);
    console.log(`💬 Greeting: "${parsed.greeting}"`);

    return {
      sessionId: session.sessionId,
      greeting: parsed.greeting,
    };
  } catch (error) {
    console.error('❌ Failed to start session:', error);
    throw new Error(
      `Failed to start conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Process a user's spoken input in the conversation
 */
export async function processConversationalTurn(
  sessionId: string,
  userText: string
): Promise<ConversationResponse> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  console.log(`🎙️ Processing turn for session ${sessionId}...`);
  console.log(`   User: "${userText}"`);

  try {
    // Add user message to history
    session.history.push({
      role: 'user',
      text: userText,
      timestamp: new Date(),
    });

    // Generate response
    const prompt = buildConversationalPrompt(
      userText,
      session.history,
      session.extractedData
    );

    const completion = await openai.chat.completions.create({
      model: CONFIG.MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: CONFIG.GENERATION_CONFIG.temperature,
      max_tokens: CONFIG.GENERATION_CONFIG.max_tokens,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0].message.content || '{}';
    let parsed;
    
    try {
      parsed = JSON.parse(response);
    } catch {
      console.error('Failed to parse response:', response);
      throw new Error('Invalid response format');
    }

    // Update extracted data
    if (parsed.extractedData) {
      session.extractedData = {
        ...session.extractedData,
        ...parsed.extractedData,
      };
    }

    // Add agent response to history
    session.history.push({
      role: 'agent',
      text: parsed.response,
      timestamp: new Date(),
    });

    session.updatedAt = new Date();

    // Check for completion
    const isComplete = parsed.readyToComplete && parsed.action?.type === 'create_profile';
    if (isComplete) {
      session.isComplete = true;
    }

    console.log(`   Agent: "${parsed.response}"`);
    console.log(`   Extracted: ${JSON.stringify(parsed.extractedData || {})}`);
    console.log(`   Ready: ${parsed.readyToComplete}`);

    return {
      text: parsed.response,
      extractedData: session.extractedData,
      isComplete,
      action: parsed.action,
    };
  } catch (error) {
    console.error('❌ Failed to process turn:', error);
    throw new Error(
      `Failed to process turn: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Complete the onboarding session and return profile data
 */
export async function completeConversationalSession(sessionId: string): Promise<{
  profile: VoiceProfileData;
  completionMessage: string;
}> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  console.log(`✅ Completing session ${sessionId}`);
  console.log(`   Extracted data:`, session.extractedData);

  // Generate completion message
  const completionMessage = buildCompletionMessage(session.extractedData as VoiceProfileData);

  // Clean up session
  sessions.delete(sessionId);

  return {
    profile: session.extractedData as VoiceProfileData,
    completionMessage,
  };
}

/**
 * Get session by ID
 */
export function getConversationalSession(sessionId: string): VoiceSession | undefined {
  return sessions.get(sessionId);
}

/**
 * Delete session
 */
export function deleteConversationalSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}

/**
 * Clean up old sessions (call periodically)
 */
export function cleanupConversationalSessions(maxAgeMinutes: number = 30): number {
  const now = Date.now();
  const maxAge = maxAgeMinutes * 60 * 1000;
  let cleaned = 0;

  for (const [sessionId, session] of sessions.entries()) {
    const age = now - session.updatedAt.getTime();
    if (age > maxAge) {
      sessions.delete(sessionId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} old sessions`);
  }

  return cleaned;
}
