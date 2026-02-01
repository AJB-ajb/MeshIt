/**
 * GET /api/voice-agent/test
 * Test endpoint to verify API keys and service availability
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    openai: {
      configured: !!process.env.OPENAI_API_KEY,
      keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'not set',
    },
    elevenlabs: {
      configured: !!process.env.ELEVENLABS_API_KEY,
      keyPrefix: process.env.ELEVENLABS_API_KEY?.substring(0, 10) || 'not set',
    },
    google: {
      configured: !!process.env.GOOGLE_API_KEY,
      keyPrefix: process.env.GOOGLE_API_KEY?.substring(0, 10) || 'not set',
    },
    deepgram: {
      configured: !!process.env.DEEPGRAM_API_KEY,
      keyPrefix: process.env.DEEPGRAM_API_KEY?.substring(0, 10) || 'not set',
    },
  };

  const allConfigured = Object.values(checks).every((check) => check.configured);

  return NextResponse.json({
    status: allConfigured ? 'ready' : 'incomplete',
    checks,
    message: allConfigured
      ? 'All API keys are configured'
      : 'Some API keys are missing',
  });
}
