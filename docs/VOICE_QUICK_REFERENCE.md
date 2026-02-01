# Voice Models Quick Reference Card

## 🎯 Quick Fix: Rachel Voice ID Issue

**Problem**: Code was using `'Rachel'` (name) instead of voice ID  
**Solution**: Use `'21m00Tcm4TlvDq8ikWAM'` (voice ID)

✅ **Fixed in**: `src/lib/voice/tts.ts`

---

## 📋 Most Common Voice IDs

| Voice | ID | Gender | Best For |
|-------|-----|--------|----------|
| **Rachel** | `21m00Tcm4TlvDq8ikWAM` | F | Default, professional, warm |
| Drew | `29vD33N1CtxCmqQRPOHJ` | M | Versatile, clear |
| Sarah | `EXAVITQu4vr4xnSDxMaL` | F | Calm, soothing |
| Josh | `TxGEqnHWrfWFTfGW9XjX` | M | Deep, narrative |
| Emily | `LcfcDJNUP1GQjkzn1xUU` | F | Pleasant, clear |

---

## 🔧 Quick Configuration

### Change Voice
```typescript
// In src/lib/voice/tts.ts
const CONFIG = {
  DEFAULT_VOICE_ID: '21m00Tcm4TlvDq8ikWAM', // Change this
  DEFAULT_MODEL: 'eleven_turbo_v2',
};
```

### Use Different Voice Per Request
```typescript
await synthesizeSpeech('Hello!', {
  voice: '29vD33N1CtxCmqQRPOHJ' // Drew
});
```

---

## 💰 Cost Per User (3-min conversation)

| Service | Cost |
|---------|------|
| Deepgram STT | $0.0129 |
| ElevenLabs TTS | $0.075 |
| GPT-4o-mini | $0.005 |
| **Total** | **$0.09** |

**Your $200 credit** = ~2,200 users

---

## ⚡ Performance

| Operation | Time |
|-----------|------|
| Deepgram STT | ~200ms |
| GPT-4o-mini | ~500ms |
| ElevenLabs TTS | ~1-2s |
| **Total Turn** | **~2-3s** |

---

## 🎤 Provider Selection

### Current Stack (Recommended)
- **STT**: Deepgram Nova-2 (primary) + Whisper (backup)
- **TTS**: ElevenLabs Turbo v2
- **LLM**: GPT-4o-mini

### Why This Stack?
✅ Fastest (2-3s total latency)  
✅ Cheapest ($0.09 per user)  
✅ Most flexible (swap providers easily)  
✅ Best quality (natural voices)

---

## 🔍 Common Issues

### "Voice ID not found"
❌ `voice: 'Rachel'`  
✅ `voice: '21m00Tcm4TlvDq8ikWAM'`

### "API key not configured"
Check `.env` has all keys:
```bash
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=sk_...
DEEPGRAM_API_KEY=...
```

### "Microphone not working"
1. Check browser permissions
2. Must use HTTPS in production
3. `localhost` works in development

---

## 📚 Full Documentation

- **Complete Guide**: `docs/VOICE_MODELS_REFERENCE.md`
- **Implementation**: `docs/VOICE_AGENT_IMPLEMENTATION_SUMMARY.md`
- **Troubleshooting**: `docs/VOICE_AGENT_TROUBLESHOOTING.md`
- **Quick Start**: `docs/VOICE_AGENT_QUICK_START.md`

---

## 🚀 Test Your Setup

```bash
# Test API keys
curl http://localhost:3000/api/voice-agent/test

# Try voice onboarding
http://localhost:3000/onboarding/voice
```

---

**Last Updated**: January 31, 2026
