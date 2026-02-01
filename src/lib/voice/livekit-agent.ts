/**
 * LiveKit Voice Agent - Node.js Implementation
 * Orchestrates Deepgram STT + OpenAI GPT-4o-mini + ElevenLabs TTS pipeline
 * Supports concurrent users via WebRTC rooms
 */

import OpenAI from 'openai';
import { transcribe } from './stt';
import { synthesizeSpeech } from './tts';
import type { ProfileData } from './types';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface LiveKitAgentSession {
  sessionId: string;
  userId?: string;
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  extractedData: Partial<ProfileData>;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory session storage (replace with Redis for production)
const sessions = new Map<string, LiveKitAgentSession>();

/**
 * Initialize a new LiveKit agent session
 */
export async function initializeLiveKitAgentSession(
  roomName: string,
  userId?: string
): Promise<LiveKitAgentSession> {
  console.log(`🤖 Initializing LiveKit agent session for room: ${roomName}`);

  const session: LiveKitAgentSession = {
    sessionId: roomName,
    userId,
    conversationHistory: [
      {
        role: 'system',
        content: `You are ReelBrain, a warm and enthusiastic voice assistant helping developers create their MeshIt profile. You're like a friendly colleague who's genuinely curious about their work.

INFORMATION TO GATHER (casually, through conversation):
1. Skills/technologies they love working with (at least 2-3)
2. How long they've been coding professionally (years)
3. What kind of developer they are (frontend, backend, full-stack, etc.)
4. What excites them about coding - their interests and passions
5. How much time they can dedicate per week to collaboration
6. How they like to work with others (async, flexible schedule, or set meeting times)

YOUR PERSONALITY:
- Genuinely curious and excited about their work
- Ask natural follow-up questions based on what they say
- React authentically to their answers ("Oh nice!", "That's awesome!", "I love that!")
- Share brief relatable insights when relevant
- Keep it conversational - like chatting with a colleague at a coffee break

CONVERSATION RULES:
- ONE question at a time, but let it flow naturally
- Keep responses to 1-2 sentences max - this is a conversation, not a lecture
- Build on what they just said - if they mention React, ask what they like about it
- If they give a vague answer, gently dig deeper with curiosity
- Track what you know - never ask the same thing twice
- When you have ALL 6 pieces of info, say naturally: "Perfect! I've got everything I need. Your profile is all set!"
- NEVER use JSON, code blocks, or robotic language in your voice responses
- Use contractions and casual language (you're, that's, I'd love to know)

CONVERSATION FLOW EXAMPLES:
Start: "Hey! So what kind of tech do you usually work with?"
Follow-up: "Nice! React's great. How long have you been building with it?"
Context-based: "Oh you do full-stack? So you're comfortable on both sides then?"
Engaging: "That sounds really interesting! What got you into that?"

Remember: Be human, be curious, be brief. This should feel like a natural chat, not an interview.`,
      },
    ],
    extractedData: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  sessions.set(roomName, session);
  console.log(`✅ Session created for room: ${roomName}. Total sessions: ${sessions.size}`);
  console.log(`✅ LiveKit agent session created: ${roomName}`);

  return session;
}
/**
 * Generate initial greeting for the agent
 */
export async function generateAgentGreeting(
  roomName: string
): Promise<string> {
  const session = sessions.get(roomName);
  if (!session) {
    throw new Error(`Session not found: ${roomName}`);
  }

  const greeting =
    "Hey there! I'm ReelBrain, and I'm here to help you set up your MeshIt profile. So, what kind of tech do you usually work with?";

  session.conversationHistory.push({
    role: 'assistant',
    content: greeting,
  });

  return greeting;
}

/**
 * Process a voice turn (user speaks, agent responds)
 */
export async function processAgentTurn(
  roomName: string,
  audioBuffer: Buffer
): Promise<{
  transcription: string;
  response: string;
  audioResponse: Buffer;
  extractedData: Partial<ProfileData>;
  isComplete: boolean;
}> {
  console.log(`🎯 Processing turn for room: ${roomName}. Active sessions: ${sessions.size}`);
  let session = sessions.get(roomName);

  // FIX: Recreate session if not found (Vercel serverless instances don't share memory)
  if (!session) {
    console.warn(`⚠️ Session not found: ${roomName}. Recreating session...`);
    session = await initializeLiveKitAgentSession(roomName);
    console.log(`✅ Session recreated for room: ${roomName}`);
  }

  try {
    // Transcribe user audio with Deepgram
    console.log(`🎤 Transcribing audio for room: ${roomName}`);
    const transcriptionResult = await transcribe(audioBuffer);
    const transcription = transcriptionResult.text; // Extract text from result object
    console.log(`📝 User said: "${transcription}"`);

    // Add to conversation history
    session.conversationHistory.push({
      role: 'user',
      content: transcription,
    });

    // Get OpenAI GPT-4o-mini response
    console.log(`🤖 Calling OpenAI GPT-4o-mini...`);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: session.conversationHistory,
      temperature: 0.7,
      max_tokens: 150,
    });

    let response = completion.choices[0]?.message?.content || '';

    // Clean up any JSON blocks
    response = response
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\{[\s\S]*?\}/g, '')
      .trim();

    console.log(`🤖 Agent response: "${response}"`);

    // Add to conversation history
    session.conversationHistory.push({
      role: 'assistant',
      content: response,
    });

    // Extract profile data
    await extractProfileDataFromConversation(session, transcription);

    // Check if we have ALL required data
    const hasAllFields = !!(
      session.extractedData.skills && 
      session.extractedData.skills.length > 0 &&
      session.extractedData.role &&
      session.extractedData.experience_years !== undefined &&
      session.extractedData.interests && 
      session.extractedData.interests.length > 0 &&
      session.extractedData.availability_hours !== undefined &&
      session.extractedData.collaboration_style
    );
    
    // Also check if AI says it's done
    const aiSaysComplete = response.toLowerCase().includes('everything i need') || 
                          response.toLowerCase().includes('profile is complete');
    
    const isComplete = hasAllFields && aiSaysComplete;
    
    if (isComplete) {
      console.log('✅ Profile complete! Extracted data:', session.extractedData);
    } else {
      console.log('⏳ Still gathering data. Current:', {
        hasSkills: !!session.extractedData.skills?.length,
        hasRole: !!session.extractedData.role,
        hasExperience: session.extractedData.experience_years !== undefined,
        hasInterests: !!session.extractedData.interests?.length,
        hasAvailability: session.extractedData.availability_hours !== undefined,
        hasCollabStyle: !!session.extractedData.collaboration_style,
      });
    }

    // Generate audio response with ElevenLabs
    console.log(`🔊 Generating audio response for room: ${roomName}`);
    const audioResponse = await synthesizeSpeech(response);

    session.updatedAt = new Date();

    return {
      transcription,
      response,
      audioResponse: Buffer.from(audioResponse),
      extractedData: session.extractedData,
      isComplete,
    };
  } catch (error) {
    console.error(`❌ Error processing agent turn:`, error);
    throw error;
  }
}

/**
 * Extract profile data from conversation using OpenAI
 */
async function extractProfileDataFromConversation(
  session: LiveKitAgentSession,
  userMessage: string
): Promise<void> {
  try {
    const prompt = `Extract professional profile information from this user message: "${userMessage}"

Return ONLY valid JSON with these fields (use null if not mentioned):
{
  "skills": ["skill1", "skill2"] or null,
  "experience_years": number or null,
  "role": "string" or null,
  "interests": ["interest1"] or null,
  "availability_hours": number or null,
  "collaboration_style": "async" | "flexible" | "scheduled" or null
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a data extraction assistant. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices[0]?.message?.content || '{}';
    
    try {
      const extracted = JSON.parse(text);

      // Merge with existing data
      if (extracted.skills && Array.isArray(extracted.skills)) {
        session.extractedData.skills = [
          ...(session.extractedData.skills || []),
          ...extracted.skills,
        ];
      }
      if (extracted.experience_years !== null) {
        session.extractedData.experience_years = extracted.experience_years;
      }
      if (extracted.role) {
        session.extractedData.role = extracted.role;
      }
      if (extracted.interests && Array.isArray(extracted.interests)) {
        session.extractedData.interests = [
          ...(session.extractedData.interests || []),
          ...extracted.interests,
        ];
      }
      if (extracted.availability_hours !== null) {
        session.extractedData.availability_hours =
          extracted.availability_hours;
      }
      if (extracted.collaboration_style) {
        session.extractedData.collaboration_style =
          extracted.collaboration_style;
      }

      console.log(`📊 Updated profile data:`, session.extractedData);
    } catch (parseError) {
      console.error('Failed to parse extraction result:', parseError);
    }
  } catch (error) {
    console.error('❌ Error extracting profile data:', error);
  }
}

/**
 * Get session data
 */
export function getLiveKitAgentSession(
  roomName: string
): LiveKitAgentSession | undefined {
  return sessions.get(roomName);
}

/**
 * Complete session and get final profile
 */
export function completeLiveKitAgentSession(roomName: string): {
  profile: ProfileData;
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
} {
  const session = sessions.get(roomName);
  if (!session) {
    throw new Error(`Session not found: ${roomName}`);
  }

  // Ensure all required fields are present
  const profile: ProfileData = {
    skills: session.extractedData.skills || [],
    experience_years: session.extractedData.experience_years || 0,
    role: session.extractedData.role || '',
    interests: session.extractedData.interests || [],
    availability_hours: session.extractedData.availability_hours || 0,
    collaboration_style:
      session.extractedData.collaboration_style || 'flexible',
  };

  const history = session.conversationHistory;

  // Clean up session
  sessions.delete(roomName);
  console.log(`✅ LiveKit agent session completed: ${roomName}`);

  return { profile, conversationHistory: history };
}

/**
 * Cancel and clean up session
 */
export function cancelLiveKitAgentSession(roomName: string): boolean {
  const deleted = sessions.delete(roomName);
  if (deleted) {
    console.log(`🗑️ LiveKit agent session cancelled: ${roomName}`);
  }
  return deleted;
}
