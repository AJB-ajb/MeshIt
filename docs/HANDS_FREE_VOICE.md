# Hands-Free Real-Time Voice Conversation

## What Changed

**Before:** Push-to-talk button system (click "Talk" → record → click "Stop" → wait for response)

**Now:** **Hands-free automatic conversation** (just speak naturally, AI listens and responds automatically)

## How It Works

### 1. **Automatic Voice Detection**
- Your microphone is **always listening** when connected
- Detects when you start speaking automatically
- No need to press any buttons

### 2. **Intelligent Turn-Taking**
- **You speak** → AI listens and pauses
- **AI responds** → Your mic pauses automatically
- **AI finishes** → Your mic resumes listening
- Natural back-and-forth conversation

### 3. **Silence Detection**
- Records for 3 seconds after you stop talking
- Auto-processes your speech
- Sends to Deepgram → Gemini → ElevenLabs
- Plays AI response automatically

## Visual Indicators

### Status Lights
- 🟢 **Green (Connected)** - WebRTC connection active
- 🔵 **Blue (Listening)** - Microphone is capturing your voice
- 🟣 **Purple (Agent Speaking)** - AI is responding

### What You'll See
```
Connected ● Listening... ● Agent Idle      ← You can speak
Connected ● Idle        ● Agent Speaking   ← AI is responding  
Connected ● Listening... ● Agent Idle      ← Ready for you again
```

## Controls

### Mute/Unmute Button
- **🎤 Mute**: Stops listening (privacy mode)
- **🔇 Unmute**: Resumes automatic listening

### Complete Profile Button
- Manual override to finish conversation
- Only enabled when profile data is collected

## User Experience Flow

```
1. Click "Start Voice Conversation"
   ↓
2. Connection established (green light)
   ↓
3. AI greets you automatically
   ↓
4. Just START SPEAKING naturally
   ↓
5. AI processes and responds
   ↓
6. Continue speaking when AI finishes
   ↓
7. Repeat until profile complete
```

## No More Button Clicking!

**Old way:**
1. Click "Talk" 🔴
2. Speak
3. Click "Stop" ⏹️
4. Wait for processing
5. Listen to response
6. Repeat steps 1-5

**New way:**
1. Click "Start" (once)
2. **Just talk naturally!** 🎤
3. AI handles everything automatically

## Technical Details

### Voice Activity Detection (VAD)
- Uses browser MediaRecorder API
- Continuous audio stream capture
- Automatic silence detection (3s threshold)
- Smart pause/resume when AI speaks

### Audio Pipeline
```
Your voice → MediaRecorder → Blob chunks
    ↓
Silence detected (3s) → Stop & process
    ↓
Send to /api/livekit/agent/turn
    ↓
Deepgram STT → Gemini LLM → ElevenLabs TTS
    ↓
Play audio response → Resume listening
```

### Interruption Handling
- AI speaking? Your mic auto-pauses
- AI finishes? Your mic auto-resumes
- Error occurs? Mic resumes listening
- Seamless conversation flow

## Privacy & Control

### When Microphone is Active
- ✅ Only when "Listening..." indicator shows
- ✅ Only when NOT muted
- ✅ Only when AI is NOT speaking
- ✅ Stops after 3 seconds of silence

### How to Pause
1. Click "🎤 Mute" button
2. Microphone stops immediately
3. Click "🔇 Unmute" to resume

### Data Handling
- Audio sent to Deepgram for transcription only
- No persistent audio storage
- Transcripts processed by Gemini for profile extraction
- Session ends when you complete profile

## Troubleshooting

### "Microphone permission denied"
- Click allow when browser prompts
- Check browser settings → Site permissions
- Ensure microphone is connected

### "Not detecting my voice"
- Check microphone is default input device
- Ensure "Listening..." indicator is blue
- Speak clearly and wait for silence detection (3s)
- Check volume levels in system settings

### "AI keeps interrupting me"
- This is a WebRTC latency issue
- Try speaking in shorter phrases
- Wait for "Agent Speaking" indicator to go idle

### "Audio not auto-playing"
- Browser may block auto-play
- Click anywhere on page to enable audio
- Check browser audio permissions

## Testing Concurrent Users

Want to test multiple users? Open these in separate tabs:

**Tab 1:** http://localhost:3000/onboarding/voice-livekit
**Tab 2:** http://localhost:3000/onboarding/voice-livekit
**Tab 3:** http://localhost:3000/onboarding/voice-livekit

Each gets their own room and can talk simultaneously! (Up to 5 concurrent on free tier)

## Configuration

### LiveKit Setup Required

Before using, configure LiveKit in `.env`:

```bash
# Option 1: LiveKit Cloud (5 concurrent users free)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# Option 2: Self-hosted (unlimited users)
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

**Quick setup:** Run `./scripts/setup-livekit.sh`

## Demo URL

Once server is running:
```
http://localhost:3000/onboarding/voice-livekit
```

## Benefits

✅ **Natural conversation** - No button clicking
✅ **Hands-free** - Focus on what you're saying
✅ **Real-time** - Instant response via WebRTC
✅ **Concurrent users** - Multiple people can use it simultaneously
✅ **Intelligent turn-taking** - AI knows when to listen/speak
✅ **Privacy-first** - Mute anytime with one click

---

**Ready to try it?** Just start the server and speak naturally! 🎤
