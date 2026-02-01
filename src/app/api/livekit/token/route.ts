/**
 * LiveKit Token Generation API
 * Generates access tokens for clients to join LiveKit rooms
 */

import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, participantName, metadata } = body;

    if (!roomName) {
      return NextResponse.json(
        { error: 'Missing roomName' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';

    if (!apiKey || !apiSecret) {
      console.error('❌ Missing LiveKit credentials');
      return NextResponse.json(
        { error: 'LiveKit not configured' },
        { status: 500 }
      );
    }

    // Create access token
    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName || `user_${Date.now()}`,
      ttl: '10m', // Token valid for 10 minutes
      metadata: metadata || '',
    });

    // Grant permissions
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();

    console.log(`✅ Generated LiveKit token for room: ${roomName}`);

    return NextResponse.json({
      token: jwt,
      wsUrl,
      roomName,
    });
  } catch (error) {
    console.error('❌ Error generating LiveKit token:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate token',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
