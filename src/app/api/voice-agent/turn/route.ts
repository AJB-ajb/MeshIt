/**
 * POST /api/voice-agent/turn
 * Process a user voice input turn in the conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { processVoiceTurn } from '@/lib/ai/voice-agent';
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
        {
          error: 'Invalid audio file',
          details: validation,
        },
        { status: 400 }
      );
    }

    // Transcribe user audio
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const transcription = await transcribe(buffer);

    console.log(`User said: "${transcription.text}"`);

    // Process turn with voice agent
    const response = await processVoiceTurn(sessionId, transcription.text);

    // Synthesize agent response
    const audio = await synthesizeSpeechBase64(response.nextQuestion);

    return NextResponse.json({
      success: true,
      transcription: transcription.text,
      extractedData: response.extractedData,
      nextQuestion: response.nextQuestion,
      audio,
      completed: response.completed,
      state: response.state,
      confidence: transcription.confidence,
    });
  } catch (error) {
    console.error('Voice agent turn error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process turn',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
