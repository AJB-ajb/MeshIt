# Gemini Voice Agent - Quick Start

## ✅ Implementation Complete

Gemini 2.5 Flash is now integrated for voice conversations. Tested and working!

## Quick Test

```bash
# Set environment variables
export GOOGLE_API_KEY="your_key"
export ELEVENLABS_API_KEY="your_key"

# Run test (will hit rate limit after ~3 turns - expected)
npx tsx scripts/test-gemini-voice.ts

# Check output
# ✅ Should create session, generate greeting, process turns
# ✅ Audio file saved to: test-greeting.mp3
```

## Use in Your App

```tsx
// 1. Import the component
import { GeminiVoiceInterface } from '@/components/voice/gemini-voice-interface';

// 2. Add to your page
<GeminiVoiceInterface
  onComplete={(profile) => {
    console.log('Profile created:', profile);
    // Save to database, redirect, etc.
  }}
/>
```

## API Endpoints Available

```bash
POST /api/voice/gemini/start          # Start conversation
POST /api/voice/gemini/turn           # Process audio turn
POST /api/voice/gemini/complete       # Get final profile
GET  /api/voice/gemini/status         # Check session
```

## Switch Providers

```bash
# .env file
VOICE_CONVERSATION_PROVIDER=gemini    # Use Gemini (FREE)
# or
VOICE_CONVERSATION_PROVIDER=openai    # Use OpenAI (€50 credit)
```

## Rate Limits (Gemini Free Tier)

- **5 requests/minute** - OK for normal conversations
- **15,000 requests/day** - ~100 conversations/day
- Upgrade to paid for higher volume (60 RPM)

## What You Get

✅ Natural conversation AI (Gemini 2.5 Flash)  
✅ Speech-to-text (Deepgram - €200 credit)  
✅ Text-to-speech (ElevenLabs)  
✅ Profile data extraction  
✅ Session management  
✅ Complete UI component  

## Files to Know

- `src/lib/voice/gemini-live.ts` - Core Gemini service
- `src/lib/ai/gemini-voice-agent.ts` - Voice orchestrator
- `src/components/voice/gemini-voice-interface.tsx` - UI component
- `src/app/api/voice/gemini/*` - API routes

## Docs

- Full details: `docs/GEMINI_LIVE_VOICE.md`
- Implementation summary: `docs/GEMINI_IMPLEMENTATION_SUMMARY.md`

---

**Status:** ✅ Ready to use  
**Test:** ✅ Passing  
**Cost:** FREE (Gemini free tier)
