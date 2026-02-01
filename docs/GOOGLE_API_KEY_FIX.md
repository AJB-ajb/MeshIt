# Google API Key Issue - Fix Guide

## 🔴 Current Problem

Your Google API key is **not working** with the Gemini models. The error shows:

```
[404 Not Found] models/gemini-xxx is not found for API version v1beta
```

This means either:
1. ❌ Your API key doesn't have access to Gemini models
2. ❌ Your API key is for a different Google service (not AI Studio)
3. ❌ Your API key has expired or been revoked

---

## ✅ Solution: Get a New Google AI Studio API Key

### Step 1: Go to Google AI Studio

**Visit:** https://aistudio.google.com/app/apikey

### Step 2: Create New API Key

1. Click **"Get API key"** or **"Create API key"**
2. Choose **"Create API key in new project"** (or select existing project)
3. Copy the new API key (starts with `AIza...`)

### Step 3: Update Your `.env` File

Replace the current key in `/Users/shankavi/Documents/MeshIt/.env`:

```bash
# OLD (not working):
GOOGLE_API_KEY=AIzaSyCR1bdPhLH6J9G1-S_5KKaQimhLgml2TFs

# NEW (your new key):
GOOGLE_API_KEY=AIzaSy...your_new_key_here
```

### Step 4: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
pnpm dev
```

### Step 5: Test Again

Visit: `http://localhost:3000/onboarding/voice`

---

## 🔍 How to Verify Your API Key Works

### Quick Test (in browser console):

```javascript
fetch('https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY')
  .then(r => r.json())
  .then(d => console.log('Available models:', d))
```

**Replace `YOUR_API_KEY`** with your actual key.

**Expected result:** Should show a list of available models including `gemini-pro`

---

## 📋 Correct Model Names (as of Jan 2026)

For `@google/generative-ai` v0.24.1, these models should work:

| Model Name | Description | Status |
|------------|-------------|--------|
| `gemini-pro` | Standard model | ✅ Most stable |
| `gemini-1.5-pro` | Latest Pro | ✅ Should work |
| `gemini-1.5-flash` | Fast model | ✅ Should work |
| `gemini-2.0-flash-exp` | Experimental | ❌ May not be available |

---

## 🛠️ Alternative: Use OpenAI Instead

If you can't get a Google API key, we can switch to using OpenAI's GPT models instead:

### Option 1: Use GPT-4o-mini (Cheaper, Faster)

```typescript
// In src/lib/ai/voice-agent.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Replace Gemini calls with:
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildGreetingPrompt() }
  ],
  temperature: 0.7,
  max_tokens: 1024,
});
```

**Pros:**
- ✅ You already have OpenAI API key configured
- ✅ GPT-4o-mini is very cheap ($0.15 per 1M input tokens)
- ✅ Excellent at conversation and data extraction

**Cons:**
- More expensive than Gemini (but still very cheap)
- Slightly slower response times

---

## 🎯 Recommended Action

**Try this in order:**

1. **Get new Google AI Studio API key** (5 minutes)
   - Free tier: 60 requests/minute
   - Best for this use case
   
2. **If that fails, switch to OpenAI** (already configured)
   - You have OpenAI key working
   - Just need to modify voice-agent.ts

---

## 🔧 Quick Fix: Switch to OpenAI Now

Want me to switch the voice agent to use OpenAI instead of Gemini?

**Advantages:**
- ✅ Works immediately (your OpenAI key is already valid)
- ✅ No need to get new API key
- ✅ GPT-4o-mini is excellent for this task
- ✅ Cost: ~$0.02 per conversation (very cheap)

**Just say:** "Switch to OpenAI" and I'll update the code!

---

## 📞 Support

**Google AI Studio:**
- Dashboard: https://aistudio.google.com/
- API Keys: https://aistudio.google.com/app/apikey
- Docs: https://ai.google.dev/docs

**OpenAI:**
- Dashboard: https://platform.openai.com/
- API Keys: https://platform.openai.com/api-keys
- Docs: https://platform.openai.com/docs

---

**Current Status:** ❌ Google API key not working with Gemini models

**Next Step:** Get new API key OR switch to OpenAI
