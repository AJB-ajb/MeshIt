# Voice Models Reference Guide

Complete reference for all voice AI services used in MeshIt.

---

## 🎙️ ElevenLabs Text-to-Speech (TTS)

### Overview
- **Purpose**: Convert text to natural-sounding speech
- **Model Used**: `eleven_turbo_v2` (fastest, lowest latency)
- **Cost**: $0.30 per 1,000 characters

### Voice Configuration

**IMPORTANT**: ElevenLabs API requires **Voice IDs**, not voice names!

#### Rachel (Default Voice)
- **Voice ID**: `21m00Tcm4TlvDq8ikWAM`
- **Name**: Rachel
- **Gender**: Female
- **Accent**: American
- **Age**: Middle-aged
- **Description**: A warm, expressive voice with a touch of humor
- **Use Case**: Social media, conversational AI
- **Category**: Professional
- **Availability**: Creator and Enterprise tiers

### Available Premade Voices

To get all available voices programmatically:

```typescript
import { getAvailableVoices } from '@/lib/voice/tts';

const voices = await getAvailableVoices();
// Returns: [{ id, name, category, description }, ...]
```

Or via API:
```bash
curl -X GET "https://api.elevenlabs.io/v1/voices" \
  -H "xi-api-key: YOUR_API_KEY"
```

### Common Voice IDs

| Voice Name | Voice ID | Gender | Accent | Description |
|------------|----------|--------|--------|-------------|
| Rachel | `21m00Tcm4TlvDq8ikWAM` | Female | American | Warm, expressive, humorous |
| Drew | `29vD33N1CtxCmqQRPOHJ` | Male | American | Well-rounded, versatile |
| Clyde | `2EiwWnXFnvU5JabPnv8n` | Male | American | War veteran, strong |
| Paul | `5Q0t7uMcjvnagumLfvZi` | Male | American | Ground reporter, clear |
| Domi | `AZnzlk1XvdvUeBnXmlld` | Female | American | Strong, confident |
| Dave | `CYw3kZ02Hs0563khs1Fj` | Male | British-Essex | Conversational, young |
| Fin | `D38z5RcWu1voky8WS1ja` | Male | Irish | Sailor, expressive |
| Sarah | `EXAVITQu4vr4xnSDxMaL` | Female | American | Soft, calm |
| Antoni | `ErXwobaYiN019PkySvjV` | Male | American | Well-rounded, pleasant |
| Thomas | `GBv7mTt0atIp3Br8iCZE` | Male | American | Calm, meditative |
| Charlie | `IKne3meq5aSn9XLyUdCD` | Male | Australian | Casual, conversational |
| Emily | `LcfcDJNUP1GQjkzn1xUU` | Female | American | Calm, soothing |
| Elli | `MF3mGyEYCl7XYWbV9V6O` | Female | American | Emotional, young |
| Callum | `N2lVS1w4EtoT3dr4eOWO` | Male | American | Hoarse, intense |
| Patrick | `ODq5zmih8GrVes37Dizd` | Male | American | Shouty, expressive |
| Harry | `SOYHLrjzK2X1ezoPC6cr` | Male | American | Anxious, younger |
| Liam | `TX3LPaxmHKxFdv7VOQHJ` | Male | American | Articulate, news |
| Dorothy | `ThT5KcBeYPX3keUQqHPh` | Female | British | Pleasant, young |
| Josh | `TxGEqnHWrfWFTfGW9XjX` | Male | American | Deep, narrative |
| Arnold | `VR6AewLTigWG4xSOukaG` | Male | American | Crisp, strong |
| Charlotte | `XB0fDUnXU5powFXDhCwa` | Female | English-Swedish | Seductive, refined |
| Alice | `Xb7hH8MSUJpSbSDYk0k2` | Female | British | Confident, news |
| Matilda | `XrExE9yKIg1WjnnlVkGX` | Female | American | Warm, friendly |
| James | `ZQe5CZNOzWyzPSCn5a3c` | Male | Australian | Calm, deep |
| Joseph | `Zlb1dXrM653N07WRdFW3` | Male | British | Articulate, news |
| Jeremy | `bVMeCyTHy58xNoL34h3p` | Male | American-Irish | Excited, narration |
| Michael | `flq6f7yk4E4fJM5XTYuZ` | Male | American | Orotund, audiobook |
| Ethan | `g5CIjZEefAph4nQFvHAz` | Male | American | Whisper ASMR |
| Chris | `iP95p4xoKVk53GoZ742B` | Male | American | Casual, middle-aged |
| Gigi | `jBpfuIE2acCO8z3wKNLl` | Female | American | Childish, young |
| Freya | `jsCqWAovK2LkecY7zXl4` | Female | American | Expressive, young |
| Brian | `nPczCjzI2devNBz1zQrb` | Male | American | Deep, narration |
| Grace | `oWAxZDx7w5VEj9dCyTzz` | Female | American-Southern | Expressive, young |
| Daniel | `onwK4e9ZLuTAKqWW03F9` | Male | British | Deep, authoritative |
| Lily | `pFZP5JQG7iQjIQuC4Bku` | Female | British | Warm, pleasant |
| Serena | `pMsXgVXv3BLzUgSXRplE` | Female | American | Pleasant, middle-aged |
| Adam | `pNInz6obpgDQGcFmaJgB` | Male | American | Deep, narrative |
| Nicole | `piTKgcLEGmPE4e6mEKli` | Female | American | Whisper, ASMR |
| Bill | `pqHfZKP75CvOlQylNhV4` | Male | American | Trustworthy, strong |
| Jessie | `t0jbNlBVZ17f02VDIeMI` | Male | American | Raspy, old |
| Sam | `yoZ06aMxZJJ28mfd3POQ` | Male | American | Raspy, young |
| Glinda | `z9fAnlkpzviPz146aGWa` | Female | American | Witch, expressive |
| Giovanni | `zcAOhNBS3c14rBihAFp1` | Male | English-Italian | Foreigner, young |
| Mimi | `zrHiDhphv9ZnVXBqCLjz` | Female | English-Swedish | Childish, young |

### Voice Settings

```typescript
{
  stability: 0.5,           // 0-1, higher = more consistent
  similarityBoost: 0.75,    // 0-1, higher = closer to original
  style: 0,                 // 0-1, style exaggeration
  speed: 1.0                // 0.5-2.0, playback speed
}
```

### Models Available

| Model ID | Speed | Quality | Use Case |
|----------|-------|---------|----------|
| `eleven_turbo_v2` | Fastest | Good | Real-time conversations |
| `eleven_turbo_v2_5` | Fast | Better | Improved turbo |
| `eleven_flash_v2` | Very Fast | Good | Low latency |
| `eleven_flash_v2_5` | Very Fast | Better | Improved flash |
| `eleven_multilingual_v2` | Medium | Best | Multiple languages |
| `eleven_monolingual_v1` | Slow | Excellent | English only, highest quality |

### Usage Example

```typescript
import { synthesizeSpeech } from '@/lib/voice/tts';

// Using default voice (Rachel)
const audio = await synthesizeSpeech('Hello world!');

// Using specific voice
const audio = await synthesizeSpeech('Hello world!', {
  voice: '29vD33N1CtxCmqQRPOHJ', // Drew
  model: 'eleven_turbo_v2',
  stability: 0.6,
  similarityBoost: 0.8
});
```

---

## 🎤 Deepgram Speech-to-Text (STT)

### Overview
- **Purpose**: Convert speech to text (primary STT provider)
- **Model Used**: `nova-2` (most accurate)
- **Cost**: $0.0043 per minute (28% cheaper than Whisper)
- **Credit**: $200 free = ~46,500 minutes

### Models Available

| Model | Accuracy | Speed | Use Case |
|-------|----------|-------|----------|
| `nova-2` | Best | Fast | General purpose (recommended) |
| `nova` | Good | Fast | Previous generation |
| `enhanced` | Very Good | Medium | Legacy model |
| `base` | Good | Very Fast | Basic transcription |

### Features

- **Real-time streaming**: WebSocket support for live transcription
- **Word-level timestamps**: Get timing for each word
- **Speaker diarization**: Identify different speakers
- **Punctuation**: Automatic punctuation
- **Paragraphs**: Automatic paragraph detection
- **Multiple languages**: 30+ languages supported

### Usage Example

```typescript
import { transcribe } from '@/lib/voice/stt';

// Basic transcription
const result = await transcribe(audioBlob);
console.log(result.text); // "Hello, how are you?"

// With options
const result = await transcribe(audioBlob, {
  provider: 'deepgram',
  language: 'en',
  punctuate: true,
  diarize: true,
  paragraphs: true
});
```

### Real-time Streaming

```typescript
import { createRealtimeSTT } from '@/lib/voice/stt';

const connection = await createRealtimeSTT((transcript) => {
  if (transcript.isFinal) {
    console.log('Final:', transcript.text);
  } else {
    console.log('Interim:', transcript.text);
  }
});

// Send audio chunks
micStream.on('data', (chunk) => {
  connection.send(chunk);
});

connection.close();
```

---

## 🤖 OpenAI Whisper (Backup STT)

### Overview
- **Purpose**: Backup speech-to-text provider
- **Model Used**: `whisper-1`
- **Cost**: $0.006 per minute
- **Credit**: 50 credits = ~800 minutes

### Features

- **Highly accurate**: Industry-leading accuracy
- **Multilingual**: 99 languages supported
- **Auto-detection**: Automatic language detection
- **Translation**: Can translate to English
- **Timestamps**: Word-level timestamps available

### Usage Example

```typescript
import { transcribe } from '@/lib/voice/stt';

// Force Whisper
const result = await transcribe(audioBlob, {
  provider: 'whisper',
  language: 'en',
  temperature: 0
});
```

### Supported Formats

- MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM
- Max file size: 25 MB

---

## 🧠 OpenAI GPT-4o-mini (Conversation)

### Overview
- **Purpose**: Power voice conversation logic
- **Model**: `gpt-4o-mini`
- **Cost**: Very low (~$0.005 per conversation)
- **Speed**: Fast response times

### Features

- **JSON mode**: Structured output
- **Context window**: 128K tokens
- **Function calling**: Extract structured data
- **Streaming**: Real-time responses

### Usage in Voice Agent

```typescript
import { startVoiceConversation, processVoiceTurn } from '@/lib/ai/voice-agent';

// Start conversation
const session = await startVoiceConversation();
console.log(session.sessionId);

// Process user input
const response = await processVoiceTurn(
  session.sessionId,
  "I work with React and TypeScript"
);

console.log(response.extractedData); // { skills: ['React', 'TypeScript'] }
console.log(response.nextQuestion); // "How many years of experience?"
```

---

## 🎯 OpenAI Realtime API (Future Enhancement)

### Overview
- **Purpose**: End-to-end voice conversations
- **Status**: Available but not implemented yet
- **Cost**: Higher than current stack

### Features

- **Speech-to-speech**: Direct audio in/out
- **Low latency**: ~300ms total
- **Interruption handling**: Natural turn-taking
- **11 voices**: More expressive options

### Why Not Using It Now

1. **Cost**: More expensive than our modular approach
2. **Flexibility**: Less control over individual components
3. **Current stack works**: Deepgram + GPT-4o-mini + ElevenLabs is faster and cheaper

### Future Migration Path

When OpenAI Realtime becomes more cost-effective:
- Replace entire voice pipeline
- Simpler architecture
- Potentially better latency

---

## 📊 Cost Comparison

### Per 3-Minute Conversation

| Service | Provider | Cost | Notes |
|---------|----------|------|-------|
| STT | Deepgram | $0.0129 | Primary |
| STT | Whisper | $0.018 | Backup |
| TTS | ElevenLabs | $0.075 | 5 responses |
| LLM | GPT-4o-mini | $0.005 | Conversation |
| **Total** | **Current Stack** | **$0.09** | Per user |
| Alternative | OpenAI Realtime | $0.15+ | More expensive |

### With Your Credits

- **Deepgram $200**: ~2,200 complete onboardings
- **OpenAI 50 credits**: ~800 minutes (backup only)
- **ElevenLabs**: Depends on your balance

---

## 🔧 Configuration

### Environment Variables

```env
# OpenAI (Whisper + GPT-4o-mini)
OPENAI_API_KEY=sk-proj-...

# ElevenLabs (TTS)
ELEVENLABS_API_KEY=sk_...

# Deepgram (Primary STT)
DEEPGRAM_API_KEY=...

# Provider Selection
PRIMARY_STT_PROVIDER=deepgram
PRIMARY_TTS_PROVIDER=elevenlabs
```

### Changing Default Voice

In `src/lib/voice/tts.ts`:

```typescript
const CONFIG = {
  DEFAULT_VOICE_ID: '21m00Tcm4TlvDq8ikWAM', // Rachel
  DEFAULT_MODEL: 'eleven_turbo_v2',
};
```

To use a different voice, change the `DEFAULT_VOICE_ID` to any voice ID from the table above.

---

## 🚀 Performance Benchmarks

### Latency (Average)

| Operation | Provider | Latency | Notes |
|-----------|----------|---------|-------|
| STT | Deepgram | ~200ms | Pre-recorded |
| STT | Whisper | ~500ms | Pre-recorded |
| STT | Deepgram RT | ~100ms | Streaming |
| TTS | ElevenLabs | ~1-2s | Text length dependent |
| LLM | GPT-4o-mini | ~500ms | Extraction + generation |
| **Total Turn** | **Current Stack** | **~2-3s** | User speaks → Agent responds |

### Accuracy

| Provider | Model | WER* | Notes |
|----------|-------|------|-------|
| Deepgram | nova-2 | ~5% | Best for conversational |
| Whisper | whisper-1 | ~3% | Slightly better accuracy |
| OpenAI | Realtime | ~4% | Comparable |

*WER = Word Error Rate (lower is better)

---

## 🎨 Voice Customization Tips

### For Professional/Business Use
- **Rachel** (default) - Warm, professional
- **Sarah** - Calm, soothing
- **Emily** - Pleasant, clear

### For Casual/Friendly Use
- **Charlie** - Casual Australian
- **Chris** - Casual American
- **Freya** - Expressive, young

### For Authoritative/News Use
- **Daniel** - Deep, authoritative British
- **Liam** - Articulate news voice
- **Alice** - Confident British news

### For Narration/Storytelling
- **Josh** - Deep narrative
- **Michael** - Audiobook quality
- **Brian** - Deep narration

---

## 🔍 Troubleshooting

### "Voice ID not found"
- **Issue**: Using voice name instead of voice ID
- **Fix**: Use voice ID (e.g., `21m00Tcm4TlvDq8ikWAM` not `Rachel`)

### "Voice not available for your tier"
- **Issue**: Some voices require Creator or Enterprise tier
- **Fix**: Upgrade ElevenLabs plan or use free tier voices

### "Rate limit exceeded"
- **Issue**: Too many requests
- **Fix**: Implement rate limiting or upgrade plan

### "Poor audio quality"
- **Issue**: Low stability or similarity boost
- **Fix**: Increase stability to 0.7-0.8 for more consistent output

---

## 📚 Additional Resources

- [ElevenLabs API Docs](https://elevenlabs.io/docs/api-reference/introduction)
- [Deepgram API Docs](https://developers.deepgram.com/docs)
- [OpenAI Whisper Docs](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI GPT-4o-mini Docs](https://platform.openai.com/docs/models/gpt-4o-mini)
- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)

---

**Last Updated**: January 31, 2026
**Voice Agent Version**: 1.0
