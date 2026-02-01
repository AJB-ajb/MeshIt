/**
 * POST /api/voice/conversational/start
 * Start a new conversational voice onboarding session
 */

import { NextRequest, NextResponse } from 'next/server';
import { startConversationalSession } from '@/lib/ai/conversational-voice-agent';
import { synthesizeSpeechBase64 } from '@/lib/voice/tts';

export async function POST(request: NextRequest) {
  try {
    console.log('🎙️ Starting conversational voice session...');
    
    const body = await request.json();
    const { userId } = body;

    // Validate environment
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    // Start session
    const { sessionId, greeting } = await startConversationalSession(userId);

    // Synthesize greeting audio
    console.log('🔊 Synthesizing greeting...');
    const audio = await synthesizeSpeechBase64(greeting);

    return NextResponse.json({
      success: true,
      sessionId,
      greeting,
      audio,
    });

  } catch (error) {
    console.error('❌ Voice session start error:', error);
    return NextResponse.json(
      {
        error: 'Failed to start session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
