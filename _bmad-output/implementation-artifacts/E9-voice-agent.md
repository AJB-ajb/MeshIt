# Epic 9: Voice Agent (POST-MVP)

**Status:** Post-MVP  
**Priority:** P2  
**Dependencies:** E1, E3 (Profile Management)  
**Blocks:** None  
**Parallel With:** N/A (future work)

## Epic Goal

Voice-based onboarding using Whisper (STT) and ElevenLabs (TTS) for conversational profile creation.

## Stories

| Story | Title | Status | Dependencies |
|-------|-------|--------|--------------|
| 9.1 | Implement Whisper STT Service | post-mvp | API key |
| 9.2 | Implement ElevenLabs TTS Service | post-mvp | API key |
| 9.3 | Build Voice Conversation Flow | post-mvp | 9.1, 9.2 |
| 9.4 | Create Voice Onboarding UI | post-mvp | 9.3 |
| 9.5 | Add Voice Match Explanations | post-mvp | 9.2, E5 |

## FR Coverage (Future)

- FR26: Users can create profile via voice conversation
- FR27: Voice agent asks follow-up questions
- FR28: Voice agent reads match explanations aloud

## Estimated Effort

~8 hours total

## Scope Note

This epic is planned for post-MVP. The MVP will use text-based onboarding (E3). Voice Agent provides an enhanced, conversational onboarding experience for future releases.
