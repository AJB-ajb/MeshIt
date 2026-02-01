/**
 * POST /api/voice/transcribe
 * Transcribe audio file to text using STT service
 */

import { NextRequest, NextResponse } from 'next/server';
import { transcribe } from '@/lib/voice/stt';
import { validateAudioBlob } from '@/lib/voice/utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const provider = formData.get('provider') as 'whisper' | 'deepgram' | undefined;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate audio file
    const validation = validateAudioBlob(audioFile);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid audio file',
          details: {
            supported: validation.supported,
            sizeOk: validation.sizeOk,
            format: validation.format,
            size_mb: validation.size_mb,
          },
        },
        { status: 400 }
      );
    }

    // Convert to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe
    const result = await transcribe(buffer, { provider });

    return NextResponse.json({
      success: true,
      text: result.text,
      confidence: result.confidence,
      provider: result.provider,
      duration_ms: result.duration_ms,
      words: result.words,
    });
  } catch (error) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      {
        error: 'Transcription failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
