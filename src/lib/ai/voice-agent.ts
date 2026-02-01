/**
 * Voice Agent Orchestrator
 * OpenAI GPT-4o-mini powered conversation engine for voice onboarding
 */

import OpenAI from 'openai';
import type {
  ConversationSession,
  ConversationState,
  ConversationTurn,
  AgentResponse,
  ProfileData,
} from '../voice/types';
import {
  buildExtractionPrompt,
  buildGreetingPrompt,
  buildCompletionPrompt,
} from './prompts';

// Configuration
const CONFIG = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  MODEL: 'gpt-4o-mini', // Fast, cheap, excellent for conversations
  GENERATION_CONFIG: {
    temperature: 0.7,
    max_tokens: 1024,
  },
};

// Initialize OpenAI
const openai = CONFIG.OPENAI_API_KEY
  ? new OpenAI({ apiKey: CONFIG.OPENAI_API_KEY })
  : null;

// In-memory session storage (in production, use Redis or database)
const sessions = new Map<string, ConversationSession>();

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Start a new voice conversation
 */
export async function startVoiceConversation(userId?: string): Promise<ConversationSession> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    console.log('🤖 Starting new voice conversation with GPT-4o-mini...');

    // Generate greeting
    const completion = await openai.chat.completions.create({
      model: CONFIG.MODEL,
      messages: [
        {
          role: 'user',
          content: buildGreetingPrompt(),
        },
      ],
      temperature: CONFIG.GENERATION_CONFIG.temperature,
      max_tokens: CONFIG.GENERATION_CONFIG.max_tokens,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(response);

    const session: ConversationSession = {
      sessionId: generateSessionId(),
      userId,
      state: 'greeting',
      history: [
        {
          role: 'agent',
          text: parsed.greeting,
          timestamp: new Date(),
        },
      ],
      extractedData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    sessions.set(session.sessionId, session);
    console.log(`✅ Session created: ${session.sessionId}`);

    return session;
  } catch (error) {
    console.error('❌ Failed to start conversation:', error);
    throw new Error(`Failed to start conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process a voice turn in the conversation
 */
export async function processVoiceTurn(
  sessionId: string,
  userText: string
): Promise<AgentResponse> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  try {
    console.log(`🤖 Processing turn for session ${sessionId}...`);
    console.log(`   User said: "${userText}"`);

    // Add user message to history
    const userTurn: ConversationTurn = {
      role: 'user',
      text: userText,
      timestamp: new Date(),
    };
    session.history.push(userTurn);

    // Generate response using GPT-4o-mini
    const prompt = buildExtractionPrompt(
      userText,
      session.state,
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
    
    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch {
      console.error('Failed to parse GPT response:', response);
      throw new Error('Invalid response format from AI');
    }

    console.log(`   Extracted: ${JSON.stringify(parsed.extractedData)}`);
    console.log(`   Next state: ${parsed.nextState}`);

    // Update session with extracted data
    session.extractedData = {
      ...session.extractedData,
      ...parsed.extractedData,
    };
    session.state = parsed.nextState as ConversationState;
    session.updatedAt = new Date();

    // Add agent response to history
    const agentTurn: ConversationTurn = {
      role: 'agent',
      text: parsed.nextQuestion,
      timestamp: new Date(),
    };
    session.history.push(agentTurn);

    // Check if conversation is complete
    const completed = parsed.completed || session.state === 'complete';

    if (completed && session.state !== 'complete') {
      session.state = 'complete';
      
      // Generate completion message
      const completionResult = await openai.chat.completions.create({
        model: CONFIG.MODEL,
        messages: [
          {
            role: 'user',
            content: buildCompletionPrompt(session.extractedData),
          },
        ],
        temperature: CONFIG.GENERATION_CONFIG.temperature,
        max_tokens: CONFIG.GENERATION_CONFIG.max_tokens,
        response_format: { type: 'json_object' },
      });
      
      const completionResponse = completionResult.choices[0].message.content || '{}';
      const completionParsed = JSON.parse(completionResponse);
      
      agentTurn.text = completionParsed.completionMessage;
    }

    console.log(`✅ Turn processed. Completed: ${completed}`);

    return {
      transcription: userText,
      extractedData: session.extractedData,
      nextQuestion: agentTurn.text,
      completed,
      state: session.state,
    };
  } catch (error) {
    console.error('❌ Failed to process turn:', error);
    throw new Error(`Failed to process turn: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Complete voice onboarding and return final profile
 */
export async function completeVoiceOnboarding(sessionId: string): Promise<ProfileData> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  console.log(`✅ Completing onboarding for session ${sessionId}`);
  console.log(`   Extracted data:`, session.extractedData);

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

  // Clean up session
  sessions.delete(sessionId);

  return session.extractedData as ProfileData;
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): ConversationSession | undefined {
  return sessions.get(sessionId);
}

/**
 * Delete session
 */
export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}

/**
 * Get all active sessions (for debugging)
 */
export function getAllSessions(): ConversationSession[] {
  return Array.from(sessions.values());
}

/**
 * Clean up old sessions (call periodically)
 */
export function cleanupOldSessions(maxAgeMinutes: number = 30): number {
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

export { CONFIG };
