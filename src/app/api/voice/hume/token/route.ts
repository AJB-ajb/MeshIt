/**
 * GET /api/voice/hume/token
 * Get Hume AI API credentials for client-side EVI connection
 * 
 * Note: In production, implement proper token-based auth instead of exposing API key
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.HUME_API_KEY;
    const configId = process.env.HUME_CONFIG_ID; // Optional: pre-configured EVI config

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Hume API key not configured' },
        { status: 500 }
      );
    }

    // In production, you should:
    // 1. Validate user session
    // 2. Generate a short-lived access token using Hume's token endpoint
    // 3. Return the token instead of the API key
    
    // For development, we return the API key directly
    // TODO: Implement token-based auth for production
    console.log('🎙️ Providing Hume credentials for EVI connection');

    return NextResponse.json({
      apiKey,
      configId: configId || undefined,
    });

  } catch (error) {
    console.error('❌ Failed to get Hume token:', error);
    return NextResponse.json(
      { error: 'Failed to get Hume credentials' },
      { status: 500 }
    );
  }
}
