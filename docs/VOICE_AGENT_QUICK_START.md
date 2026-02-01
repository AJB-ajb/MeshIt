# Voice Agent - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Get Deepgram API Key

1. Go to https://console.deepgram.com/signup
2. Sign up (free $200 credit)
3. Create a new project
4. Copy your API key

### Step 2: Add to .env

```bash
# Open .env file and update:
DEEPGRAM_API_KEY=your_actual_key_here
```

### Step 3: Test It!

```bash
# Start dev server
pnpm dev

# Open browser
http://localhost:3000/onboarding/voice

# Click "Voice Onboarding"
# Allow microphone access
# Start speaking!
```

## 🎤 How to Use

### For Users

1. **Choose Voice Onboarding**
   - Click the microphone button

2. **Grant Microphone Permission**
   - Browser will ask for permission
   - Click "Allow"

3. **Have a Conversation**
   - Agent asks: "What technologies do you work with?"
   - You speak: "I mainly do React and TypeScript"
   - Agent responds and asks next question
   - Continue for 4-5 turns

4. **Profile Created!**
   - Agent confirms completion
   - Redirects to dashboard
   - Profile saved automatically

### For Developers

```typescript
// Test STT
import { transcribe } from '@/lib/voice/stt';
const result = await transcribe(audioBuffer);

// Test TTS
import { synthesizeSpeech } from '@/lib/voice/tts';
const audio = await synthesizeSpeech('Hello world');

// Test Voice Agent
import { startVoiceConversation, processVoiceTurn } from '@/lib/ai/voice-agent';
const session = await startVoiceConversation();
const response = await processVoiceTurn(session.sessionId, 'I work with React');
```

## 🎯 What You Get

- ✅ Voice-based profile creation
- ✅ Natural conversation (not robotic)
- ✅ Automatic data extraction
- ✅ Real-time transcription
- ✅ Natural voice responses
- ✅ Fallback to text if needed
- ✅ Match explanations read aloud

## 💰 Cost Per User

- **3-minute conversation**: ~$0.09
- **Your $200 credit**: ~2,200 users
- **Way more than enough for MVP!**

## 🐛 Troubleshooting

### "Microphone not working"
- Check browser permissions
- Try different browser
- Use text fallback

### "API key error"
- Verify `.env` has Deepgram key
- Restart dev server
- Check key is valid

### "Audio not playing"
- Check browser audio permissions
- Verify ElevenLabs key
- Check console for errors

## 📚 Full Documentation

See `docs/VOICE_AGENT.md` for complete details.

## 🎉 You're Ready!

The voice agent is fully implemented and ready to test. Just add your Deepgram API key and start the dev server!
