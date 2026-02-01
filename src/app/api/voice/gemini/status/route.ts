/**
 * Gemini Voice API - Session Status
 * GET /api/voice/gemini/status?sessionId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiSessionStatus } from '@/lib/ai/gemini-voice-agent';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    const status = getGeminiSessionStatus(sessionId);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error('❌ Failed to get Gemini session status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get status',
      },
      { status: 500 }
    );
  }
}
