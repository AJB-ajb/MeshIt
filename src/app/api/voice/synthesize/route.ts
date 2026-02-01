/**
 * POST /api/voice/synthesize
 * Synthesize speech from text using TTS service
 */

import { NextRequest, NextResponse } from 'next/server';
import { synthesizeSpeech } from '@/lib/voice/tts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice, model, stability, similarityBoost } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    // Synthesize speech
    const audioBuffer = await synthesizeSpeech(text, {
      voice,
      model,
      stability,
      similarityBoost,
    });

    // Convert to base64 for JSON response
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      audio: `data:audio/mpeg;base64,${base64Audio}`,
      text,
      provider: 'elevenlabs',
    });
  } catch (error) {
    console.error('Synthesis API error:', error);
    return NextResponse.json(
      {
        error: 'Speech synthesis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Alternative: Stream audio response
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');

    if (!text) {
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      );
    }

    const audioBuffer = await synthesizeSpeech(text);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Synthesis streaming error:', error);
    return NextResponse.json(
      {
        error: 'Speech synthesis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
