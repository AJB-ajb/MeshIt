# Real-Time Voice Implementation Guide

**Goal**: Transform the current "record → process → play" flow into true real-time streaming conversation like talking to a human.

---

## 🎯 Current vs. Desired Flow

### Current Flow (Turn-Based)
```
User clicks record → records for N seconds → stops → 
uploads to server → STT → LLM → TTS → 
downloads audio → plays → waits for completion → 
user clicks record again
```

**Problems**:
- ❌ Not natural - feels like walkie-talkie
- ❌ High latency (3-5 seconds per turn)
- ❌ Can't interrupt the agent
- ❌ Awkward pauses between turns

### Desired Flow (Real-Time Streaming)
```
User speaks → audio streams live → 
STT transcribes in real-time → 
LLM responds in real-time → 
TTS synthesizes in real-time → 
audio plays immediately → 
user can interrupt anytime
```

**Benefits**:
- ✅ Natural conversation
- ✅ Low latency (~200-500ms)
- ✅ Can interrupt agent mid-sentence
- ✅ Feels like talking to a human

---

## 🔧 Technical Architecture

### Option 1: OpenAI Realtime API (Recommended - Easiest)

**What it is**: End-to-end real-time voice API with built-in STT, LLM, and TTS.

#### Pros
- ✅ **All-in-one solution** - Single WebSocket handles everything
- ✅ **Built-in interruption** - Automatic barge-in support
- ✅ **Low latency** - Optimized for real-time
- ✅ **6 voices included** - No separate TTS needed
- ✅ **Function calling** - Can extract profile data in real-time
- ✅ **Simple implementation** - ~200 lines of code

#### Cons
- ⚠️ **Uses OpenAI credit** - €0.06/minute input + €0.24/minute output
- ⚠️ **GPT-4o only** - Can't use GPT-4o-mini (more expensive)
- ⚠️ **Limited voices** - Only 6 preset voices

#### Cost Analysis
```
Typical 3-minute conversation:
- Input audio:  3 min × €0.06 = €0.18
- Output audio: 1 min × €0.24 = €0.24
────────────────────────────────────
Total:          €0.42 per conversation

Your €50 credit = ~119 conversations
```

**Verdict**: Best for prototyping and testing. Use your €50 OpenAI credit for this!

---

### Option 2: Gemini Live API (Best for Production - FREE)

**What it is**: Google's real-time multimodal API with WebSocket streaming.

#### Pros
- ✅ **FREE tier available** - 15 RPM limit
- ✅ **Multimodal** - Audio, video, text input
- ✅ **Low latency** - Optimized for real-time
- ✅ **Built-in interruption** - Barge-in support
- ✅ **Tool integration** - Function calling, code execution
- ✅ **24 languages** - Multilingual support
- ✅ **Session memory** - Retains context

#### Cons
- ⚠️ **Gemini 2.0 Flash NOT supported** - Must use Gemini 1.5 Pro or 2.5 Flash
- ⚠️ **More complex setup** - Need to handle audio encoding/decoding
- ⚠️ **Rate limited** - 15 RPM on free tier
- ⚠️ **Still in beta** - API may change

#### Supported Models
- ✅ **Gemini 1.5 Pro** - Supported (paid)
- ✅ **Gemini 2.5 Flash** - Supported (check pricing)
- ❌ **Gemini 2.0 Flash** - NOT supported
- ❌ **Gemini 1.5 Flash** - NOT supported

#### Cost Analysis
```
FREE tier:
- 15 requests per minute
- Enough for 1-2 concurrent conversations
- Perfect for voice onboarding

Paid tier (if needed):
- Check current pricing for Gemini 2.5 Flash
- Likely cheaper than OpenAI Realtime API
```

**Verdict**: Best for production after testing. Use FREE tier!

---

### Option 3: Custom Pipeline (Maximum Control)

**What it is**: Combine Deepgram (STT) + Gemini/GPT (LLM) + ElevenLabs (TTS) with WebSockets.

#### Pros
- ✅ **Maximum flexibility** - Choose best provider for each part
- ✅ **Use existing credits** - Deepgram €200, Gemini FREE
- ✅ **Best quality** - ElevenLabs voices are superior
- ✅ **Full control** - Custom interruption logic

#### Cons
- ⚠️ **Most complex** - Need to orchestrate 3 services
- ⚠️ **Higher latency** - 3 network hops instead of 1
- ⚠️ **More code** - ~500-800 lines of code
- ⚠️ **Interruption handling** - Must implement yourself

#### Architecture
```
Browser
  ↓ WebSocket (audio chunks)
Deepgram STT (real-time)
  ↓ WebSocket (text chunks)
Your Server
  ↓ HTTP (text)
Gemini/GPT (streaming)
  ↓ HTTP (text chunks)
Your Server
  ↓ WebSocket (text chunks)
ElevenLabs TTS (streaming)
  ↓ WebSocket (audio chunks)
Browser (plays immediately)
```

#### Cost Analysis
```
Typical 3-minute conversation:
- Deepgram STT:   €0.0177 (3 min streaming)
- Gemini LLM:     €0.00   (FREE)
- ElevenLabs TTS: €0.075  (250 chars)
────────────────────────────────────
Total:            €0.093 per conversation

Your credits:
- Deepgram €200 = ~11,300 conversations
- Gemini FREE = unlimited (15 RPM)
- ElevenLabs pay-as-you-go
```

**Verdict**: Best quality and cost, but most complex. Use after proving concept.

---

## 🚀 Recommended Implementation Path

### Phase 1: Proof of Concept (This Week)
**Use**: OpenAI Realtime API

**Why**:
- Fastest to implement (~1-2 days)
- Proves real-time UX works
- Uses your €50 OpenAI credit
- ~119 test conversations available

**Steps**:
1. Implement WebSocket connection to OpenAI Realtime API
2. Stream microphone audio directly to API
3. Play audio responses immediately
4. Add interruption handling
5. Extract profile data using function calling
6. Test with real users

**Deliverables**:
- Working real-time voice onboarding
- User feedback on UX
- Validation that real-time is better

---

### Phase 2: Production Implementation (Next Week)
**Use**: Gemini Live API (FREE tier)

**Why**:
- FREE for 15 RPM (enough for onboarding)
- Similar UX to OpenAI Realtime
- Saves your OpenAI credit
- Production-ready

**Steps**:
1. Switch WebSocket to Gemini Live API
2. Handle audio encoding (16-bit PCM @ 16kHz input)
3. Handle audio decoding (16-bit PCM @ 24kHz output)
4. Implement function calling for profile extraction
5. Add session management
6. Deploy to production

**Deliverables**:
- FREE real-time voice onboarding
- Scalable to many users
- OpenAI credit saved for other features

---

### Phase 3: Optimization (Future)
**Use**: Custom Pipeline (Deepgram + Gemini + ElevenLabs)

**Why**:
- Best voice quality (ElevenLabs)
- Maximum credit utilization (Deepgram €200)
- Full control over UX
- Lowest long-term cost

**Steps**:
1. Implement WebSocket server for orchestration
2. Connect Deepgram streaming STT
3. Stream to Gemini for responses
4. Stream to ElevenLabs for TTS
5. Optimize latency and buffering
6. Add advanced interruption logic

**Deliverables**:
- Production-grade real-time system
- Best quality and cost
- Fully optimized UX

---

## 💻 Implementation Details

### OpenAI Realtime API (Phase 1)

#### 1. Install SDK
```bash
npm install openai
```

#### 2. Client-Side WebSocket Connection
```typescript
// src/lib/voice/realtime-client.ts
import { RealtimeClient } from '@openai/realtime-api-beta';

export class VoiceRealtimeClient {
  private client: RealtimeClient;
  private audioContext: AudioContext;
  
  constructor(apiKey: string) {
    this.client = new RealtimeClient({
      apiKey,
      model: 'gpt-4o-realtime-preview',
    });
    
    this.audioContext = new AudioContext({ sampleRate: 24000 });
  }
  
  async connect() {
    await this.client.connect();
    
    // Configure session
    await this.client.updateSession({
      instructions: `You are a friendly voice assistant helping users create their MeshIt profile.
      
Ask about:
- Their skills and expertise
- Years of experience
- Current role
- Interests and hobbies
- Availability hours per week
- Collaboration style

Extract this information and call the save_profile function when complete.`,
      voice: 'alloy', // or 'echo', 'fable', 'onyx', 'nova', 'shimmer'
      input_audio_transcription: { model: 'whisper-1' },
      turn_detection: { type: 'server_vad' }, // Voice activity detection
    });
    
    // Add function for profile extraction
    await this.client.addTool({
      name: 'save_profile',
      description: 'Save the user profile data',
      parameters: {
        type: 'object',
        properties: {
          skills: { type: 'array', items: { type: 'string' } },
          experience_years: { type: 'number' },
          role: { type: 'string' },
          interests: { type: 'array', items: { type: 'string' } },
          availability_hours: { type: 'number' },
          collaboration_style: { type: 'string' },
        },
        required: ['skills', 'experience_years', 'role'],
      },
    }, async (args) => {
      console.log('Profile data extracted:', args);
      // Save to your backend
      await fetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return { success: true };
    });
  }
  
  async startRecording() {
    // Get microphone
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        sampleRate: 24000,
        channelCount: 1,
      }
    });
    
    // Stream to OpenAI
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        const arrayBuffer = await event.data.arrayBuffer();
        const int16Array = new Int16Array(arrayBuffer);
        const base64 = this.arrayBufferToBase64(int16Array);
        
        this.client.appendInputAudio(base64);
      }
    };
    
    mediaRecorder.start(100); // Send chunks every 100ms
    return mediaRecorder;
  }
  
  onAudioResponse(callback: (audio: ArrayBuffer) => void) {
    this.client.on('conversation.item.audio.delta', (event) => {
      // Decode base64 audio
      const audioData = this.base64ToArrayBuffer(event.delta);
      callback(audioData);
    });
  }
  
  onTranscript(callback: (text: string) => void) {
    this.client.on('conversation.item.input_audio_transcription.completed', (event) => {
      callback(event.transcript);
    });
  }
  
  private arrayBufferToBase64(buffer: Int16Array): string {
    const bytes = new Uint8Array(buffer.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
```

#### 3. React Component
```typescript
// src/app/(dashboard)/onboarding/voice/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { VoiceRealtimeClient } from '@/lib/voice/realtime-client';

export default function RealtimeVoicePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const clientRef = useRef<VoiceRealtimeClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  useEffect(() => {
    // Initialize client
    const client = new VoiceRealtimeClient(process.env.NEXT_PUBLIC_OPENAI_API_KEY!);
    clientRef.current = client;
    
    // Initialize audio context for playback
    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    
    return () => {
      audioContextRef.current?.close();
    };
  }, []);
  
  const connect = async () => {
    if (!clientRef.current) return;
    
    await clientRef.current.connect();
    
    // Listen for audio responses
    clientRef.current.onAudioResponse((audioData) => {
      // Play audio immediately
      playAudio(audioData);
    });
    
    // Listen for transcripts
    clientRef.current.onTranscript((text) => {
      setTranscript(prev => [...prev, `You: ${text}`]);
    });
    
    setIsConnected(true);
  };
  
  const startConversation = async () => {
    if (!clientRef.current) return;
    
    const mediaRecorder = await clientRef.current.startRecording();
    setIsRecording(true);
    
    // Stop recording when user clicks stop
    return mediaRecorder;
  };
  
  const playAudio = async (audioData: ArrayBuffer) => {
    if (!audioContextRef.current) return;
    
    const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };
  
  return (
    <div className="p-8">
      <h1>Real-Time Voice Onboarding</h1>
      
      {!isConnected && (
        <button onClick={connect}>Connect</button>
      )}
      
      {isConnected && !isRecording && (
        <button onClick={startConversation}>Start Conversation</button>
      )}
      
      {isRecording && (
        <div>
          <p>🎤 Listening... Speak naturally!</p>
          <div className="transcript">
            {transcript.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Gemini Live API (Phase 2)

#### WebSocket Connection
```typescript
// src/lib/voice/gemini-live-client.ts
export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async connect() {
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;
    
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      console.log('✅ Connected to Gemini Live API');
      
      // Send setup message
      this.ws?.send(JSON.stringify({
        setup: {
          model: 'models/gemini-2.5-flash',
          generation_config: {
            temperature: 0.7,
            max_output_tokens: 1024,
          },
          system_instruction: {
            parts: [{
              text: 'You are a friendly voice assistant...'
            }]
          },
          tools: [{
            function_declarations: [{
              name: 'save_profile',
              description: 'Save user profile',
              parameters: {
                type: 'object',
                properties: {
                  skills: { type: 'array' },
                  // ... other fields
                }
              }
            }]
          }]
        }
      }));
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.serverContent?.modelTurn?.parts) {
        // Handle audio response
        const audioPart = data.serverContent.modelTurn.parts.find(
          (p: any) => p.inlineData?.mimeType === 'audio/pcm'
        );
        
        if (audioPart) {
          const audioBase64 = audioPart.inlineData.data;
          this.playAudio(audioBase64);
        }
      }
    };
  }
  
  sendAudio(audioData: ArrayBuffer) {
    if (!this.ws) return;
    
    // Convert to base64
    const base64 = this.arrayBufferToBase64(audioData);
    
    this.ws.send(JSON.stringify({
      realtimeInput: {
        mediaChunks: [{
          mimeType: 'audio/pcm',
          data: base64
        }]
      }
    }));
  }
  
  private playAudio(base64Audio: string) {
    // Decode and play PCM audio at 24kHz
    const audioData = this.base64ToArrayBuffer(base64Audio);
    // ... playback logic
  }
  
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    // ... conversion logic
  }
  
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    // ... conversion logic
  }
}
```

---

## 📊 Comparison Matrix

| Feature | OpenAI Realtime | Gemini Live | Custom Pipeline |
|---------|----------------|-------------|-----------------|
| **Latency** | ⚡⚡⚡⚡⚡ 200ms | ⚡⚡⚡⚡ 300ms | ⚡⚡⚡ 500ms |
| **Cost** | €0.42/conv | FREE | €0.09/conv |
| **Complexity** | ⭐ Easy | ⭐⭐ Medium | ⭐⭐⭐⭐ Hard |
| **Voice Quality** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Best |
| **Interruption** | ✅ Built-in | ✅ Built-in | ⚠️ Custom |
| **Credit Usage** | OpenAI €50 | FREE | Deepgram €200 |
| **Time to Build** | 1-2 days | 3-4 days | 1-2 weeks |

---

## 🎯 Recommendation

### For This Week
**Use OpenAI Realtime API**
- Fastest path to real-time UX
- Proves concept with real users
- Uses your €50 OpenAI credit wisely
- ~119 test conversations available

### For Production Launch
**Switch to Gemini Live API**
- FREE tier (15 RPM)
- Similar UX to OpenAI
- Saves OpenAI credit
- Production-ready

### For Long-Term
**Build Custom Pipeline**
- Best quality (ElevenLabs voices)
- Maximum credit utilization
- Lowest cost per conversation
- Full control

---

## 📚 Resources

### OpenAI Realtime API
- Docs: https://platform.openai.com/docs/guides/realtime
- Examples: https://github.com/openai/openai-realtime-api-beta
- Pricing: https://openai.com/api/pricing

### Gemini Live API
- Docs: https://ai.google.dev/gemini-api/docs/multimodal-live
- WebSocket API: https://ai.google.dev/api/live
- Examples: https://github.com/google-gemini/live-api-examples

### Deepgram Streaming
- Docs: https://developers.deepgram.com/reference/speech-to-text/listen-streaming
- Browser Example: https://github.com/deepgram-devs/js-livestream-example

### ElevenLabs Streaming
- Docs: https://elevenlabs.io/docs/api-reference/streaming
- WebSocket: https://elevenlabs.io/docs/api-reference/websockets

---

**Next Steps**: Let me know which approach you want to start with, and I'll help you implement it! 🚀
