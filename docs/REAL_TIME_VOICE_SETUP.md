# Real-Time Voice Agent Setup Guide

## Overview

This guide walks you through setting up and testing the real-time ElevenLabs Conversational AI voice agent for MeshIt onboarding.

## Architecture

The real-time voice agent uses:
- **WebSocket Server**: Custom Next.js server for bidirectional streaming
- **ElevenLabs Conversational AI**: All-in-one STT + LLM + TTS service
- **Function Calling**: Profile data extraction during conversation
- **Web Audio API**: Real-time audio playback in browser

**Latency**: ~300ms (vs 2-3s with record/stop approach)

## Prerequisites

1. ElevenLabs API Key (already configured in `.env`)
2. ElevenLabs Creator Plan (you have 109K characters remaining)
3. Node.js 18+ and pnpm installed

## Setup Steps

### 1. Install Dependencies

Dependencies are already installed:
- `express` - HTTP server
- `tsx` - TypeScript execution
- `ws` - WebSocket library
- `@elevenlabs/elevenlabs-js` - ElevenLabs SDK

### 2. Create ElevenLabs Agent

The agent will be created automatically on first run. To create it manually:

```bash
# Start the dev server
pnpm dev
```

On first connection, the system will:
1. Create an ElevenLabs Conversational AI agent
2. Configure it with profile extraction function calling
3. Print the agent ID to console

**Copy the agent ID and add it to `.env`:**

```env
ELEVENLABS_AGENT_ID=your_agent_id_here
```

### 3. Start the Server

```bash
pnpm dev
```

You should see:
```
> Ready on http://localhost:3000
> WebSocket server ready on ws://localhost:3000/api/voice-agent/ws
```

### 4. Test the Voice Agent

1. Navigate to: `http://localhost:3000/onboarding/voice`
2. Click "Voice Onboarding"
3. Click "Start Conversation"
4. Allow microphone access
5. Start speaking naturally

The agent will:
- Greet you and ask about your skills
- Listen continuously (no record/stop buttons)
- Extract profile data in real-time
- Show extracted data in the profile preview

## File Structure

```
MeshIt/
├── server.ts                                    # Custom Next.js + WebSocket server
├── src/
│   ├── lib/
│   │   ├── voice/
│   │   │   ├── elevenlabs-agent.ts            # Agent configuration
│   │   │   ├── websocket-handler.ts           # WebSocket message handling
│   │   │   ├── metrics.ts                     # Latency monitoring
│   │   │   └── types.ts                       # TypeScript types
│   │   └── supabase/
│   │       └── profiles.ts                    # Profile persistence
│   ├── components/
│   │   └── voice/
│   │       └── realtime-voice-recorder.tsx    # Real-time recorder component
│   └── app/
│       ├── (dashboard)/
│       │   └── onboarding/
│       │       └── voice/
│       │           └── page.tsx               # Voice onboarding page
│       └── api/
│           └── profile/
│               └── save/
│                   └── route.ts               # Profile save endpoint
```

## Testing Checklist

### Basic Functionality
- [ ] WebSocket connection establishes
- [ ] Microphone permission granted
- [ ] Audio streaming starts
- [ ] Agent greeting plays
- [ ] User speech is transcribed
- [ ] Agent responds naturally
- [ ] Profile data extracted and displayed

### Profile Extraction
- [ ] Skills extracted correctly
- [ ] Experience years captured
- [ ] Interests identified
- [ ] Availability hours recorded
- [ ] Collaboration style determined

### Error Handling
- [ ] Microphone permission denied handled gracefully
- [ ] WebSocket disconnection triggers reconnection
- [ ] Audio playback errors don't crash the app
- [ ] Profile save errors are caught and displayed

### Performance
- [ ] Turn latency < 500ms (target: ~300ms)
- [ ] Audio playback is smooth
- [ ] No audio buffering issues
- [ ] Reconnection works within 3 attempts

## Troubleshooting

### Agent Not Created

**Error**: "ELEVENLABS_AGENT_ID not found"

**Solution**:
1. Check console logs for agent creation
2. Copy the agent ID from logs
3. Add to `.env` file
4. Restart server

### WebSocket Connection Failed

**Error**: "WebSocket connection failed"

**Solutions**:
- Check server is running on port 3000
- Verify no other process is using port 3000
- Check browser console for CORS errors
- Try `ws://localhost:3000/api/voice-agent/ws` directly

### Microphone Access Denied

**Error**: "Microphone access denied"

**Solutions**:
- Click the lock icon in browser address bar
- Allow microphone access
- Refresh the page
- Try a different browser (Chrome/Edge recommended)

### Audio Not Playing

**Error**: Audio chunks received but not playing

**Solutions**:
- Check browser console for audio decoding errors
- Verify Web Audio API is supported
- Try refreshing the page
- Check system audio settings

### Profile Not Saving

**Error**: "Failed to save profile"

**Solutions**:
- Check Supabase connection
- Verify user is authenticated
- Check profiles table exists
- Review API logs for errors

## Performance Monitoring

The system includes built-in latency monitoring. Check browser console for:

```
Turn latency: 287ms
=== Voice Agent Metrics ===
Average Latency: 312ms
Min Latency: 245ms
Max Latency: 398ms
Total Turns: 5
Audio Chunks: 23 received, 23 played
Errors: 0
Reconnections: 0
==========================
```

## Cost Tracking

**Your ElevenLabs Usage:**
- Creator Plan: 110,000 characters/month
- Current Usage: 395 characters
- Remaining: 109,605 characters

**Per Onboarding Session:**
- Average: ~750 characters (5 responses × 150 chars)
- **You can do ~146 onboarding sessions** before hitting the monthly limit

**Monitor usage at**: https://elevenlabs.io/app/usage

## Next Steps

### Production Deployment

1. **Environment Variables**:
   - Add `ELEVENLABS_AGENT_ID` to Vercel/production environment
   - Verify all API keys are set

2. **WebSocket Configuration**:
   - Update WebSocket URL for production domain
   - Configure WSS (secure WebSocket) for HTTPS

3. **Error Monitoring**:
   - Set up Sentry for error tracking
   - Monitor WebSocket connection stability
   - Track latency metrics

4. **Scaling Considerations**:
   - Monitor ElevenLabs character usage
   - Consider upgrading plan if needed
   - Implement rate limiting if necessary

### Feature Enhancements

- [ ] Add conversation history persistence
- [ ] Implement pause/resume functionality
- [ ] Add multi-language support
- [ ] Enable voice selection (different voices)
- [ ] Add conversation analytics dashboard

## Support

For issues or questions:
1. Check browser console for errors
2. Review server logs for WebSocket errors
3. Test individual services (STT, TTS, Gemini)
4. Verify API keys and agent configuration

---

**Status**: ✅ Ready for Testing
**Last Updated**: January 31, 2026
