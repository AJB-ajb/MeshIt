/**
 * Voice Agent API Tests
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

// Set required env vars before importing route handlers
beforeAll(() => {
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.ELEVENLABS_API_KEY = 'test-elevenlabs-key';
});

// Mock voice agent service
vi.mock('@/lib/ai/voice-agent', () => ({
  startVoiceConversation: vi.fn(async () => ({
    sessionId: 'test-session-123',
    userId: undefined,
    state: 'greeting',
    history: [
      {
        role: 'agent',
        text: 'Hi! What technologies do you work with?',
        timestamp: new Date(),
      },
    ],
    extractedData: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  processVoiceTurn: vi.fn(async () => ({
    transcription: 'I work with React',
    extractedData: { skills: ['React'] },
    nextQuestion: 'How many years of experience?',
    completed: false,
    state: 'experience',
  })),
  completeVoiceOnboarding: vi.fn(async () => ({
    skills: ['React', 'TypeScript'],
    experience_years: 5,
    role: 'full-stack',
    interests: ['AI'],
    availability_hours: 15,
    collaboration_style: 'flexible',
  })),
}));

vi.mock('@/lib/voice/tts', () => ({
  synthesizeSpeechBase64: vi.fn(async () => 'data:audio/mpeg;base64,fakeaudio'),
}));

vi.mock('@/lib/voice/stt', () => ({
  transcribe: vi.fn(async () => ({
    provider: 'deepgram',
    text: 'I work with React',
    duration_ms: 200,
    confidence: 0.95,
    language: 'en-US',
  })),
}));

vi.mock('@/lib/voice/utils', () => ({
  validateAudioBlob: vi.fn(() => ({
    valid: true,
    format: 'audio/webm',
    size_mb: '1.00',
    supported: true,
    sizeOk: true,
  })),
}));

describe('POST /api/voice-agent/start', () => {
  it('should start a new conversation', async () => {
    const { POST } = await import('../start/route');

    const request = new Request('http://localhost/api/voice-agent/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sessionId).toBe('test-session-123');
    expect(data.greeting).toContain('technologies');
    expect(data.audio).toContain('data:audio/mpeg;base64');
  });

  it('should accept userId parameter', async () => {
    const { POST } = await import('../start/route');

    const request = new Request('http://localhost/api/voice-agent/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user123' }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(200);
  });
});

describe('POST /api/voice-agent/turn', () => {
  it('should return 400 if sessionId missing', async () => {
    const { POST } = await import('../turn/route');

    const formData = new FormData();
    const audioBlob = new Blob(['test'], { type: 'audio/webm' });
    formData.append('audio', audioBlob);

    const request = new Request('http://localhost/api/voice-agent/turn', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Session ID');
  });

  it('should return 400 if audio missing', async () => {
    const { POST } = await import('../turn/route');

    const formData = new FormData();
    formData.append('sessionId', 'test-123');

    const request = new Request('http://localhost/api/voice-agent/turn', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Audio');
  });

  it('should process voice turn successfully', async () => {
    const { POST } = await import('../turn/route');

    const formData = new FormData();
    formData.append('sessionId', 'test-123');
    const audioBlob = new Blob(['test audio'], { type: 'audio/webm' });
    const file = new File([audioBlob], 'test.webm', { type: 'audio/webm' });
    formData.append('audio', file);

    const request = new Request('http://localhost/api/voice-agent/turn', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.transcription).toBeTruthy();
    expect(data.nextQuestion).toBeTruthy();
    expect(data.audio).toContain('data:audio/mpeg;base64');
  });
});

describe('POST /api/voice-agent/complete', () => {
  it('should return 400 if sessionId missing', async () => {
    const { POST } = await import('../complete/route');

    const request = new Request('http://localhost/api/voice-agent/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Session ID');
  });

  it('should complete onboarding and return profile', async () => {
    const { POST } = await import('../complete/route');

    const request = new Request('http://localhost/api/voice-agent/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-123' }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.profile).toBeTruthy();
    expect(data.profile.skills).toBeDefined();
  });
});
