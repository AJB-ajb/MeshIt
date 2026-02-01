/**
 * POST /api/voice/conversational/turn
 * Process a turn in the conversational voice session
 */

import { NextRequest, NextResponse } from 'next/server';
import { processConversationalTurn } from '@/lib/ai/conversational-voice-agent';
import { transcribe } from '@/lib/voice/stt';
import { synthesizeSpeechBase64 } from '@/lib/voice/tts';
import { validateAudioBlob } from '@/lib/voice/utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    const audioFile = formData.get('audio') as File;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Validate audio
    const validation = validateAudioBlob(audioFile);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid audio file', details: validation },
        { status: 400 }
      );
    }

    console.log(`🎙️ Processing turn for session ${sessionId}...`);

    // Transcribe user audio
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const transcription = await transcribe(buffer);

    console.log(`📝 User said: "${transcription.text}"`);

    // Process turn with conversational agent
    const result = await processConversationalTurn(sessionId, transcription.text);

    // Synthesize agent response
    console.log(`🔊 Synthesizing response: "${result.text}"`);
    const audio = await synthesizeSpeechBase64(result.text);

    return NextResponse.json({
      success: true,
      transcription: transcription.text,
      response: result.text,
      extractedData: result.extractedData,
      isComplete: result.isComplete,
      action: result.action,
      audio,
    });

  } catch (error) {
    console.error('❌ Voice turn error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process turn',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
