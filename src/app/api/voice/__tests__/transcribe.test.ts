/**
 * Voice Transcription API Tests
 */

import { describe, it, expect, vi } from 'vitest';

// Mock the STT service
vi.mock('@/lib/voice/stt', () => ({
  transcribe: vi.fn(async () => ({
    provider: 'deepgram',
    text: 'Test transcription',
    duration_ms: 250,
    confidence: 0.95,
    language: 'en-US',
    words: [],
  })),
}));

vi.mock('@/lib/voice/utils', () => ({
  validateAudioBlob: vi.fn(() => ({
    valid: true,
    format: 'audio/webm',
    size_mb: '1.50',
    supported: true,
    sizeOk: true,
  })),
}));

describe('POST /api/voice/transcribe', () => {
  it('should return 400 if no audio file provided', async () => {
    const { POST } = await import('../transcribe/route');
    const formData = new FormData();

    const request = new Request('http://localhost/api/voice/transcribe', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No audio file provided');
  });

  it('should transcribe valid audio file', async () => {
    const { POST } = await import('../transcribe/route');
    
    const audioBlob = new Blob(['fake audio data'], { type: 'audio/webm' });
    const file = new File([audioBlob], 'test.webm', { type: 'audio/webm' });
    
    const formData = new FormData();
    formData.append('audio', file);

    const request = new Request('http://localhost/api/voice/transcribe', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.text).toBe('Test transcription');
    expect(data.provider).toBe('deepgram');
  });

  it('should accept provider parameter', async () => {
    const { POST } = await import('../transcribe/route');
    
    const audioBlob = new Blob(['fake audio data'], { type: 'audio/webm' });
    const file = new File([audioBlob], 'test.webm', { type: 'audio/webm' });
    
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('provider', 'whisper');

    const request = new Request('http://localhost/api/voice/transcribe', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    expect(response.status).toBe(200);
  });
});
