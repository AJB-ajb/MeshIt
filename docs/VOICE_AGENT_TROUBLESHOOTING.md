# Voice Agent Troubleshooting Guide

## Issue: "Failed to start conversation" Error

### Symptoms
- Error appears when clicking "Voice Onboarding" button
- Console shows: `Failed to start conversation at VoiceOnboardingPage.useCallback[startVoiceOnboarding]`
- Audio recording never starts

### Root Cause
This error occurs **before** audio detection, during the API initialization phase. The audio recorder only activates after the conversation starts successfully.

## Diagnostic Steps

### 1. Check API Keys Configuration

Run the test endpoint to verify all API keys are configured:

```bash
curl http://localhost:3000/api/voice-agent/test
```

Expected response:
```json
{
  "status": "ready",
  "checks": {
    "openai": { "configured": true, "keyPrefix": "sk-proj-0w..." },
    "elevenlabs": { "configured": true, "keyPrefix": "sk_6f4561..." },
    "google": { "configured": true, "keyPrefix": "AIzaSyCR1..." },
    "deepgram": { "configured": true, "keyPrefix": "929663486..." }
  },
  "message": "All API keys are configured"
}
```

### 2. Verify .env File

Check your `.env` file has valid API keys:

```bash
# OpenAI (required for conversation)
OPENAI_API_KEY=sk-proj-...

# ElevenLabs (required for TTS)
ELEVENLABS_API_KEY=sk_...

# Deepgram (required for STT)
DEEPGRAM_API_KEY=...

# Google AI (optional, for advanced features)
GOOGLE_API_KEY=AIzaSy...
```

**Common Issues:**
- ❌ `ELEVENLABS_API_KEY=your_elevenlabs_api_keysk_...` (has placeholder prefix)
- ✅ `ELEVENLABS_API_KEY=sk_...` (correct format)

### 3. Check Browser Console

Open browser DevTools (F12) and look for detailed error messages:

```
📞 Initiating voice onboarding...
❌ Voice agent start error: Error: ELEVENLABS_API_KEY is not configured
```

### 4. Check Server Logs

In your terminal running `npm run dev`, look for:

```
📞 Starting voice conversation...
🤖 Initializing conversation session...
💬 Greeting: "Hi! I'm excited to help you..."
🔊 Synthesizing greeting audio...
✅ Audio synthesis complete
```

If you see errors here, they'll indicate which service is failing.

## Common Fixes

### Fix 1: Rachel Voice ID Issue (FIXED)

**Problem**: Code was using voice name `'Rachel'` instead of voice ID  
**Solution**: Updated to use `'21m00Tcm4TlvDq8ikWAM'`

✅ **Already fixed in**: `src/lib/voice/tts.ts`

ElevenLabs API requires **voice IDs**, not names:
- ❌ Wrong: `voice: 'Rachel'`
- ✅ Correct: `voice: '21m00Tcm4TlvDq8ikWAM'`

See `docs/VOICE_MODELS_REFERENCE.md` for all voice IDs.

### Fix 2: Update ElevenLabs API Key

Your `.env` had a malformed key. It should be:

```bash
ELEVENLABS_API_KEY=sk_6f456143aaa977cf2c50aa285cebf5f638d361745587918f
```

**After updating `.env`:**
1. Stop the dev server (Ctrl+C)
2. Restart: `npm run dev`
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Fix 3: Verify OpenAI API Key

Test your OpenAI key:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

Should return a list of models, not an error.

### Fix 4: Check Network/Firewall

Ensure your network allows connections to:
- `api.openai.com` (OpenAI)
- `api.elevenlabs.io` (ElevenLabs)
- `api.deepgram.com` (Deepgram)

### Fix 5: Clear Next.js Cache

Sometimes Next.js caches environment variables:

```bash
rm -rf .next
npm run dev
```

## Audio Detection Issues (Different Problem)

If the conversation starts but audio is NOT detected, that's a separate issue:

### Browser Permissions
1. Check browser microphone permissions
2. Look for permission prompt in address bar
3. Try in a different browser

### Microphone Hardware
1. Check system microphone settings
2. Test microphone in another app
3. Ensure correct input device is selected

### HTTPS Requirement
- Microphone access requires HTTPS in production
- `localhost` works without HTTPS in development

## Testing Audio Without Voice Agent

To test microphone separately:

```javascript
// Run in browser console
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone access granted');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('❌ Microphone error:', err));
```

## Still Having Issues?

1. **Check all logs**: Browser console + server terminal
2. **Test API endpoint**: Visit `/api/voice-agent/test`
3. **Verify API keys**: Ensure no extra characters or spaces
4. **Restart everything**: Server, browser, clear cache
5. **Check API quotas**: Ensure you haven't exceeded limits

## Success Indicators

When working correctly, you should see:

**Browser Console:**
```
📞 Initiating voice onboarding...
✅ Conversation started: session_1738...
```

**Server Logs:**
```
📞 Starting voice conversation...
🤖 Starting new voice conversation with GPT-4o-mini...
✅ Session created: session_1738...
🔊 Synthesizing speech with ElevenLabs...
✅ Speech synthesis complete (1234ms)
```

**UI Behavior:**
- Loading spinner appears briefly
- Greeting message displays
- Audio plays automatically
- Record button becomes active
- No error alerts

## Related Documentation

- [Voice Agent Implementation](./VOICE_AGENT_IMPLEMENTATION_SUMMARY.md)
- [Voice Agent Quick Start](./VOICE_AGENT_QUICK_START.md)
- [API Key Setup](./GOOGLE_API_KEY_FIX.md)
