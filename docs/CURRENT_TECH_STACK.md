# Current Tech Stack - MeshIt Voice Agent

**Last Updated**: January 31, 2026  
**Status**: Turn-based voice onboarding (working, but not real-time)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Client)                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │  React 19 + Next.js 16 (App Router)                │    │
│  │  - Voice Recorder Component (Web Audio API)        │    │
│  │  - Audio Player Component (HTML5 Audio)            │    │
│  │  - Conversation Display                            │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  /api/voice-agent/start   - Start conversation     │    │
│  │  /api/voice-agent/turn    - Process user turn      │    │
│  │  /api/voice-agent/complete - Finish onboarding     │    │
│  │  /api/voice-agent/test    - API key validation     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Voice Agent Services                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Voice Agent Orchestrator (voice-agent.ts)         │    │
│  │  - Session management (in-memory Map)              │    │
│  │  - Conversation state machine                      │    │
│  │  - Profile data extraction                         │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Deepgram   │    │    OpenAI    │    │  ElevenLabs  │
│   Nova-2     │    │ GPT-4o-mini  │    │  Turbo v2    │
│   (STT)      │    │    (LLM)     │    │    (TTS)     │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 📦 Core Technologies

### Frontend Framework
- **Next.js 16.1.6** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **Turbopack** - Fast bundler (Next.js 16 default)

### UI Components
- **Radix UI** - Headless component primitives
  - `@radix-ui/react-avatar` - Avatar component
  - `@radix-ui/react-slot` - Composition utility
  - `@radix-ui/react-tabs` - Tab component
- **Lucide React** - Icon library
- **next-themes** - Dark mode support
- **class-variance-authority** - Component variants
- **clsx** + **tailwind-merge** - Class name utilities

### Browser APIs
- **Web Audio API** - Microphone recording
  - `navigator.mediaDevices.getUserMedia()` - Mic access
  - `MediaRecorder` - Audio capture
- **HTML5 Audio** - Audio playback
  - `<audio>` element for TTS responses

---

## 🤖 AI Services Stack

### 1. Speech-to-Text (STT)

#### Primary: Deepgram Nova-2
- **SDK**: `@deepgram/sdk` v4.11.3
- **Model**: Nova-2
- **Mode**: Pre-recorded (not streaming yet)
- **Credit**: €200 (~46,500 minutes)
- **Cost**: €0.0043/minute
- **Features**:
  - 95% accuracy
  - 36 languages
  - Word-level timestamps
  - Speaker diarization
  - Smart formatting

#### Backup: OpenAI Whisper
- **SDK**: `openai` v6.17.0
- **Model**: Whisper-1
- **Credit**: €50 (~8,333 minutes)
- **Cost**: €0.006/minute
- **Features**:
  - 97% accuracy
  - 99 languages
  - Translation support

**Current Usage**: Deepgram primary, Whisper backup

---

### 2. Conversation AI (LLM)

#### Current: OpenAI GPT-4o-mini
- **SDK**: `openai` v6.17.0
- **Model**: gpt-4o-mini
- **Credit**: €50
- **Cost**: €0.15/1M input tokens, €0.60/1M output tokens
- **Config**:
  - Temperature: 0.7
  - Max tokens: 1024
  - Response format: JSON object
- **Features**:
  - 128K context window
  - Function calling
  - JSON mode
  - Structured output

#### Alternative: Google Gemini 2.0 Flash
- **SDK**: `@google/generative-ai` v0.24.1
- **Model**: gemini-2.0-flash
- **Credit**: FREE (15 RPM limit)
- **Features**:
  - 1M token context window
  - Multimodal (text, images, audio, video)
  - Function calling
  - Code execution
  - Google Search grounding

**Current Usage**: GPT-4o-mini (will switch to Gemini to save credit)

---

### 3. Text-to-Speech (TTS)

#### Primary: ElevenLabs Turbo v2
- **SDK**: `@elevenlabs/elevenlabs-js` v2.33.0
- **Model**: eleven_turbo_v2
- **Voice**: Rachel (ID: `21m00Tcm4TlvDq8ikWAM`)
- **Credit**: Pay-as-you-go
- **Cost**: €0.30/1K characters
- **Config**:
  - Stability: 0.5
  - Similarity boost: 0.75
- **Features**:
  - 50+ voices
  - Voice cloning
  - Streaming support
  - Emotion control
  - Speed adjustment

**Current Usage**: ElevenLabs Turbo v2 with Rachel voice

---

## 🔄 Current Data Flow

### 1. Start Conversation
```
User clicks "Voice Onboarding"
  ↓
POST /api/voice-agent/start
  ↓
voice-agent.ts: startVoiceConversation()
  ↓
OpenAI GPT-4o-mini: Generate greeting
  ↓
ElevenLabs: Synthesize greeting audio
  ↓
Return: { sessionId, greeting, audio (base64) }
  ↓
Browser: Play audio automatically
```

### 2. User Turn
```
User clicks record → speaks → clicks stop
  ↓
Browser: Capture audio with MediaRecorder
  ↓
POST /api/voice-agent/turn (FormData with audio blob)
  ↓
Deepgram Nova-2: Transcribe audio to text
  ↓
voice-agent.ts: processVoiceTurn()
  ↓
OpenAI GPT-4o-mini: Extract data + generate next question
  ↓
ElevenLabs: Synthesize response audio
  ↓
Return: { transcription, extractedData, nextQuestion, audio, completed }
  ↓
Browser: Display messages + play audio
```

### 3. Complete Onboarding
```
Conversation state = "complete"
  ↓
POST /api/voice-agent/complete
  ↓
voice-agent.ts: completeVoiceOnboarding()
  ↓
Validate required fields
  ↓
Return: { profile: ProfileData }
  ↓
Browser: Redirect to dashboard
```

---

## 💾 Data Storage

### Session Storage (In-Memory)
- **Type**: JavaScript `Map<string, ConversationSession>`
- **Location**: `src/lib/ai/voice-agent.ts`
- **Lifetime**: Process lifetime (cleared on restart)
- **Cleanup**: 30-minute TTL via `cleanupOldSessions()`

### Session Data Structure
```typescript
interface ConversationSession {
  sessionId: string;           // "session_1738339200000_abc123"
  userId?: string;             // Optional user ID
  state: ConversationState;    // greeting | collecting | complete
  history: ConversationTurn[]; // Full conversation history
  extractedData: ProfileData;  // Accumulated profile data
  createdAt: Date;
  updatedAt: Date;
}
```

### Profile Data Structure
```typescript
interface ProfileData {
  skills?: string[];
  experience_years?: number;
  role?: string;
  interests?: string[];
  availability_hours?: number;
  collaboration_style?: string;
}
```

**Future**: Will persist to Supabase database

---

## 🧪 Testing Stack

### Unit Testing
- **Vitest 4.0.18** - Test runner
- **@testing-library/react** - React testing utilities
- **@testing-library/jest-dom** - DOM matchers
- **jsdom** - DOM environment
- **@vitest/coverage-v8** - Coverage reports

### E2E Testing
- **Playwright 1.58.1** - Browser automation
- **@playwright/test** - Test framework

### Commands
```bash
npm run test              # Run unit tests (watch mode)
npm run test:run          # Run unit tests (once)
npm run test:coverage     # Generate coverage report
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run E2E with UI
npm run test:e2e:debug    # Debug E2E tests
```

---

## 🔧 Development Tools

### Package Manager
- **pnpm 10.28.1** - Fast, disk-efficient package manager
- **Node.js >=18.17.0** - Runtime requirement

### Linting & Formatting
- **ESLint 9** - Code linting
- **eslint-config-next** - Next.js ESLint config

### Build & Deploy
- **Vercel 50.9.6** - Deployment platform
- **Next.js Build** - Production optimization

---

## 🌐 External Services

### Authentication & Database
- **Supabase** - Backend as a service
  - `@supabase/supabase-js` v2.93.3
  - `@supabase/ssr` v0.8.0
  - PostgreSQL database
  - Row-level security
  - Real-time subscriptions

### Monitoring & Analytics
- **Sentry** - Error tracking
- **PostHog** - Product analytics
  - Host: https://eu.posthog.com
  - API Key configured

### Version Control
- **GitHub** - Source control
  - Personal access token configured
  - MCP integration for IDE

### Browser Automation
- **Playwright** - E2E testing
  - MCP integration for IDE

---

## 📊 Current Performance

### Latency Breakdown (Per Turn)
```
User stops recording         0ms
─────────────────────────────────
Upload audio to server     ~200ms
Deepgram transcription     ~300ms
GPT-4o-mini generation     ~500ms
ElevenLabs synthesis      ~1000ms
Download audio             ~200ms
─────────────────────────────────
Total latency:           ~2200ms (2.2 seconds)
```

### Cost Per Conversation (3 minutes, 5 turns)
```
Deepgram STT:    3 min × €0.0043 = €0.0129
GPT-4o-mini:     5 turns × €0.0001 = €0.0005
ElevenLabs TTS:  250 chars × €0.0003 = €0.075
──────────────────────────────────────────
Total:                           €0.088
```

### Credit Capacity
```
Deepgram €200:   ~15,500 conversations
OpenAI €50:      ~100,000 conversations
ElevenLabs:      Pay-as-you-go

Bottleneck: Deepgram (but plenty of capacity)
```

---

## ⚠️ Current Limitations

### 1. Turn-Based (Not Real-Time)
- ❌ User must click record/stop
- ❌ High latency (2.2 seconds per turn)
- ❌ Cannot interrupt agent
- ❌ Feels unnatural

### 2. No Streaming
- ❌ STT is not streaming (Deepgram can stream, but not implemented)
- ❌ LLM is not streaming (GPT-4o-mini can stream, but not implemented)
- ❌ TTS is not streaming (ElevenLabs can stream, but not implemented)

### 3. In-Memory Sessions
- ❌ Sessions lost on server restart
- ❌ No persistence to database
- ❌ No session recovery

### 4. No Interruption Handling
- ❌ User cannot interrupt agent mid-sentence
- ❌ No barge-in support
- ❌ Must wait for agent to finish speaking

### 5. No Voice Activity Detection (VAD)
- ❌ User must manually click stop
- ❌ No automatic silence detection
- ❌ No automatic turn-taking

---

## 🚀 Upgrade Path to Real-Time

### Option 1: OpenAI Realtime API (Recommended First)
**Changes needed**:
- Add `@openai/realtime-api-beta` package
- Replace HTTP API with WebSocket connection
- Stream microphone audio directly to OpenAI
- Play audio responses immediately
- Add interruption handling

**Benefits**:
- ✅ All-in-one solution
- ✅ Built-in VAD and interruption
- ✅ Low latency (~200ms)
- ✅ 1-2 days to implement

**Trade-offs**:
- ⚠️ Uses OpenAI credit (€0.42/conversation)
- ⚠️ GPT-4o only (more expensive)

---

### Option 2: Gemini Live API (Best for Production)
**Changes needed**:
- Add WebSocket connection to Gemini Live API
- Handle audio encoding (16-bit PCM @ 16kHz)
- Handle audio decoding (16-bit PCM @ 24kHz)
- Implement function calling for profile extraction
- Add session management

**Benefits**:
- ✅ FREE tier (15 RPM)
- ✅ Built-in VAD and interruption
- ✅ Low latency (~300ms)
- ✅ Multimodal support

**Trade-offs**:
- ⚠️ More complex implementation
- ⚠️ Must use Gemini 2.5 Flash (not 2.0 Flash)
- ⚠️ 3-4 days to implement

---

### Option 3: Custom Pipeline (Future)
**Changes needed**:
- Implement WebSocket server for orchestration
- Connect Deepgram streaming STT
- Stream to Gemini for responses
- Stream to ElevenLabs for TTS
- Optimize latency and buffering
- Add custom interruption logic

**Benefits**:
- ✅ Best voice quality (ElevenLabs)
- ✅ Maximum credit utilization (Deepgram €200)
- ✅ Lowest cost (€0.09/conversation)
- ✅ Full control

**Trade-offs**:
- ⚠️ Most complex (500-800 lines of code)
- ⚠️ Higher latency (~500ms)
- ⚠️ 1-2 weeks to implement

---

## 📚 Key Files

### Frontend
- `src/app/(dashboard)/onboarding/voice/page.tsx` - Voice onboarding page
- `src/components/voice/voice-recorder.tsx` - Microphone recording
- `src/components/voice/audio-player.tsx` - Audio playback
- `src/components/voice/conversation-display.tsx` - Message display

### Backend
- `src/app/api/voice-agent/start/route.ts` - Start conversation endpoint
- `src/app/api/voice-agent/turn/route.ts` - Process turn endpoint
- `src/app/api/voice-agent/complete/route.ts` - Complete endpoint
- `src/app/api/voice-agent/test/route.ts` - API key test endpoint

### Services
- `src/lib/ai/voice-agent.ts` - Conversation orchestrator
- `src/lib/ai/prompts.ts` - AI prompts
- `src/lib/voice/stt.ts` - Speech-to-text service
- `src/lib/voice/tts.ts` - Text-to-speech service
- `src/lib/voice/types.ts` - TypeScript types

### Configuration
- `package.json` - Dependencies
- `.env` - Environment variables
- `tsconfig.json` - TypeScript config
- `next.config.js` - Next.js config
- `tailwind.config.ts` - Tailwind config

---

## 🎯 Summary

### What Works
✅ Turn-based voice conversation  
✅ Accurate transcription (Deepgram Nova-2)  
✅ Natural responses (GPT-4o-mini)  
✅ High-quality voices (ElevenLabs)  
✅ Profile data extraction  
✅ Session management  
✅ Cost-efficient (€0.088/conversation)  

### What's Missing
❌ Real-time streaming  
❌ Low latency (<500ms)  
❌ Interruption support  
❌ Voice activity detection  
❌ WebSocket connections  
❌ Database persistence  

### Next Steps
1. Implement OpenAI Realtime API (1-2 days)
2. Test with real users
3. Switch to Gemini Live API (FREE)
4. Optimize with custom pipeline (future)

---

**Status**: Production-ready for turn-based voice onboarding  
**Next Milestone**: Real-time streaming implementation  
**Timeline**: 1-2 days for OpenAI Realtime API proof of concept
