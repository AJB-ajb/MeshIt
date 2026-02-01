/**
 * Speech-to-Text Service
 * Supports OpenAI Whisper and Deepgram Nova-2 with auto-fallback
 */

import OpenAI from 'openai';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import type {
  TranscriptionResult,
  STTOptions,
  TranscriptCallback,
  STTConnection,
  RealtimeTranscript,
} from './types';

// Configuration
const CONFIG = {
  PRIMARY_STT: (process.env.PRIMARY_STT_PROVIDER as 'whisper' | 'deepgram') || 'deepgram',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
  
  WHISPER: {
    model: 'whisper-1' as const,
    language: 'en',
    response_format: 'json' as const,
    temperature: 0.2,
  },
  
  DEEPGRAM: {
    model: 'nova-2' as const,
    language: 'en-US',
    smart_format: true,
    punctuate: true,
    paragraphs: false,
    utterances: false,
    diarize: false,
  },
};

// Initialize clients
const openai = CONFIG.OPENAI_API_KEY
  ? new OpenAI({ apiKey: CONFIG.OPENAI_API_KEY })
  : null;

const deepgram = CONFIG.DEEPGRAM_API_KEY
  ? createClient(CONFIG.DEEPGRAM_API_KEY)
  : null;

/**
 * Transcribe audio using OpenAI Whisper
 */
export async function transcribeWithWhisper(
  audioFile: Buffer | File,
  options: STTOptions = {}
): Promise<TranscriptionResult> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    console.log('🎤 Transcribing with OpenAI Whisper...');
    const startTime = Date.now();

    // OpenAI expects File or Blob
    const file = audioFile instanceof File 
      ? audioFile 
      : new File([new Uint8Array(audioFile)], 'audio.wav', { type: 'audio/wav' });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: CONFIG.WHISPER.model,
      language: options.language || CONFIG.WHISPER.language,
      response_format: (options.format as 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt') || CONFIG.WHISPER.response_format,
      temperature: options.temperature || CONFIG.WHISPER.temperature,
      prompt: options.prompt,
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Whisper transcription complete (${duration}ms)`);

    return {
      provider: 'whisper',
      text: transcription.text,
      duration_ms: duration,
      confidence: null,
      language: CONFIG.WHISPER.language,
      raw: transcription,
    };
  } catch (error) {
    console.error('❌ Whisper transcription failed:', error);
    throw new Error(`Whisper STT failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Transcribe audio using Deepgram Nova-2
 */
export async function transcribeWithDeepgram(
  audioSource: Buffer | string,
  options: STTOptions = {}
): Promise<TranscriptionResult> {
  if (!deepgram) {
    throw new Error('Deepgram API key not configured');
  }

  try {
    console.log('🎤 Transcribing with Deepgram Nova-2...');
    const startTime = Date.now();

    let response;

    if (typeof audioSource === 'string' && audioSource.startsWith('http')) {
      // URL-based transcription
      const { result } = await deepgram.listen.prerecorded.transcribeUrl(
        { url: audioSource },
        {
          model: CONFIG.DEEPGRAM.model,
          language: options.language || CONFIG.DEEPGRAM.language,
          smart_format: CONFIG.DEEPGRAM.smart_format,
          punctuate: CONFIG.DEEPGRAM.punctuate,
          paragraphs: options.paragraphs ?? CONFIG.DEEPGRAM.paragraphs,
          utterances: options.utterances ?? CONFIG.DEEPGRAM.utterances,
          diarize: options.diarize ?? CONFIG.DEEPGRAM.diarize,
        }
      );
      response = result;
    } else {
      // Buffer-based transcription
      const audioBuffer = audioSource instanceof Buffer ? audioSource : Buffer.from(audioSource);

      const { result } = await deepgram.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          model: CONFIG.DEEPGRAM.model,
          language: options.language || CONFIG.DEEPGRAM.language,
          smart_format: CONFIG.DEEPGRAM.smart_format,
          punctuate: CONFIG.DEEPGRAM.punctuate,
          paragraphs: options.paragraphs ?? CONFIG.DEEPGRAM.paragraphs,
          utterances: options.utterances ?? CONFIG.DEEPGRAM.utterances,
          diarize: options.diarize ?? CONFIG.DEEPGRAM.diarize,
        }
      );
      response = result;
    }

    const duration = Date.now() - startTime;
    
    if (!response) {
      throw new Error('No response from Deepgram');
    }
    
    const transcript = response.results.channels[0].alternatives[0];

    console.log(`✅ Deepgram transcription complete (${duration}ms)`);
    console.log(`   Confidence: ${(transcript.confidence * 100).toFixed(1)}%`);

    return {
      provider: 'deepgram',
      text: transcript.transcript,
      duration_ms: duration,
      confidence: transcript.confidence,
      language: CONFIG.DEEPGRAM.language,
      words: transcript.words?.map((w: { word: string; start: number; end: number; confidence: number }) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
      })),
      raw: response,
    };
  } catch (error) {
    console.error('❌ Deepgram transcription failed:', error);
    throw new Error(`Deepgram STT failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Universal transcribe function with auto-fallback
 */
export async function transcribe(
  audioSource: Buffer | string | File,
  options: STTOptions = {}
): Promise<TranscriptionResult> {
  const provider = options.provider || CONFIG.PRIMARY_STT;

  try {
    if (provider === 'whisper') {
      if (typeof audioSource === 'string' && audioSource.startsWith('http')) {
        throw new Error('Whisper does not support URL transcription, use Deepgram');
      }
      return await transcribeWithWhisper(audioSource as Buffer | File, options);
    } else if (provider === 'deepgram') {
      return await transcribeWithDeepgram(
        audioSource instanceof File ? await audioSource.arrayBuffer().then(Buffer.from) : audioSource,
        options
      );
    } else {
      throw new Error(`Unknown STT provider: ${provider}`);
    }
  } catch (error) {
    console.error(`⚠️ Primary provider (${provider}) failed, trying fallback...`);

    // Fallback to alternative provider
    if (provider === 'whisper' && CONFIG.DEEPGRAM_API_KEY) {
      console.log('🔄 Falling back to Deepgram...');
      return await transcribeWithDeepgram(
        audioSource instanceof File ? await audioSource.arrayBuffer().then(Buffer.from) : audioSource,
        options
      );
    } else if (provider === 'deepgram' && CONFIG.OPENAI_API_KEY) {
      console.log('🔄 Falling back to Whisper...');
      if (typeof audioSource === 'string' && audioSource.startsWith('http')) {
        throw new Error('Cannot fallback to Whisper for URL transcription');
      }
      return await transcribeWithWhisper(audioSource as Buffer | File, options);
    }

    throw error;
  }
}

/**
 * Create real-time Deepgram WebSocket connection for streaming audio
 */
export async function createRealtimeSTT(
  onTranscript: TranscriptCallback,
  options: STTOptions = {}
): Promise<STTConnection> {
  if (!deepgram) {
    throw new Error('Deepgram API key not configured for real-time STT');
  }

  try {
    console.log('🔴 Starting real-time Deepgram connection...');

    const connection = deepgram.listen.live({
      model: CONFIG.DEEPGRAM.model,
      language: options.language || CONFIG.DEEPGRAM.language,
      smart_format: CONFIG.DEEPGRAM.smart_format,
      punctuate: CONFIG.DEEPGRAM.punctuate,
      interim_results: true,
      endpointing: 300,
      utterance_end_ms: 1000,
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript = data.channel?.alternatives?.[0];

      if (transcript && transcript.transcript) {
        const result: RealtimeTranscript = {
          text: transcript.transcript,
          isFinal: data.is_final ?? false,
          confidence: transcript.confidence,
          speechFinal: data.speech_final ?? false,
          words: transcript.words?.map((w: { word: string; start: number; end: number; confidence: number }) => ({
            word: w.word,
            start: w.start,
            end: w.end,
            confidence: w.confidence,
          })) || [],
        };

        onTranscript(result);
      }
    });

    connection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error('❌ Deepgram real-time error:', error);
    });

    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log('🔴 Deepgram connection closed');
    });

    console.log('✅ Real-time STT connection established');

    return {
      send: (audioChunk: Buffer) => {
        const uint8Array = new Uint8Array(audioChunk);
        connection.send(uint8Array.buffer as ArrayBuffer);
      },
      close: () => connection.finish(),
      connection,
    };
  } catch (error) {
    console.error('❌ Failed to create real-time STT:', error);
    throw error;
  }
}

export { CONFIG };
