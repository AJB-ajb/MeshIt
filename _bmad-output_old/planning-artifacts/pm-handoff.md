---
title: PM Handoff - Epic & Story Creation Brief
version: "1.0"
date: 2026-01-31
author: Amelia (Dev Agent)
status: Ready for PM
---

# MeshIt — PM Handoff Brief

This document summarizes the MVP scope decisions and provides guidance for epic/story creation.

---

## 1. MVP Scope Summary

### ✅ CONFIRMED IN SCOPE

| Feature | Description | Priority |
|---------|-------------|----------|
| **Auth (5 providers)** | Google, GitHub, LinkedIn, Slack, Discord via Supabase Auth | P0 |
| **Voice Agent Onboarding** | 4-5 turn conversational profile creation via Whisper + ElevenLabs | P0 |
| **GitHub Profile Enrichment** | Auto-extract skills from repos on GitHub OAuth | P1 |
| **Text Profile Creation** | Fallback for users who prefer typing | P0 |
| **Profile Editing** | Users can edit AI-extracted profile data (not AI-only) | P0 |
| **Natural Language Project Posting** | AI extraction from text/voice descriptions | P0 |
| **Project Expiration** | User sets expiry date, auto-expires, can reactivate | P0 |
| **Embedding-based Matching** | pgvector cosine similarity (threshold TBD during dev) | P0 |
| **Match Explanations** | LLM-generated + voice audio output | P1 |
| **Real-time In-App Notifications** | Supabase Realtime WebSocket, toast notifications | P0 |
| **Email Notifications** | Resend for match/acceptance emails | P1 |
| **Basic Messaging** | Initial contact only (WebSocket), handoff to Slack/Discord | P2 |

### ❌ DEFERRED TO POST-MVP

- n8n automation / daily digest emails
- Calendar integration
- Rating system
- Advanced weighted matching (per spec/Matching.md)
- Location-based filtering

---

## 2. Recommended Epic Structure

### Epic 1: Foundation (E1)
**Goal:** Project scaffolding, Supabase setup, auth working

| Story | Description | Estimate |
|-------|-------------|----------|
| E1-S1 | Initialize Next.js 15 project with pnpm, TypeScript, Tailwind | 1h |
| E1-S2 | Set up shadcn/ui component library | 1h |
| E1-S3 | Create Supabase project, enable pgvector extension | 0.5h |
| E1-S4 | Run database schema SQL (all tables) | 0.5h |
| E1-S5 | Configure Google OAuth in Supabase | 0.5h |
| E1-S6 | Configure GitHub OAuth in Supabase | 0.5h |
| E1-S7 | Configure LinkedIn OAuth in Supabase | 0.5h |
| E1-S8 | Configure Slack OAuth in Supabase | 0.5h |
| E1-S9 | Configure Discord OAuth in Supabase | 0.5h |
| E1-S10 | Implement auth flow (login, callback, session) | 2h |
| E1-S11 | Create basic layout (header, nav, footer) | 1h |
| E1-S12 | Set up environment variables (.env.local, Vercel) | 0.5h |

**Dependencies:** None  
**Parallel:** Can run with E9 (UI components)

---

### Epic 2: Voice Agent (E2)
**Goal:** Conversational onboarding via voice

| Story | Description | Estimate |
|-------|-------------|----------|
| E2-S1 | Implement Whisper transcription service | 1h |
| E2-S2 | Implement ElevenLabs TTS service | 1h |
| E2-S3 | Create Voice Agent state machine | 2h |
| E2-S4 | Build voice recording UI component | 1.5h |
| E2-S5 | Implement conversation turn handling | 2h |
| E2-S6 | Extract structured profile from conversation | 1.5h |
| E2-S7 | Build voice onboarding page UI | 2h |
| E2-S8 | Test full voice onboarding flow | 1h |

**Dependencies:** E1 (auth must work)  
**Parallel:** Can run with E3, E4

---

### Epic 3: GitHub Enrichment (E3)
**Goal:** Auto-extract profile data from GitHub repos

| Story | Description | Estimate |
|-------|-------------|----------|
| E3-S1 | Implement GitHub API client | 1h |
| E3-S2 | Create repo/language extraction logic | 1.5h |
| E3-S3 | Build profile inference from repos | 1.5h |
| E3-S4 | Create profile merger (voice + GitHub) | 1h |
| E3-S5 | Store GitHub profile data in DB | 1h |
| E3-S6 | Add GitHub sync on OAuth callback | 1h |

**Dependencies:** E1 (GitHub OAuth)  
**Parallel:** Can run with E2, E4

---

### Epic 4: Profile Management (E4)
**Goal:** Profile CRUD, AI extraction, embeddings

| Story | Description | Estimate |
|-------|-------------|----------|
| E4-S1 | Implement Gemini extraction service | 1.5h |
| E4-S2 | Implement OpenAI embedding service | 1h |
| E4-S3 | Create profile extraction API route | 1h |
| E4-S4 | Create profile CRUD API routes | 1.5h |
| E4-S5 | Build text-based onboarding page | 2h |
| E4-S6 | Build profile edit page | 1.5h |
| E4-S7 | Store profile embeddings in pgvector | 1h |

**Dependencies:** E1  
**Parallel:** Can run with E2, E3

---

### Epic 5: Project Management (E5)
**Goal:** Project CRUD, AI extraction, embeddings

| Story | Description | Estimate |
|-------|-------------|----------|
| E5-S1 | Create project extraction prompts | 1h |
| E5-S2 | Create project CRUD API routes | 1.5h |
| E5-S3 | Build project creation page | 2h |
| E5-S4 | Build project listing page | 1.5h |
| E5-S5 | Build project detail page | 1.5h |
| E5-S6 | Store project embeddings in pgvector | 1h |

**Dependencies:** E4 (AI services)  
**Parallel:** After E4 AI services done

---

### Epic 6: Matching Engine (E6)
**Goal:** Vector search, match generation, explanations

| Story | Description | Estimate |
|-------|-------------|----------|
| E6-S1 | Implement pgvector similarity search | 1.5h |
| E6-S2 | Create match generation logic | 2h |
| E6-S3 | Implement match explanation generation | 1.5h |
| E6-S4 | Generate voice explanations (ElevenLabs) | 1h |
| E6-S5 | Create match API routes | 1.5h |
| E6-S6 | Build match cards UI component | 2h |
| E6-S7 | Build matches page | 1.5h |
| E6-S8 | Implement apply/accept/decline flow | 1.5h |

**Dependencies:** E4, E5 (embeddings must exist)  
**Parallel:** After E5

---

### Epic 7: Notifications (E7)
**Goal:** Real-time in-app + email notifications

| Story | Description | Estimate |
|-------|-------------|----------|
| E7-S1 | Set up Supabase Realtime subscription | 1h |
| E7-S2 | Create notification DB triggers | 1h |
| E7-S3 | Build notification bell component | 1h |
| E7-S4 | Build notification dropdown/panel | 1.5h |
| E7-S5 | Implement toast notifications | 1h |
| E7-S6 | Set up Resend email service | 0.5h |
| E7-S7 | Implement match notification emails | 1h |
| E7-S8 | Implement acceptance notification emails | 1h |

**Dependencies:** E6 (matches must be created)  
**Parallel:** After E6

---

### Epic 8: Messaging (E8)
**Goal:** Basic initial contact, handoff to external platforms

| Story | Description | Estimate |
|-------|-------------|----------|
| E8-S1 | Set up Supabase Realtime for messages | 1h |
| E8-S2 | Create message API routes | 1h |
| E8-S3 | Build simple chat UI component | 1.5h |
| E8-S4 | Build messages page with contact sharing | 1h |
| E8-S5 | Add "Share my Slack/Discord" quick action | 0.5h |

**Dependencies:** E6 (match acceptance unlocks messaging)  
**Parallel:** After E6  
**Note:** Messaging is for initial contact only. Users move to Slack/Discord for collaboration.

---

### Epic 9: UI/UX (E9)
**Goal:** Component library, pages, responsive design

| Story | Description | Estimate |
|-------|-------------|----------|
| E9-S1 | Design system tokens (colors, typography) | 1h |
| E9-S2 | Build reusable button variants | 0.5h |
| E9-S3 | Build form components (input, textarea, select) | 1h |
| E9-S4 | Build card components | 1h |
| E9-S5 | Build modal/dialog components | 1h |
| E9-S6 | Build landing page | 2h |
| E9-S7 | Build dashboard layout | 1.5h |
| E9-S8 | Implement responsive breakpoints | 1h |
| E9-S9 | Add loading states and skeletons | 1h |

**Dependencies:** None  
**Parallel:** Can run from start, independent of backend

---

## 3. Dependency Graph

```
E1 (Foundation) ─────────────────────────────────────────────────►
       │
       ├──► E2 (Voice Agent) ──────────────────────────────────►
       │
       ├──► E3 (GitHub) ───────────────────────────────────────►
       │
       ├──► E4 (Profile) ──► E5 (Project) ──► E6 (Matching) ──► E7 (Notifications)
       │                                              │
       │                                              └──► E8 (Messaging)
       │
E9 (UI/UX) ────────────────────────────────────────────────────►
       (runs parallel from start)
```

---

## 4. Parallel Workstreams

| Track | Owner | Epics | Start |
|-------|-------|-------|-------|
| **Track A: UI/Frontend** | Frontend Dev | E9, then integrate with E2-E8 | Hour 0 |
| **Track B: Backend/Core** | Backend Dev | E1 → E4 → E5 → E6 → E7 → E8 | Hour 0 |
| **Track C: AI/Voice** | AI Dev | E2, E3 (after E1 auth) | Hour 3 |

---

## 5. Acceptance Criteria Guidelines

Each story should have ACs covering:

1. **Functional:** What the feature does
2. **API:** Request/response format, error handling
3. **UI:** User-visible behavior, states (loading, error, success)
4. **Data:** What gets stored, validation rules
5. **Security:** Auth checks, RLS policies

Example AC format:
```
GIVEN a user is logged in with GitHub
WHEN the OAuth callback completes
THEN the system extracts their repos and languages
AND stores the GitHub profile data
AND merges it with any existing voice profile
```

---

## 6. Key Technical Decisions (For Reference)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Vector DB | pgvector (Supabase) | Single service, no extra infra |
| Embedding model | text-embedding-3-small | Cost-effective, 1536 dim |
| Similarity threshold | ~0.65 (TBD) | Will tune during implementation |
| Voice STT | OpenAI Whisper | Best accuracy, reasonable cost |
| Voice TTS | ElevenLabs | Natural voice, fast |
| Real-time | Supabase Realtime (WebSocket) | Built-in, handles notifications + messaging |
| Email | Resend | Simple API, good deliverability |
| Auth providers | Google, GitHub, LinkedIn, Slack, Discord | Multiple social logins for easy onboarding |
| Messaging scope | Basic handoff | Initial contact only, users move to external platforms |
| Profile editing | User-editable | AI extracts, user confirms/edits |
| Project expiration | Auto-expire + reactivate | User sets date, can reactivate expired projects |

---

## 7. Documents Updated

- [x] `planning-artifacts/prd.md` — v1.1 with MVP scope
- [x] `planning-artifacts/architecture.md` — v1.1 with Voice Agent, GitHub, Notifications

---

*Ready for PM to create detailed stories with acceptance criteria.*
