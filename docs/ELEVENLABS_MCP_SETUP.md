# ElevenLabs MCP Server Setup

**Status**: ✅ Configured and Ready

---

## 🎯 What Was Done

### 1. Added ElevenLabs MCP Server

**File**: `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "elevenlabs": {
      "command": "uvx",
      "args": ["elevenlabs-mcp"],
      "env": {
        "ELEVENLABS_API_KEY": "${env:ELEVENLABS_API_KEY}"
      }
    }
  }
}
```

**What this does**:
- Enables ElevenLabs integration in Cursor
- Uses your API key from `.env` file
- Provides voice synthesis capabilities via MCP

### 2. Updated Credit Strategy

**File**: `.env`

Added clear credit usage notes:
- **Deepgram**: €200 credit - PRIMARY for STT (use heavily)
- **OpenAI**: €50 credit - BACKUP ONLY (save for final testing)
- **ElevenLabs**: Pay-as-you-go (use for TTS)
- **Google Gemini**: FREE (use for conversation AI)

### 3. Created Comprehensive Documentation

**Files Created**:
- `docs/CREDIT_OPTIMIZATION_STRATEGY.md` - Complete credit management guide
- `scripts/check-credits.sh` - Daily credit monitoring script

---

## 🚀 How to Use ElevenLabs MCP

### Prerequisites

Install `uvx` if not already installed:

```bash
# Using pip
pip install uvx

# Or using pipx
pipx install uvx
```

### Verify Installation

Restart Cursor to load the new MCP server, then:

```bash
# Check if ElevenLabs MCP is available
# In Cursor, the MCP server should appear in the MCP panel
```

### Using ElevenLabs MCP

The MCP server provides these capabilities:

1. **Voice Synthesis**: Generate speech from text
2. **Voice Management**: List and manage voices
3. **Audio Generation**: Create audio files

**Example usage in Cursor**:
```
Ask Cursor: "Use ElevenLabs to synthesize 'Hello world' with Rachel voice"
```

---

## 💰 Credit Optimization Strategy

### Your Credits

| Service | Credit | Usage |
|---------|--------|-------|
| Deepgram | €200 | ~46,500 minutes STT |
| OpenAI | €50 | ~800 minutes STT (backup) |
| ElevenLabs | Pay-as-you-go | Check balance |
| Gemini | FREE | Unlimited (15 RPM) |

### Cost Per Conversation (3 minutes)

**Current Setup**:
```
Deepgram STT:     €0.0129  (using €200 credit ✅)
ElevenLabs TTS:   €0.075   (pay-as-you-go 💵)
GPT-4o-mini:      €0.005   (using €50 credit ⚠️)
────────────────────────────────────────────────
Total:            €0.09
```

**With Gemini (Recommended)**:
```
Deepgram STT:     €0.0129  (using €200 credit ✅)
ElevenLabs TTS:   €0.075   (pay-as-you-go 💵)
Gemini:           €0.00    (FREE 🎁)
────────────────────────────────────────────────
Total:            €0.088   (save €0.005 per conversation)
```

### Maximum Conversations

- **Current setup**: 10,000 conversations (limited by OpenAI €50)
- **With Gemini**: 15,500 conversations (limited by Deepgram €200)
- **Improvement**: +55% more conversations!

---

## 📊 Monitoring Credits

### Daily Check Script

Run this script to monitor your credit usage:

```bash
./scripts/check-credits.sh
```

**Output**:
```
====================================
   MeshIt Voice Agent Credits
====================================

📊 Credit Status:

1. Deepgram: €200 (check usage at console.deepgram.com)
2. OpenAI: €50 (check usage at platform.openai.com)
3. ElevenLabs: Pay-as-you-go (check at elevenlabs.io)
4. Gemini: FREE

💰 Estimated Usage for X conversations:
   Deepgram:    €X.XX used (€XXX.XX remaining)
   OpenAI:      €X.XX used (€XX.XX remaining)
   Total:       €X.XX
```

### Manual Checks

**Deepgram**:
- URL: https://console.deepgram.com/billing
- Check: Minutes used / €200 remaining

**OpenAI**:
- URL: https://platform.openai.com/usage
- Check: API usage / €50 remaining

**ElevenLabs**:
- URL: https://elevenlabs.io/app/usage
- Check: Character usage / balance

---

## 🎯 Optimization Tips

### 1. Use Deepgram Heavily ✅

**Why**: You have €200 credit (46,500 minutes)

**Do**:
- ✅ Use for all development testing
- ✅ Use for all user onboarding
- ✅ Enable real-time streaming
- ✅ Use word-level timestamps
- ✅ Don't worry about "wasting" credit

**Don't**:
- ❌ Don't switch to Whisper unless Deepgram fails
- ❌ Don't try to "save" Deepgram credit

### 2. Save OpenAI Credit ⚠️

**Why**: Only €50 credit (800 minutes)

**Current Usage**:
- GPT-4o-mini: €0.005 per conversation
- Can do 10,000 conversations

**Optimization**:
- Switch to Gemini (FREE) for conversation
- Save OpenAI for:
  - Final production testing
  - Backup STT (Whisper)
  - Emergency fallback

### 3. Monitor ElevenLabs 💵

**Cost**: €0.30 per 1,000 characters

**Optimization**:
- ✅ Use Turbo v2 model (fastest, cheapest)
- ✅ Keep responses concise
- ✅ Cache common phrases (future)
- ❌ Don't use expensive models unless needed

### 4. Use Gemini for Free 🎁

**Benefits**:
- FREE conversation AI
- 15 RPM limit (enough for voice onboarding)
- Similar quality to GPT-4o-mini

**Implementation**:
- Switch when ready (after initial testing)
- Keep OpenAI as fallback
- Save entire €50 credit

---

## 🔧 Next Steps

### Immediate

1. ✅ **ElevenLabs MCP configured** - Done!
2. ✅ **Credit strategy documented** - Done!
3. ⏳ **Restart Cursor** - Load new MCP server
4. ⏳ **Test voice onboarding** - Verify everything works

### This Week

1. **Monitor credit usage** - Run `./scripts/check-credits.sh` daily
2. **Test 10-20 conversations** - Get baseline metrics
3. **Check actual costs** - Compare with estimates
4. **Verify ElevenLabs balance** - Ensure sufficient funds

### Next Week

1. **Switch to Gemini** - Save OpenAI credit
2. **Test Gemini integration** - Verify quality
3. **Update documentation** - Document the switch
4. **Set up alerts** - Monitor credit thresholds

---

## 📚 Related Documentation

- **Credit Strategy**: `docs/CREDIT_OPTIMIZATION_STRATEGY.md`
- **Voice Models**: `docs/VOICE_MODELS_REFERENCE.md`
- **Quick Reference**: `docs/VOICE_QUICK_REFERENCE.md`
- **Troubleshooting**: `docs/VOICE_AGENT_TROUBLESHOOTING.md`

---

## 🎉 Summary

### ✅ What's Configured

1. **ElevenLabs MCP** - Added to Cursor
2. **Credit strategy** - Optimized for maximum usage
3. **Monitoring script** - Track daily usage
4. **Documentation** - Complete guides

### 💰 Credit Strategy

- **Deepgram €200**: Use heavily for STT ✅
- **OpenAI €50**: Save for final testing ⚠️
- **ElevenLabs**: Pay-as-you-go for TTS 💵
- **Gemini**: FREE conversation AI 🎁

### 🚀 Ready to Go

You can now:
- Test voice onboarding without worrying about credits
- Monitor usage with the provided script
- Scale to 15,500+ conversations with Gemini
- Save OpenAI credit for final production testing

**You're all set!** 🎊

---

**Last Updated**: January 31, 2026  
**Status**: ✅ Configured and Optimized
