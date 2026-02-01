/**
 * Voice Synthesis API Tests
 */

import { describe, it, expect, vi } from 'vitest';

// Mock the TTS service
vi.mock('@/lib/voice/tts', () => ({
  synthesizeSpeech: vi.fn(async () => {
    const buffer = new ArrayBuffer(1024);
    return buffer;
  }),
}));

describe('POST /api/voice/synthesize', () => {
  it('should return 400 if no text provided', async () => {
    const { POST } = await import('../synthesize/route');

    const request = new Request('http://localhost/api/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Text is required');
  });

  it('should return 400 if text is too long', async () => {
    const { POST } = await import('../synthesize/route');
    const longText = 'a'.repeat(5001);

    const request = new Request('http://localhost/api/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: longText }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('too long');
  });

  it('should synthesize speech from text', async () => {
    const { POST } = await import('../synthesize/route');

    const request = new Request('http://localhost/api/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello world' }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.audio).toContain('data:audio/mpeg;base64,');
    expect(data.provider).toBe('elevenlabs');
  });

  it('should accept voice options', async () => {
    const { POST } = await import('../synthesize/route');

    const request = new Request('http://localhost/api/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello',
        voice: 'Rachel',
        stability: 0.7,
      }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(200);
  });
});

describe('GET /api/voice/synthesize', () => {
  it('should stream audio for GET request', async () => {
    const { GET } = await import('../synthesize/route');

    const request = new Request(
      'http://localhost/api/voice/synthesize?text=Hello',
      { method: 'GET' }
    );

    const response = await GET(request as never);
    expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
  });

  it('should return 400 if text parameter missing', async () => {
    const { GET } = await import('../synthesize/route');

    const request = new Request('http://localhost/api/voice/synthesize', {
      method: 'GET',
    });

    const response = await GET(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });
});
