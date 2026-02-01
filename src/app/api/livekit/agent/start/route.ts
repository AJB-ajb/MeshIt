/**
 * LiveKit Agent Start API
 * Initializes a voice agent session for a LiveKit room
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  initializeLiveKitAgentSession,
  generateAgentGreeting,
} from '@/lib/voice/livekit-agent';
import { synthesizeSpeech } from '@/lib/voice/tts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, userId } = body;

    if (!roomName) {
      return NextResponse.json(
        { error: 'Missing roomName' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting LiveKit voice agent for room: ${roomName}`);

    // Initialize agent session
    await initializeLiveKitAgentSession(roomName, userId);

    // Generate greeting
    const greeting = await generateAgentGreeting(roomName);

    // Generate greeting audio
    const greetingAudio = await synthesizeSpeech(greeting);
    const audioBase64 = Buffer.from(greetingAudio).toString('base64');

    console.log(`✅ LiveKit voice agent started for room: ${roomName}`);

    return NextResponse.json({
      roomName,
      greeting,
      audio: audioBase64,
      ready: true,
    });
  } catch (error) {
    console.error('❌ Error starting LiveKit agent:', error);
    return NextResponse.json(
      {
        error: 'Failed to start agent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
