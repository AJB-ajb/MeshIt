/**
 * Gemini Live API Integration
 * Real-time voice conversations using Gemini 2.0 Flash's native audio capabilities
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProfileData } from './types';

// Configuration
const CONFIG = {
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  MODEL: 'models/gemini-2.5-flash', // Latest stable model
  GENERATION_CONFIG: {
    temperature: 0.7,
    maxOutputTokens: 1024,
  },
};

// Initialize Gemini client
const genAI = CONFIG.GOOGLE_API_KEY
  ? new GoogleGenerativeAI(CONFIG.GOOGLE_API_KEY)
  : null;

export interface GeminiLiveSession {
  sessionId: string;
  userId?: string;
  model: any;
  chat: any;
  extractedData: Partial<ProfileData>;
  conversationHistory: Array<{ role: string; text: string }>;
  createdAt: Date;
  updatedAt: Date;
}

// System prompt for voice onboarding
const SYSTEM_INSTRUCTION = `You are a friendly onboarding assistant for MeshIt, a platform that matches developers with projects.

Your role is to have a natural, conversational voice dialogue to gather profile information. Be warm, encouraging, and professional.

CONVERSATION FLOW (4-5 turns):
1. Greeting: Ask about their technical skills and technologies
2. Experience: Ask about years of experience and role
3. Availability: Ask about hours per week they can commit
4. Interests: Ask about project types/domains that interest them
5. Collaboration: Ask about their preferred work style (sync/async)

EXTRACTION GUIDELINES:
- Extract structured data from natural responses
- Keep questions concise and conversational (1-2 sentences max)
- Don't repeat information already provided
- Be encouraging and positive
- Move through conversation naturally

REQUIRED FIELDS TO EXTRACT:
- skills: array of programming languages, frameworks, tools
- experience_years: number of years
- role: string (e.g., "full-stack developer", "frontend engineer")
- interests: array of project types/domains
- availability_hours: number or range (e.g., 15 or "10-15")
- collaboration_style: "synchronous", "asynchronous", or "flexible"

RESPONSE FORMAT:
Always respond with natural speech suitable for text-to-speech. After each user response, internally track what data you've extracted.

When you have ALL required fields, say: "Perfect! I've got everything I need. Let me set up your profile and show you some matching projects!"`;

/**
 * Start a new Gemini Live conversation session
 */
export async function startGeminiLiveSession(userId?: string): Promise<GeminiLiveSession> {
  if (!genAI) {
    throw new Error('Google API key not configured');
  }

  try {
    console.log('🤖 Starting Gemini Live session...');

    const model = genAI.getGenerativeModel({
      model: CONFIG.MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: CONFIG.GENERATION_CONFIG,
    });

    const chat = model.startChat({
      history: [],
    });

    const sessionId = `gemini_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: GeminiLiveSession = {
      sessionId,
      userId,
      model,
      chat,
      extractedData: {},
      conversationHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(`✅ Gemini Live session created: ${sessionId}`);
    return session;
  } catch (error) {
    console.error('❌ Failed to start Gemini Live session:', error);
    throw new Error(`Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate greeting message
 */
export async function generateGreeting(session: GeminiLiveSession): Promise<string> {
  try {
    const result = await session.chat.sendMessage(
      'Start the onboarding conversation with a warm greeting and your first question about their technical skills.'
    );
    
    const greeting = result.response.text();
    session.conversationHistory.push({ role: 'assistant', text: greeting });
    session.updatedAt = new Date();
    
    return greeting;
  } catch (error) {
    console.error('❌ Failed to generate greeting:', error);
    throw new Error(`Failed to generate greeting: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process user's voice input and generate response
 */
export async function processVoiceInput(
  session: GeminiLiveSession,
  userText: string
): Promise<{
  response: string;
  extractedData: Partial<ProfileData>;
  isComplete: boolean;
}> {
  try {
    console.log(`🗣️  User said: "${userText}"`);

    // Add user message to history
    session.conversationHistory.push({ role: 'user', text: userText });

    // Send to Gemini with extraction request
    const prompt = `User said: "${userText}"

Extract any new profile data from this response and continue the conversation naturally.

Current extracted data so far:
${JSON.stringify(session.extractedData, null, 2)}

IMPORTANT: 
- Respond ONLY with natural conversational speech suitable for text-to-speech
- Do NOT include JSON, code blocks, or technical formatting in your response
- Keep your response concise (1-2 sentences)
- Ask the next question to continue gathering profile information

If you now have ALL required fields (skills, experience_years, role, interests, availability_hours, collaboration_style), say a completion message like "Perfect! I've got everything I need. Let me set up your profile."`;

    const result = await session.chat.sendMessage(prompt);
    let response = result.response.text();
    
    // Clean up any JSON or code blocks that might have leaked through
    response = response
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\{[\s\S]*?\}/g, '')
      .trim();

    // Add assistant response to history
    session.conversationHistory.push({ role: 'assistant', text: response });

    // Extract structured data from the conversation
    const extractedData = await extractProfileData(session);
    session.extractedData = { ...session.extractedData, ...extractedData };
    session.updatedAt = new Date();

    // Check if conversation is complete
    const isComplete = checkIfComplete(session.extractedData, response);

    console.log(`🤖 Response: "${response}"`);
    console.log(`📊 Extracted data:`, session.extractedData);
    console.log(`✅ Complete: ${isComplete}`);

    return {
      response,
      extractedData: session.extractedData,
      isComplete,
    };
  } catch (error) {
    console.error('❌ Failed to process voice input:', error);
    throw new Error(`Failed to process input: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract structured profile data from conversation history
 */
async function extractProfileData(session: GeminiLiveSession): Promise<Partial<ProfileData>> {
  if (!genAI) {
    return {};
  }

  try {
    const conversationText = session.conversationHistory
      .map((turn) => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.text}`)
      .join('\n');

    const extractionModel = genAI.getGenerativeModel({
      model: CONFIG.MODEL,
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const extractionPrompt = `Extract structured profile data from this conversation.

Conversation:
${conversationText}

Extract these fields (only include fields with clear information):
- skills: string[] (programming languages, frameworks, tools mentioned)
- experience_years: number (years of experience)
- role: string (job role like "full-stack developer", "frontend engineer")
- interests: string[] (project types, domains, technologies they're interested in)
- availability_hours: number (hours per week, convert ranges like "10-15" to midpoint)
- collaboration_style: "synchronous" | "asynchronous" | "flexible"

Return ONLY a JSON object with extracted fields. Empty object {} if nothing can be extracted yet.

Example:
{
  "skills": ["React", "TypeScript", "Node.js"],
  "experience_years": 5,
  "role": "full-stack developer",
  "interests": ["AI", "startups", "web3"],
  "availability_hours": 12,
  "collaboration_style": "flexible"
}`;

    const result = await extractionModel.generateContent(extractionPrompt);
    const jsonText = result.response.text();
    
    // Parse and validate JSON
    try {
      const extracted = JSON.parse(jsonText);
      return extracted;
    } catch {
      console.warn('⚠️ Failed to parse extraction JSON:', jsonText);
      return {};
    }
  } catch (error) {
    console.error('❌ Data extraction failed:', error);
    return {};
  }
}

/**
 * Check if conversation has all required data
 */
function checkIfComplete(data: Partial<ProfileData>, lastResponse: string): boolean {
  const required: (keyof ProfileData)[] = [
    'skills',
    'experience_years',
    'role',
    'interests',
    'availability_hours',
    'collaboration_style',
  ];

  const hasAllFields = required.every((field) => {
    const value = data[field];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null;
  });

  // Also check if assistant indicated completion
  const completionPhrases = [
    'got everything',
    'all set',
    "that's all",
    'profile is ready',
    'set up your profile',
  ];
  const indicatesCompletion = completionPhrases.some((phrase) =>
    lastResponse.toLowerCase().includes(phrase)
  );

  return hasAllFields || indicatesCompletion;
}

/**
 * Generate completion summary
 */
export async function generateCompletionSummary(
  session: GeminiLiveSession
): Promise<string> {
  try {
    const summaryPrompt = `Generate a brief, encouraging completion message summarizing the user's profile.

Extracted profile:
${JSON.stringify(session.extractedData, null, 2)}

Keep it warm and positive (2-3 sentences). Ready for text-to-speech.`;

    const result = await session.chat.sendMessage(summaryPrompt);
    return result.response.text();
  } catch (error) {
    console.error('❌ Failed to generate summary:', error);
    return "Great! Your profile is all set. Let's find you some amazing projects!";
  }
}

/**
 * Clean up session
 */
export function closeGeminiLiveSession(session: GeminiLiveSession): void {
  console.log(`🧹 Closing Gemini Live session: ${session.sessionId}`);
  // Gemini sessions are stateless, no cleanup needed
}

export { CONFIG };
