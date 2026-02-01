# LiveKit Voice Agent Implementation

## Overview

LiveKit integration enables **concurrent voice sessions** with real-time WebRTC communication. Multiple users can interact with voice agents simultaneously using Deepgram STT + Gemini LLM + ElevenLabs TTS.

## Key Features

✅ **Concurrent Users**: 5-100+ users simultaneously (vs 1 with Gemini API)  
✅ **WebRTC Support**: Native real-time audio streaming  
✅ **Auto-scaling**: Built-in load balancing  
✅ **Production-ready**: Interruption handling, turn detection  
✅ **Multi-modal**: Voice + video + screen share support  
✅ **Self-hostable**: Open source (Apache 2.0), unlimited users

## Architecture

```
User Browser (WebRTC)
    ↓
LiveKit Server (manages connections)
    ↓
Voice Agent (Node.js/TypeScript)
    ↓
Deepgram STT → Gemini LLM → ElevenLabs TTS
    ↓
Audio response via WebRTC
```

## Setup Options

### Option 1: LiveKit Cloud (Easiest)

**Free Tier Limits:**
- 1,000 agent session minutes/month
- 5 concurrent agent sessions
- 100 concurrent WebRTC connections
- $2.50 inference credits (~50 minutes)
- No credit card required

**Setup Steps:**

1. **Sign up for LiveKit Cloud**
   ```bash
   # Visit https://cloud.livekit.io
   # Create free account
   ```

2. **Get API credentials**
   - Go to Settings → API Keys
   - Copy: URL, API Key, API Secret

3. **Update .env file**
   ```bash
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your_api_key
   LIVEKIT_API_SECRET=your_api_secret
   ```

4. **Run the application**
   ```bash
   pnpm dev
   ```

5. **Test with multiple users**
   - Open http://localhost:3000/onboarding/voice-livekit
   - Open in multiple browser tabs (different users)
   - All can talk to the agent concurrently

### Option 2: Self-Hosted (Unlimited, Free)

**Benefits:**
- Unlimited concurrent users
- Zero ongoing costs (just server compute)
- Full control over infrastructure
- Private/on-premise deployment

**Setup Steps:**

1. **Install LiveKit Server (Docker)**
   ```bash
   docker run -d \
     --name livekit \
     -p 7880:7880 \
     -p 7881:7881 \
     -p 7882:7882/udp \
     -v $PWD/livekit.yaml:/livekit.yaml \
     livekit/livekit-server \
     --config /livekit.yaml
   ```

2. **Create livekit.yaml config**
   ```yaml
   port: 7880
   rtc:
     port_range_start: 7882
     port_range_end: 7882
     use_external_ip: true
   keys:
     devkey: secret
   ```

3. **Update .env for local server**
   ```bash
   LIVEKIT_URL=ws://localhost:7880
   LIVEKIT_API_KEY=devkey
   LIVEKIT_API_SECRET=secret
   ```

4. **Deploy to cloud (production)**
   - AWS/GCP/Azure with Docker
   - Kubernetes (Helm charts available)
   - Fly.io / Railway / Render

## API Endpoints

### 1. Get LiveKit Token
```typescript
POST /api/livekit/token
Body: { roomName: string, participantName?: string }
Response: { token: string, wsUrl: string, roomName: string }
```

### 2. Start Agent Session
```typescript
POST /api/livekit/agent/start
Body: { roomName: string, userId?: string }
Response: { roomName: string, greeting: string, audio: string, ready: boolean }
```

### 3. Process Voice Turn
```typescript
POST /api/livekit/agent/turn
Body: FormData { roomName: string, audio: File }
Response: {
  transcription: string,
  response: string,
  audio: string,
  extractedData: Partial<ProfileData>,
  completed: boolean
}
```

### 4. Complete Session
```typescript
POST /api/livekit/agent/complete
Body: { roomName: string }
Response: { profile: ProfileData, conversationHistory: Array, summary: string }
```

## React Component Usage

```tsx
import { LiveKitVoiceInterface } from '@/components/voice/livekit-voice-interface';

function OnboardingPage() {
  const handleComplete = (profile: ProfileData) => {
    // Save profile to database
    console.log('Profile created:', profile);
  };

  return (
    <LiveKitVoiceInterface
      onComplete={handleComplete}
      userId="user_123"
    />
  );
}
```

## Concurrent User Testing

**Test Scenario:**

1. Start dev server: `pnpm dev`
2. Open browser tab 1: http://localhost:3000/onboarding/voice-livekit
3. Click "Start Voice Conversation"
4. While agent is speaking, open tab 2 (same URL)
5. Tab 2: Click "Start Voice Conversation" (different room)
6. **Result**: Both users can talk to agents simultaneously

**Scaling:**

| Plan | Concurrent Sessions | Monthly Minutes | Cost |
|------|---------------------|-----------------|------|
| Free | 5 | 1,000 | $0 |
| Ship | 20 | 5,000 | $50 |
| Scale | 600 | 50,000 | $500 |
| Self-hosted | Unlimited | Unlimited | Server costs only |

## Cost Comparison

**Current Gemini Setup (per user):**
- STT: Deepgram €0.0043/min (~€200 credit = 46,500 min)
- LLM: Gemini FREE (5 RPM limit = 1 user)
- TTS: ElevenLabs ~$0.001/char
- Concurrent users: 1 (sequential only)

**LiveKit + Gemini (per user):**
- STT: Same Deepgram cost
- LLM: Same Gemini FREE
- TTS: Same ElevenLabs cost
- LiveKit: FREE for 5 concurrent, $50/mo for 20 concurrent
- **Benefit**: Multiple users can use voice agent at same time

**Example Costs (100 users talking for 5 min each):**
- Gemini only: €2.15 (STT) + FREE (LLM) + €0.50 (TTS) = **€2.65**
- LiveKit Cloud: €2.65 + $50/mo for 20 concurrent = **€2.65 + infrastructure**
- LiveKit Self-hosted: €2.65 + $20/mo server = **€2.65 + minimal infrastructure**

## Production Deployment

### LiveKit Cloud Deployment

```bash
# 1. Create production LiveKit project
# Visit https://cloud.livekit.io/projects/create

# 2. Update environment variables
LIVEKIT_URL=wss://your-prod-project.livekit.cloud
LIVEKIT_API_KEY=prod_api_key
LIVEKIT_API_SECRET=prod_api_secret

# 3. Deploy Next.js app (Vercel/AWS/etc)
# Agent code runs in Next.js API routes (serverless)
```

### Self-Hosted Deployment

```bash
# 1. Deploy LiveKit server
kubectl apply -f livekit-deployment.yaml

# 2. Configure DNS
# Point your domain to LiveKit server

# 3. Enable HTTPS
# LiveKit requires HTTPS for production WebRTC

# 4. Update .env
LIVEKIT_URL=wss://livekit.yourdomain.com
```

## Troubleshooting

### "Failed to get LiveKit token"
- Check `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` in .env
- Verify LiveKit server is running (Cloud or self-hosted)

### "WebRTC connection failed"
- Ensure firewall allows UDP ports 7882+ (for RTC)
- Check browser console for WebRTC errors
- Try different network (mobile hotspot vs WiFi)

### "Agent not responding"
- Verify Deepgram, Gemini, ElevenLabs API keys
- Check agent logs for STT/LLM/TTS errors
- Ensure room name matches between client and agent

### Multiple users can't connect
- Free tier: Max 5 concurrent sessions
- Upgrade to Ship plan ($50/mo) for 20 concurrent
- Or self-host for unlimited

## Migration from Gemini-only

To migrate existing voice onboarding to LiveKit:

```tsx
// Before (Gemini-only)
import { GeminiVoiceInterface } from '@/components/voice/gemini-voice-interface';

// After (LiveKit + Gemini)
import { LiveKitVoiceInterface } from '@/components/voice/livekit-voice-interface';

// Same props, drop-in replacement
<LiveKitVoiceInterface onComplete={handleComplete} userId={user.id} />
```

## Resources

- [LiveKit Docs](https://docs.livekit.io/)
- [LiveKit Cloud](https://cloud.livekit.io/)
- [LiveKit GitHub](https://github.com/livekit)
- [Voice AI Quickstart](https://docs.livekit.io/agents/start/voice-ai/)
- [Self-hosting Guide](https://docs.livekit.io/transport/self-hosting/)

## Next Steps

1. ✅ Set up LiveKit Cloud or self-hosted server
2. ✅ Configure API keys in .env
3. ✅ Test with single user
4. ✅ Test with 2-5 concurrent users
5. ⏳ Deploy to production
6. ⏳ Monitor usage and scale as needed
