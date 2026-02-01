/**
 * POST /api/voice-agent/complete
 * Complete voice onboarding and return final profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { completeVoiceOnboarding } from '@/lib/ai/voice-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Complete onboarding and get profile
    const profile = await completeVoiceOnboarding(sessionId);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Voice agent complete error:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete onboarding',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
