/**
 * Gemini Voice API - Complete Conversation
 * POST /api/voice/gemini/complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { completeGeminiVoiceConversation } from '@/lib/ai/gemini-voice-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    console.log(`✅ Completing Gemini conversation: ${sessionId}`);

    const result = await completeGeminiVoiceConversation(sessionId);

    return NextResponse.json({
      success: true,
      profile: result.profile,
      summary: result.summary,
    });
  } catch (error) {
    console.error('❌ Failed to complete Gemini conversation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete conversation',
      },
      { status: 500 }
    );
  }
}
