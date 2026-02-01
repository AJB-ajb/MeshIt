/**
 * Text-to-Speech Service
 * ElevenLabs integration for natural voice synthesis
 */

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import type { TTSOptions } from './types';

// Configuration
const CONFIG = {
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  DEFAULT_VOICE_ID: '21m00Tcm4TlvDq8ikWAM', // Rachel - Natural, friendly voice
  DEFAULT_VOICE_NAME: 'Rachel',
  DEFAULT_MODEL: 'eleven_turbo_v2', // Fastest model
};

// Initialize ElevenLabs client
const elevenlabs = CONFIG.ELEVENLABS_API_KEY
  ? new ElevenLabsClient({ apiKey: CONFIG.ELEVENLABS_API_KEY })
  : null;

/**
 * Synthesize speech from text using ElevenLabs
 */
export async function synthesizeSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<ArrayBuffer> {
  if (!elevenlabs) {
    throw new Error('ElevenLabs API key not configured');
  }

  try {
    console.log('🔊 Synthesizing speech with ElevenLabs...');
    console.log(`   Voice ID: ${options.voice || CONFIG.DEFAULT_VOICE_ID}`);
    console.log(`   Model: ${options.model || CONFIG.DEFAULT_MODEL}`);
    const startTime = Date.now();

    const audioStream = await elevenlabs.textToSpeech.convert(
      options.voice || CONFIG.DEFAULT_VOICE_ID,
      {
        text: text,
        modelId: options.model || CONFIG.DEFAULT_MODEL,
        voiceSettings: {
          stability: options.stability ?? 0.5,
          similarityBoost: options.similarityBoost ?? 0.75,
        },
      }
    );

    // Convert ReadableStream to ArrayBuffer
    const chunks: Uint8Array[] = [];
    const reader = audioStream.getReader();
    
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Speech synthesis complete (${duration}ms)`);

    return result.buffer;
  } catch (error) {
    console.error('❌ ElevenLabs synthesis failed:', error);
    throw new Error(`TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Synthesize speech and return as base64 encoded string
 */
export async function synthesizeSpeechBase64(
  text: string,
  options: TTSOptions = {}
): Promise<string> {
  const audioBuffer = await synthesizeSpeech(text, options);
  const uint8Array = new Uint8Array(audioBuffer);
  const base64 = Buffer.from(uint8Array).toString('base64');
  return `data:audio/mpeg;base64,${base64}`;
}

/**
 * Synthesize speech and return as Blob
 */
export async function synthesizeSpeechBlob(
  text: string,
  options: TTSOptions = {}
): Promise<Blob> {
  const audioBuffer = await synthesizeSpeech(text, options);
  return new Blob([audioBuffer], { type: 'audio/mpeg' });
}

/**
 * Stream speech synthesis (for real-time playback)
 */
export async function* synthesizeSpeechStream(
  text: string,
  options: TTSOptions = {}
): AsyncGenerator<Uint8Array> {
  if (!elevenlabs) {
    throw new Error('ElevenLabs API key not configured');
  }

  try {
    console.log('🔊 Starting speech synthesis stream...');

    const audioStream = await elevenlabs.textToSpeech.convert(
      options.voice || CONFIG.DEFAULT_VOICE_ID,
      {
        text: text,
        modelId: options.model || CONFIG.DEFAULT_MODEL,
        voiceSettings: {
          stability: options.stability ?? 0.5,
          similarityBoost: options.similarityBoost ?? 0.75,
        },
      }
    );

    const reader = audioStream.getReader();
    
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) yield value;
      }
    } finally {
      reader.releaseLock();
    }

    console.log('✅ Speech synthesis stream complete');
  } catch (error) {
    console.error('❌ ElevenLabs streaming failed:', error);
    throw new Error(`TTS streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get available voices from ElevenLabs
 */
export async function getAvailableVoices() {
  if (!elevenlabs) {
    throw new Error('ElevenLabs API key not configured');
  }

  try {
    const response = await elevenlabs.voices.getAll();
    return response.voices.map((voice) => ({
      id: voice.voiceId,
      name: voice.name,
      category: voice.category,
      description: voice.description,
    }));
  } catch (error) {
    console.error('❌ Failed to fetch voices:', error);
    throw error;
  }
}

/**
 * Estimate TTS cost
 */
export function estimateTTSCost(characterCount: number): {
  characters: number;
  cost_usd: string;
  rate_per_1k_chars: number;
} {
  const RATE_PER_1K = 0.30; // $0.30 per 1K characters (turbo model)
  const cost = (characterCount / 1000) * RATE_PER_1K;

  return {
    characters: characterCount,
    cost_usd: cost.toFixed(4),
    rate_per_1k_chars: RATE_PER_1K,
  };
}

export { CONFIG };
