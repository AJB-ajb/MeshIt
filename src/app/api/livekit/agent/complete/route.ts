/**
 * LiveKit Agent Complete API
 * Finalizes voice agent session and returns profile data
 */

import { NextRequest, NextResponse } from 'next/server';
import { completeLiveKitAgentSession } from '@/lib/voice/livekit-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName } = body;

    if (!roomName) {
      return NextResponse.json(
        { error: 'Missing roomName' },
        { status: 400 }
      );
    }

    console.log(`✅ Completing LiveKit agent session for room: ${roomName}`);

    const { profile, conversationHistory } =
      completeLiveKitAgentSession(roomName);

    return NextResponse.json({
      profile,
      conversationHistory,
      summary: 'Your profile has been created successfully!',
    });
  } catch (error) {
    console.error('❌ Error completing LiveKit agent session:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
