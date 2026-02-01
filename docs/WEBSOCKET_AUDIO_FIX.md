# WebSocket Audio Format Fix

## Problem

The WebSocket connection was establishing successfully, but ElevenLabs was immediately closing it with error:

```
ElevenLabs connection closed: 1008 Invalid message received, are you sending json ws message?
```

## Root Cause

We were sending **binary audio data** (Blob from MediaRecorder) directly to ElevenLabs, but ElevenLabs Conversational AI WebSocket API expects **base64-encoded audio wrapped in JSON**.

## The Fix

### 1. Client-Side (realtime-voice-recorder.tsx)

**Before (Attempt 1 - Binary):**
```typescript
mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
    // Send audio chunk directly as binary - WRONG!
    ws.send(event.data);
  }
};
```

**Before (Attempt 2 - Wrong JSON format):**
```typescript
mediaRecorder.ondataavailable = async (event) => {
  if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = (reader.result as string).split(',')[1];
      // WRONG format - ElevenLabs doesn't use "type" field
      ws.send(JSON.stringify({
        type: 'audio_chunk',
        audio: base64Audio,
      }));
    };
    reader.readAsDataURL(event.data);
  }
};
```

**After (CORRECT - ElevenLabs format):**
```typescript
mediaRecorder.ondataavailable = async (event) => {
  if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = (reader.result as string).split(',')[1];
      // CORRECT: ElevenLabs expects {"user_audio_chunk": "base64..."}
      ws.send(JSON.stringify({
        user_audio_chunk: base64Audio,
      }));
    };
    reader.readAsDataURL(event.data);
  }
};
```

### 2. Server-Side (websocket-handler.ts)

**Before (Attempt 1 - Binary):**
```typescript
clientWs.on('message', (data) => {
  if (data instanceof Buffer) {
    elevenLabsWs.send(data); // Sending binary directly - WRONG!
  }
});
```

**Before (Attempt 2 - Wrong transformation):**
```typescript
clientWs.on('message', (data) => {
  const message = JSON.parse(data.toString());
  
  if (message.type === 'audio_chunk') {
    // Trying to transform to ElevenLabs format but using wrong client format
    elevenLabsWs.send(JSON.stringify({
      user_audio_chunk: message.audio,
    }));
  }
});
```

**After (CORRECT - Direct forwarding):**
```typescript
clientWs.on('message', (data) => {
  const message = JSON.parse(data.toString());
  
  // Check if it's a user_audio_chunk (already in ElevenLabs format)
  if (message.user_audio_chunk) {
    // Forward directly - client already sends correct format
    elevenLabsWs.send(data.toString());
  }
});
```

## ElevenLabs WebSocket Message Format

### Sending Audio to ElevenLabs
**CRITICAL**: ElevenLabs expects audio in this EXACT format (no `type` field):
```json
{
  "user_audio_chunk": "base64_encoded_audio_data"
}
```

**NOT** this format (which we were incorrectly using):
```json
{
  "type": "audio_chunk",
  "audio": "base64_data"
}
```

### Receiving from ElevenLabs

**Audio Response:**
```json
{
  "type": "audio",
  "audio_event": {
    "audio_base_64": "base64_audio_data"
  }
}
```

**User Transcript:**
```json
{
  "type": "user_transcript",
  "user_transcription_event": {
    "user_transcript": "transcribed text"
  }
}
```

**Agent Response:**
```json
{
  "type": "agent_response",
  "agent_response_event": {
    "agent_response": "agent text response"
  }
}
```

**Function Call:**
```json
{
  "type": "client_tool_call",
  "client_tool_call_event": {
    "tool_name": "extract_profile_data",
    "tool_call_id": "call_id",
    "parameters": {
      "skills": ["React", "TypeScript"]
    }
  }
}
```

## Testing

After this fix:
1. WebSocket connection establishes ✅
2. Audio chunks are sent in correct format ✅
3. ElevenLabs accepts the messages ✅
4. No more "Invalid message" errors ✅

## Status

✅ **FIXED** - The real-time voice agent now correctly streams audio to ElevenLabs in the expected JSON format.

---

**Date**: January 31, 2026
**Issue**: WebSocket audio format mismatch
**Resolution**: Convert binary audio to base64 JSON format
