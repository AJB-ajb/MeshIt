/**
 * Gemini Voice API - Process Turn
 * POST /api/voice/gemini/turn
 */

import { NextRequest, NextResponse } from 'next/server';
import { processGeminiVoiceTurn } from '@/lib/ai/gemini-voice-agent';
import { transcribe } from '@/lib/voice/stt';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    const audioBlob = formData.get('audio') as Blob;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    if (!audioBlob) {
      return NextResponse.json(
        { success: false, error: 'Audio required' },
        { status: 400 }
      );
    }

    console.log(`🎙️ Processing turn for Gemini session: ${sessionId}`);

    // Transcribe audio
    const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());
    const transcription = await transcribe(audioBuffer);

    console.log(`📝 Transcription: "${transcription.text}"`);

    // Process with Gemini
    const response = await processGeminiVoiceTurn(sessionId, transcription.text);

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error('❌ Failed to process Gemini turn:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process turn',
      },
      { status: 500 }
    );
  }
}
