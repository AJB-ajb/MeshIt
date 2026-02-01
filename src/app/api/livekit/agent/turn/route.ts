/**
 * LiveKit Agent Turn API
 * Processes voice input from users in a LiveKit room
 */

import { NextRequest, NextResponse } from 'next/server';
import { processAgentTurn } from '@/lib/voice/livekit-agent';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const roomName = formData.get('roomName') as string;
    const audioFile = formData.get('audio') as File;

    if (!roomName || !audioFile) {
      return NextResponse.json(
        { error: 'Missing roomName or audio' },
        { status: 400 }
      );
    }

    console.log(`🎙️ Processing voice turn for room: ${roomName}`);

    // Convert audio file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process the turn
    const result = await processAgentTurn(roomName, buffer);

    // Convert audio response to base64
    const audioBase64 = result.audioResponse.toString('base64');

    return NextResponse.json({
      transcription: result.transcription,
      response: result.response,
      audio: audioBase64,
      extractedData: result.extractedData,
      completed: result.isComplete,
    });
  } catch (error) {
    console.error('❌ Error processing agent turn:', error);
    return NextResponse.json(
      {
        error: 'Failed to process turn',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
