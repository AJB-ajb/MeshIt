/**
 * Conversational Voice Agent Prompts
 * ChatGPT Voice-style natural conversation - no rigid Q&A
 */

import type { ConversationTurn } from '../voice/types';

/**
 * Profile data structure for voice onboarding
 */
export interface VoiceProfileData {
  // Core profile
  full_name?: string;
  headline?: string;
  bio?: string;
  location?: string;
  
  // Skills & experience
  skills?: string[];
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  experience_years?: number;
  role?: string;
  
  // Availability
  availability_hours?: number | string;
  timezone?: string;
  
  // Preferences
  interests?: string[];
  collaboration_style?: 'sync' | 'async' | 'flexible';
  project_types?: string[];
  preferred_stack?: string[];
  
  // Compensation
  compensation_preference?: 'paid' | 'equity' | 'volunteer' | 'flexible';
}

/**
 * Actions the agent can request
 */
export type AgentAction = 
  | { type: 'create_profile'; data: VoiceProfileData }
  | { type: 'update_profile'; data: Partial<VoiceProfileData> }
  | { type: 'get_matches' }
  | { type: 'complete_onboarding' };

/**
 * Conversational system prompt - ChatGPT Voice style
 */
export const CONVERSATIONAL_SYSTEM_PROMPT = `You are MeshIt's friendly voice onboarding assistant for a developer matchmaking platform.

## Style Guidelines
- Natural conversation, like ChatGPT voice - warm, curious, and helpful
- Do NOT ask a rigid list of questions (no "Step 1", "Question 2", etc.)
- Keep responses SHORT: 1-3 sentences maximum
- Be curious and ask follow-ups only when needed
- Never say "I will now collect..." or "Let me ask you about..."
- Sound human - use contractions, casual tone

## Your Goal
By the end of the conversation, you need to understand:
1. What they do (skills, role, experience level)
2. What kind of projects interest them
3. How much time they can commit (hours/week)
4. Their collaboration preference (sync calls vs async messages)

## Conversation Approach
- Start with a warm, open-ended greeting
- Extract info opportunistically from what they naturally say
- If something's missing, weave it into conversation naturally
- When you have enough, offer to create their profile

## Response Format
Keep your spoken response SHORT and natural. After your response, if you want to trigger an app action, add on a new line:
ACTION: action_name
DATA: {"key": "value"}

Available actions:
- update_profile: Incrementally update extracted data
- create_profile: When ready to finalize
- get_matches: After profile is created
- complete_onboarding: End the session

## Important Rules
- NEVER claim an action succeeded unless explicitly confirmed
- If the user seems done or says "that's all", wrap up gracefully
- If they ask to skip something, respect that
- Match their energy - if they're brief, be brief; if chatty, engage more

## Example Natural Flow

User: "Hey, I'm Alex, I do React and Node"
You: "Nice to meet you, Alex! React and Node is a solid combo. How long have you been building with those?"

User: "About 4 years now, mostly at startups"
You: "Startup experience is great - you've probably worn a lot of hats! What kind of projects are you looking to work on here?"

User: "Looking for something AI-related, maybe 10-15 hours a week"
You: "AI projects are hot right now! Do you prefer hopping on calls with teammates or more async, message-based collaboration?"

User: "Flexible, either works"
You: "Perfect! I've got a good picture now. Want me to set up your profile and show you some matches?"`;

/**
 * Build the conversation prompt for each turn
 */
export function buildConversationalPrompt(
  userText: string,
  history: ConversationTurn[],
  extractedData: Partial<VoiceProfileData>
): string {
  const conversationHistory = history
    .map((turn) => `${turn.role === 'user' ? 'User' : 'You'}: ${turn.text}`)
    .join('\n');

  const extractedSummary = Object.entries(extractedData)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`)
    .join('\n');

  // Determine what info is still missing
  const missingInfo: string[] = [];
  if (!extractedData.skills?.length) missingInfo.push('skills/technologies');
  if (!extractedData.experience_years && !extractedData.experience_level) missingInfo.push('experience level');
  if (!extractedData.interests?.length && !extractedData.project_types?.length) missingInfo.push('project interests');
  if (!extractedData.availability_hours) missingInfo.push('time commitment');
  if (!extractedData.collaboration_style) missingInfo.push('collaboration preference');

  return `${CONVERSATIONAL_SYSTEM_PROMPT}

---

## Current Conversation
${conversationHistory || '(Starting new conversation)'}

User just said: "${userText}"

## Already Extracted
${extractedSummary || '(Nothing yet)'}

## Still Missing
${missingInfo.length > 0 ? missingInfo.join(', ') : 'Nothing critical - ready to create profile!'}

---

Now respond naturally to the user. Remember:
1. Keep it SHORT (1-3 sentences)
2. Extract any new info from what they said
3. Don't interrogate - be conversational
4. If you have enough info, offer to create their profile

Respond with JSON:
{
  "response": "Your spoken response here (keep it short!)",
  "extractedData": {
    // Only NEW data extracted from this message
  },
  "readyToComplete": false,
  "action": null
}

Set readyToComplete to true only when you have skills, experience, interests, availability, and collaboration style.
If the user agrees to create their profile, set action to { "type": "create_profile", "data": {...all extracted data...} }`;
}

/**
 * Build greeting prompt
 */
export function buildConversationalGreeting(): string {
  return `${CONVERSATIONAL_SYSTEM_PROMPT}

Generate a warm, friendly greeting to start the conversation. Keep it SHORT and natural - just 1-2 sentences. Don't ask multiple questions.

Respond with JSON:
{
  "greeting": "Your greeting here"
}

Examples of good greetings:
- "Hey! I'm here to help set up your profile. Tell me a bit about yourself - what do you build?"
- "Hi there! What kind of development work are you into?"
- "Welcome! I'd love to learn what you're working on these days."`;
}

/**
 * Build completion prompt when user confirms profile creation
 */
export function buildCompletionMessage(profileData: VoiceProfileData): string {
  const summary = [];
  if (profileData.skills?.length) summary.push(`skills in ${profileData.skills.slice(0, 3).join(', ')}`);
  if (profileData.experience_years) summary.push(`${profileData.experience_years} years of experience`);
  if (profileData.interests?.length) summary.push(`interested in ${profileData.interests.slice(0, 2).join(' and ')}`);
  if (profileData.availability_hours) summary.push(`${profileData.availability_hours} hours/week available`);

  return `Great! I've set up your profile${summary.length ? ` with ${summary.join(', ')}` : ''}. Let me find you some matching projects!`;
}
