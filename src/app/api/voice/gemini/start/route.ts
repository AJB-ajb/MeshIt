/**
 * Gemini Voice API - Start Conversation
 * POST /api/voice/gemini/start
 */

import { NextRequest, NextResponse } from 'next/server';
import { startGeminiVoiceConversation } from '@/lib/ai/gemini-voice-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    console.log('🎙️ Starting Gemini voice conversation...');

    const result = await startGeminiVoiceConversation(userId);

    // Convert audio ArrayBuffer to base64
    const audioBase64 = Buffer.from(result.audio).toString('base64');

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      greeting: result.greeting,
      audio: audioBase64,
    });
  } catch (error) {
    console.error('❌ Failed to start Gemini conversation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start conversation',
      },
      { status: 500 }
    );
  }
}
