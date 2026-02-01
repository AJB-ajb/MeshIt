#!/usr/bin/env tsx
/**
 * Create ElevenLabs Conversational AI Agent
 * Run this script to create the agent and get the agent ID
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function createAgent() {
  console.log('🎙️  Creating ElevenLabs Conversational AI Agent...\n');

  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ELEVENLABS_API_KEY not found in .env file');
    process.exit(1);
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_config: {
          agent: {
            prompt: {
              prompt: `You are a friendly and enthusiastic onboarding assistant for MeshIt, a platform that connects developers for collaborative projects.

Your goal is to have a natural, conversational chat with the user to learn about their:
1. Technical skills and expertise
2. Years of experience
3. Interests and project preferences
4. Weekly availability (hours per week)
5. Collaboration style (sync, async, or flexible)

Guidelines:
- Be warm, friendly, and encouraging
- Ask one question at a time naturally
- Listen actively and acknowledge their responses
- Use follow-up questions to clarify or get more details
- When you have enough information about a topic, smoothly transition to the next
- Call the extract_profile_data function as you gather information
- Keep the conversation flowing naturally - don't make it feel like a form

Example flow:
"Hi! I'm excited to help you get started on MeshIt. Let's chat about what you're working with - what technologies or programming languages do you enjoy using?"

After they respond about skills, you might say:
"That's awesome! [acknowledge their skills]. How long have you been working with [their main skill]?"

Continue naturally through all topics, then wrap up with:
"Perfect! I have everything I need. You're all set to start finding amazing project collaborators on MeshIt!"`,
              tools: [
                {
                  type: 'client',
                  name: 'extract_profile_data',
                  description: 'Extract and store user profile information from the conversation. Call this function as you gather information about the user.',
                  parameters: {
                    type: 'object',
                    properties: {
                      skills: {
                        type: 'array',
                        items: { 
                          type: 'string',
                          description: 'A technical skill'
                        },
                        description: 'Array of technical skills, programming languages, frameworks, or tools the user mentioned',
                      },
                      experience_years: {
                        type: 'number',
                        description: 'Number of years of professional or serious development experience',
                      },
                      interests: {
                        type: 'array',
                        items: { 
                          type: 'string',
                          description: 'An area of interest'
                        },
                        description: 'Array of project types, domains, or areas of interest the user mentioned',
                      },
                      availability_hours: {
                        type: 'number',
                        description: 'Number of hours per week the user can commit to projects',
                      },
                      collaboration_style: {
                        type: 'string',
                        enum: ['sync', 'async', 'flexible'],
                        description: 'Preferred collaboration style: sync (real-time), async (asynchronous), or flexible (either)',
                      },
                    },
                  },
                },
              ],
            },
            first_message: 'Hi! I\'m excited to help you get started on MeshIt. Let\'s chat about what you\'re working with - what technologies or programming languages do you enjoy using?',
            language: 'en',
          },
          tts: {
            voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
            model_id: 'eleven_turbo_v2',
          },
        },
        platform_settings: {
          widget: {
            avatar: {
              type: 'orb',
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();

    console.log('✅ Agent created successfully!\n');
    console.log('📋 Agent Details:');
    console.log(`   ID: ${data.agent_id}`);
    console.log(`   Name: MeshIt Onboarding Agent`);
    console.log(`   Voice: Rachel (eleven_turbo_v2)`);
    console.log(`   Language: English\n`);
    console.log('📝 Next Steps:');
    console.log('   1. Copy the agent ID above');
    console.log('   2. Add it to your .env file:');
    console.log(`      ELEVENLABS_AGENT_ID=${data.agent_id}`);
    console.log('   3. Restart your dev server\n');
    console.log('🔗 Test your agent at:');
    console.log(`   https://elevenlabs.io/app/conversational-ai/${data.agent_id}\n`);

    return data.agent_id;
  } catch (error) {
    console.error('❌ Error creating agent:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

// Run the script
createAgent();
