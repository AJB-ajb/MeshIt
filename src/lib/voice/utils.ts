/**
 * Voice Service Utilities
 * Audio validation, cost estimation, and helper functions
 */

import type { AudioValidation, CostEstimate } from './types';

/**
 * Validate audio file format and size
 */
export function validateAudioFile(filePath: string, fileSize?: number): AudioValidation {
  const supportedFormats = ['.mp3', '.mp4', '.wav', '.webm', '.m4a', '.flac', '.opus'];
  const maxSizeMB = 25; // Most APIs limit to 25MB

  const ext = filePath.toLowerCase().slice(filePath.lastIndexOf('.'));
  const sizeMB = fileSize ? fileSize / (1024 * 1024) : 0;

  return {
    valid: supportedFormats.includes(ext) && (fileSize ? sizeMB <= maxSizeMB : true),
    format: ext,
    size_mb: sizeMB.toFixed(2),
    supported: supportedFormats.includes(ext),
    sizeOk: fileSize ? sizeMB <= maxSizeMB : true,
  };
}

/**
 * Validate audio blob
 */
export function validateAudioBlob(blob: Blob): AudioValidation {
  const supportedTypes = [
    'audio/mp3',
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/m4a',
    'audio/flac',
    'audio/opus',
  ];
  const maxSizeMB = 25;

  const sizeMB = blob.size / (1024 * 1024);
  const supported = supportedTypes.includes(blob.type);

  return {
    valid: supported && sizeMB <= maxSizeMB,
    format: blob.type,
    size_mb: sizeMB.toFixed(2),
    supported,
    sizeOk: sizeMB <= maxSizeMB,
  };
}

/**
 * Get estimated cost for transcription
 */
export function estimateCost(
  durationSeconds: number,
  provider: 'whisper' | 'deepgram' = 'deepgram'
): CostEstimate {
  const costs = {
    whisper: { perMinute: 0.006, name: 'OpenAI Whisper' },
    deepgram: { perMinute: 0.0043, name: 'Deepgram Nova-2' },
  };

  const config = costs[provider];
  const minutes = durationSeconds / 60;
  const cost = minutes * config.perMinute;

  return {
    provider: config.name,
    duration_seconds: durationSeconds,
    duration_minutes: minutes.toFixed(2),
    cost_usd: cost.toFixed(4),
    rate_per_minute: config.perMinute,
  };
}

/**
 * Convert audio blob to base64
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remove data:audio/...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert base64 to blob
 */
export function base64ToBlob(base64: string, mimeType: string = 'audio/mpeg'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get audio duration from blob
 */
export async function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(blob);
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(audio.src);
      resolve(audio.duration);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(audio.src);
      reject(new Error('Failed to load audio'));
    });
  });
}
