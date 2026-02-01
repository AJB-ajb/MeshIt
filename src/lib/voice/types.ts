/**
 * Voice Service Types
 * Shared types for STT, TTS, and Voice Agent services
 */

// STT Types
export interface TranscriptionResult {
  provider: 'whisper' | 'deepgram';
  text: string;
  duration_ms: number;
  confidence: number | null;
  language: string;
  words?: WordTimestamp[];
  raw?: unknown;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface STTOptions {
  provider?: 'whisper' | 'deepgram';
  language?: string;
  format?: string;
  temperature?: number;
  prompt?: string;
  paragraphs?: boolean;
  utterances?: boolean;
  diarize?: boolean;
}

export interface RealtimeTranscript {
  text: string;
  isFinal: boolean;
  confidence: number;
  speechFinal: boolean;
  words: WordTimestamp[];
}

export type TranscriptCallback = (transcript: RealtimeTranscript) => void;

export interface STTConnection {
  send: (audioChunk: Buffer) => void;
  close: () => void;
  connection: unknown;
}

// TTS Types
export interface TTSOptions {
  voice?: string;
  model?: string;
  speed?: number;
  stability?: number;
  similarityBoost?: number;
}

export interface TTSResult {
  audio: ArrayBuffer;
  provider: 'elevenlabs' | 'hume';
  duration_ms: number;
}

// Voice Agent Types
export interface ConversationSession {
  sessionId: string;
  userId?: string;
  state: ConversationState;
  history: ConversationTurn[];
  extractedData: Partial<ProfileData>;
  createdAt: Date;
  updatedAt: Date;
}

export type ConversationState =
  | 'greeting'
  | 'skills'
  | 'experience'
  | 'availability'
  | 'interests'
  | 'collaboration'
  | 'complete';

export interface ConversationTurn {
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface AgentResponse {
  transcription?: string;
  extractedData: Partial<ProfileData>;
  nextQuestion: string;
  audio?: string; // base64 encoded audio
  completed: boolean;
  state: ConversationState;
}

export interface ProfileData {
  skills: string[];
  experience_years: number;
  interests: string[];
  availability_hours: number | string;
  role: string;
  collaboration_style: string;
  bio?: string;
}

// Audio Validation
export interface AudioValidation {
  valid: boolean;
  format: string;
  size_mb: string;
  supported: boolean;
  sizeOk: boolean;
}

// Cost Estimation
export interface CostEstimate {
  provider: string;
  duration_seconds: number;
  duration_minutes: string;
  cost_usd: string;
  rate_per_minute: number;
}
