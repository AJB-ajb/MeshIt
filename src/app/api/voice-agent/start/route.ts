/**
 * POST /api/voice-agent/start
 * Start a new voice onboarding conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { startVoiceConversation } from '@/lib/ai/voice-agent';
import { synthesizeSpeechBase64 } from '@/lib/voice/tts';

export async function POST(request: NextRequest) {
  try {
    console.log('📞 Starting voice conversation...');
    const body = await request.json();
    const { userId } = body;

    // Validate environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    // Start conversation
    console.log('🤖 Initializing conversation session...');
    const session = await startVoiceConversation(userId);

    // Get the greeting from history
    const greeting = session.history[0].text;
    console.log(`💬 Greeting: "${greeting}"`);

    // Synthesize greeting audio
    console.log('🔊 Synthesizing greeting audio...');
    const audio = await synthesizeSpeechBase64(greeting);
    console.log('✅ Audio synthesis complete');

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      greeting,
      audio,
      state: session.state,
    });
  } catch (error) {
    console.error('❌ Voice agent start error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      {
        error: 'Failed to start conversation',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.stack : undefined)
          : undefined,
      },
      { status: 500 }
    );
  }
}
