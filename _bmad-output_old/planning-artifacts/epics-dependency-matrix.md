---
title: MeshIt - Epic & Story Dependency Matrix
version: "1.0"
date: 2026-01-31
author: John (PM Agent)
status: Ready for Sprint Planning
team_size: 3
---

# MeshIt — Epic & Story Dependency Matrix

This document maps all dependencies between epics and stories to enable parallel development across a 3-person team.

---

## 1. Epic Dependency Overview

### Visual Dependency Graph

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    E8: UI/UX                             │
                    │            (FULLY INDEPENDENT - START DAY 1)             │
                    └─────────────────────────────────────────────────────────┘
                    
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              E1: FOUNDATION                                      │
│                         (REQUIRED BY ALL OTHERS)                                 │
└───────────┬─────────────────────────────────────────┬──────────────────────────┘
            │                                         │
            ▼                                         ▼
    ┌───────────────┐                         ┌───────────────┐
    │  E2: GitHub   │                         │  E3: Profile  │
    │  Enrichment   │                         │  Management   │
    │ (INDEPENDENT) │                         │ (text forms)  │
    └───────────────┘                         └───────┬───────┘
                                                      │
                                                      ▼
                                              ┌───────────────┐
                                              │  E4: Project  │
                                              │  Management   │
                                              └───────┬───────┘
                                                      │
                                                      ▼
                                              ┌───────────────┐
                                              │  E5: Matching │
                                              │    Engine     │
                                              └───────┬───────┘
                                                      │
                          ┌───────────────────────────┼───────────────────────────┐
                          ▼                           ▼                           ▼
                  ┌───────────────┐           ┌───────────────┐           ┌───────────────┐
                  │ E6: Notifi-   │           │ E7: Messaging │           │               │
                  │   cations     │           │               │           │               │
                  └───────────────┘           └───────────────┘           └───────────────┘

═══════════════════════════════════════════════════════════════════════════════════
                              POST-MVP (After Testing Complete)
═══════════════════════════════════════════════════════════════════════════════════
                                              
                                      ┌───────────────┐
                                      │  E9: Voice    │
                                      │    Agent      │
                                      │ (POST-MVP)    │
                                      └───────────────┘
```

---

## 2. Epic Dependency Matrix (MVP)

| Epic | Depends On | Blocks | Can Run Parallel With |
|------|------------|--------|----------------------|
| **E1: Foundation** | None | E2, E3, E4, E5, E6, E7 | E8 |
| **E2: GitHub Enrichment** | E1 | None (optional merge with E3) | E3, E8 |
| **E3: Profile Management** | E1 | E4 | E2, E8 |
| **E4: Project Management** | E1, E3 (AI services) | E5 | E8 |
| **E5: Matching Engine** | E3, E4 | E6, E7 | E8 |
| **E6: Notifications** | E1, E5 | None | E7, E8 |
| **E7: Messaging** | E1, E5 | None | E6, E8 |
| **E8: UI/UX** | **NONE** | None | **ALL EPICS** |

### Post-MVP Epic

| Epic | Depends On | Notes |
|------|------------|-------|
| **E9: Voice Agent** | MVP Complete + Tested | Replaces text forms with conversational onboarding |

---

## 3. Independence Analysis

### 🟢 FULLY INDEPENDENT (No Prerequisites)

These can start **immediately** with any team member:

| Epic/Story | Why Independent | Assigned Track |
|------------|-----------------|----------------|
| **E8: UI/UX (ALL STORIES)** | Pure frontend, no backend needed | Track A |
| **E1-S1**: Next.js project init | First step, nothing before it | Track B |
| **E1-S2**: shadcn/ui setup | Only needs E1-S1 | Track B |

### 🟡 SOFT DEPENDENCIES (Can Start Early, Integrate Later)

These can be **developed in isolation** and integrated when dependencies are ready:

| Epic/Story | Soft Dependency | Can Build With Mocks |
|------------|-----------------|---------------------|
| **E2: GitHub Enrichment** | Needs GitHub OAuth token | Yes - mock token, integrate later |
| **E3-S1 to E3-S2**: AI services | Needs API keys only | Yes - test in isolation |

### 🔴 HARD DEPENDENCIES (Must Wait)

These **cannot start** until prerequisites complete:

| Epic/Story | Hard Dependency | Why |
|------------|-----------------|-----|
| **E4: Project Management** | E3-S1, E3-S2 (AI extraction + embeddings) | Reuses same AI services |
| **E5: Matching Engine** | E3-S7, E4-S6 (embeddings in DB) | Needs vectors to search |
| **E6: Notifications** | E5-S2 (match creation) | Nothing to notify about |
| **E7: Messaging** | E5-S8 (match acceptance) | Messaging unlocked on accept |

---

## 4. Story-Level Dependency Matrix

### Epic 1: Foundation

| Story | Depends On | Blocks | Independent? |
|-------|------------|--------|--------------|
| E1-S1: Next.js init | None | All E1 stories | ✅ YES |
| E1-S2: shadcn/ui setup | E1-S1 | E9 integration | ❌ |
| E1-S3: Supabase project | None | E1-S4 to E1-S10 | ✅ YES |
| E1-S4: DB schema SQL | E1-S3 | E4, E5, E6, E7, E8 | ❌ |
| E1-S5: Google OAuth | E1-S3 | E1-S10 | ❌ |
| E1-S6: GitHub OAuth | E1-S3 | E1-S10, E3 | ❌ |
| E1-S7: LinkedIn OAuth | E1-S3 | E1-S10 | ❌ |
| E1-S8: Slack OAuth | E1-S3 | E1-S10 | ❌ |
| E1-S9: Discord OAuth | E1-S3 | E1-S10 | ❌ |
| E1-S10: Auth flow | E1-S5 to E1-S9 | E2, E3, E4 | ❌ |
| E1-S11: Basic layout | E1-S1, E1-S2 | E9 pages | ❌ |
| E1-S12: Env variables | E1-S3 | Deployment | ❌ |

**Parallelization opportunity:** E1-S1 and E1-S3 can run simultaneously (different systems).

---

### Epic 2: Voice Agent

| Story | Depends On | Blocks | Independent? |
|-------|------------|--------|--------------|
| E2-S1: Whisper service | API key only | E2-S5 | ✅ YES (with key) |
| E2-S2: ElevenLabs service | API key only | E2-S5 | ✅ YES (with key) |
| E2-S3: Voice Agent state machine | None | E2-S5 | ✅ YES |
| E2-S4: Voice recording UI | E1-S2 (shadcn) | E2-S7 | ❌ |
| E2-S5: Conversation turn handling | E2-S1, E2-S2, E2-S3 | E2-S6 | ❌ |
| E2-S6: Profile extraction | E2-S5, E4-S1 | E2-S7 | ❌ |
| E2-S7: Voice onboarding page | E2-S4, E2-S6 | None | ❌ |
| E2-S8: Test full flow | E2-S7 | None | ❌ |

**Parallelization opportunity:** E2-S1, E2-S2, E2-S3 can ALL run in parallel.

---

### Epic 3: GitHub Enrichment

| Story | Depends On | Blocks | Independent? |
|-------|------------|--------|--------------|
| E3-S1: GitHub API client | API docs only | E3-S2 | ✅ YES |
| E3-S2: Repo/language extraction | E3-S1 | E3-S3 | ❌ |
| E3-S3: Profile inference | E3-S2 | E3-S4 | ❌ |
| E3-S4: Profile merger | E3-S3, E4-S1 | E3-S6 | ❌ |
| E3-S5: Store GitHub data | E1-S4 (schema) | E3-S6 | ❌ |
| E3-S6: OAuth callback sync | E1-S6, E3-S4, E3-S5 | None | ❌ |

**Parallelization opportunity:** E3-S1 can start immediately while E1 is in progress.

---

### Epic 4: Profile Management

| Story | Depends On | Blocks | Independent? |
|-------|------------|--------|--------------|
| E4-S1: Gemini extraction | API key only | E4-S3, E5-S1 | ✅ YES (with key) |
| E4-S2: OpenAI embeddings | API key only | E4-S7, E5-S6 | ✅ YES (with key) |
| E4-S3: Profile extraction API | E1-S10, E4-S1 | E4-S5 | ❌ |
| E4-S4: Profile CRUD APIs | E1-S4, E1-S10 | E4-S5, E4-S6 | ❌ |
| E4-S5: Text onboarding page | E4-S3, E4-S4 | None | ❌ |
| E4-S6: Profile edit page | E4-S4 | None | ❌ |
| E4-S7: Store embeddings | E1-S4, E4-S2 | E6-S1 | ❌ |

**Parallelization opportunity:** E4-S1 and E4-S2 can run in parallel, independent of E1.

---

### Epic 5: Project Management

| Story | Depends On | Blocks | Independent? |
|-------|------------|--------|--------------|
| E5-S1: Project extraction prompts | E4-S1 (reuse Gemini) | E5-S2 | ❌ |
| E5-S2: Project CRUD APIs | E1-S4, E1-S10, E5-S1 | E5-S3 | ❌ |
| E5-S3: Project creation page | E5-S2 | None | ❌ |
| E5-S4: Project listing page | E5-S2 | None | ❌ |
| E5-S5: Project detail page | E5-S2 | None | ❌ |
| E5-S6: Store project embeddings | E4-S2 (reuse), E5-S2 | E6-S1 | ❌ |

**Parallelization opportunity:** E5-S3, E5-S4, E5-S5 can all run in parallel once E5-S2 is done.

---

### Epic 6: Matching Engine

| Story | Depends On | Blocks | Independent? |
|-------|------------|--------|--------------|
| E6-S1: pgvector similarity search | E4-S7, E5-S6 | E6-S2 | ❌ |
| E6-S2: Match generation logic | E6-S1 | E6-S3, E7, E8 | ❌ |
| E6-S3: Match explanation (LLM) | E6-S2, E4-S1 | E6-S4 | ❌ |
| E6-S4: Voice explanations | E6-S3, E2-S2 | None | ❌ |
| E6-S5: Match API routes | E6-S2 | E6-S6, E6-S7 | ❌ |
| E6-S6: Match cards UI | E6-S5 | E6-S7 | ❌ |
| E6-S7: Matches page | E6-S6 | E6-S8 | ❌ |
| E6-S8: Apply/accept/decline | E6-S7 | E7, E8 | ❌ |

**Parallelization opportunity:** E6-S6 (UI) can be built with mock data while E6-S1 to E6-S5 are in progress.

---

### Epic 7: Notifications

| Story | Depends On | Blocks | Independent? |
|-------|------------|--------|--------------|
| E7-S1: Supabase Realtime setup | E1-S3 | E7-S2 | ❌ |
| E7-S2: Notification DB triggers | E1-S4, E6-S2 | E7-S3 | ❌ |
| E7-S3: Notification bell UI | E1-S2 | E7-S4 | ❌ (UI can mock) |
| E7-S4: Notification dropdown | E7-S3 | None | ❌ |
| E7-S5: Toast notifications | E7-S1 | None | ❌ |
| E7-S6: Resend email setup | API key only | E7-S7 | ✅ YES |
| E7-S7: Match notification emails | E7-S6, E6-S2 | None | ❌ |
| E7-S8: Acceptance emails | E7-S6, E6-S8 | None | ❌ |

**Parallelization opportunity:** E7-S3, E7-S4 (UI) and E7-S6 (Resend) can start early.

---

### Epic 8: Messaging

| Story | Depends On | Blocks | Independent? |
|-------|------------|--------|--------------|
| E8-S1: Supabase Realtime messages | E1-S3, E1-S4 | E8-S2 | ❌ |
| E8-S2: Message API routes | E8-S1, E6-S8 | E8-S3 | ❌ |
| E8-S3: Chat UI component | E1-S2 | E8-S4 | ❌ (UI can mock) |
| E8-S4: Messages page | E8-S3, E8-S2 | None | ❌ |
| E8-S5: Share Slack/Discord action | E8-S4 | None | ❌ |

**Parallelization opportunity:** E8-S3 (Chat UI) can be built with mock data early.

---

### Epic 9: UI/UX

| Story | Depends On | Blocks | Independent? |
|-------|------------|--------|--------------|
| E9-S1: Design tokens | None | E9-S2 to E9-S9 | ✅ YES |
| E9-S2: Button variants | E9-S1 | None | ✅ YES |
| E9-S3: Form components | E9-S1 | None | ✅ YES |
| E9-S4: Card components | E9-S1 | None | ✅ YES |
| E9-S5: Modal/dialog | E9-S1 | None | ✅ YES |
| E9-S6: Landing page | E9-S1 to E9-S5 | None | ❌ |
| E9-S7: Dashboard layout | E9-S1 to E9-S5 | None | ❌ |
| E9-S8: Responsive breakpoints | E9-S6, E9-S7 | None | ❌ |
| E9-S9: Loading states | E9-S1 | None | ✅ YES |

**Parallelization opportunity:** E9-S2, E9-S3, E9-S4, E9-S5, E9-S9 can ALL run in parallel after E9-S1.

---

## 5. Recommended Team Allocation (3 Developers)

### Sprint 1: Foundation + Parallel Tracks

| Dev | Focus | Stories |
|-----|-------|---------|
| **Dev 1 (Frontend)** | UI/UX components | E9-S1 → E9-S2, E9-S3, E9-S4, E9-S5, E9-S9 (parallel) → E9-S6, E9-S7 |
| **Dev 2 (Backend)** | Foundation + DB | E1-S1 → E1-S3 → E1-S4 → E1-S5, E1-S6, E1-S7, E1-S8, E1-S9 (parallel) → E1-S10 |
| **Dev 3 (AI)** | AI services (isolated) | E4-S1, E4-S2, E2-S1, E2-S2, E2-S3 (all parallel, no deps) |

### Sprint 2: Core Features

| Dev | Focus | Stories |
|-----|-------|---------|
| **Dev 1 (Frontend)** | Onboarding + Profile UI | E2-S4, E2-S7, E4-S5, E4-S6 |
| **Dev 2 (Backend)** | Profile + Project APIs | E4-S3, E4-S4, E4-S7 → E5-S1, E5-S2, E5-S6 |
| **Dev 3 (AI)** | Voice Agent + GitHub | E2-S5, E2-S6 → E3-S1, E3-S2, E3-S3 |

### Sprint 3: Matching + Notifications

| Dev | Focus | Stories |
|-----|-------|---------|
| **Dev 1 (Frontend)** | Match UI + Notifications UI | E6-S6, E6-S7, E7-S3, E7-S4 |
| **Dev 2 (Backend)** | Matching Engine | E6-S1, E6-S2, E6-S5, E6-S8 |
| **Dev 3 (AI)** | Explanations + Email | E6-S3, E6-S4, E7-S6, E7-S7 |

### Sprint 4: Messaging + Polish

| Dev | Focus | Stories |
|-----|-------|---------|
| **Dev 1 (Frontend)** | Messaging UI | E8-S3, E8-S4, E8-S5 |
| **Dev 2 (Backend)** | Messaging + Realtime | E7-S1, E7-S2, E7-S5, E8-S1, E8-S2 |
| **Dev 3 (AI)** | Integration + Testing | E3-S4, E3-S5, E3-S6, E2-S8 |

---

## 6. Critical Path

The **longest dependency chain** determines minimum time to MVP:

```
E1-S1 → E1-S3 → E1-S4 → E4-S4 → E4-S7 → E5-S2 → E5-S6 → E6-S1 → E6-S2 → E6-S8 → E8-S2
  │                                                                              │
  └──────────────────────── CRITICAL PATH (11 stories) ──────────────────────────┘
```

**Estimated critical path time:** ~15-18 hours (with 3 devs working parallel tracks)

---

## 7. Quick Reference: What Can Start NOW

### Day 1 Kickoff (No Dependencies)

| Story | Description | Any Dev Can Do |
|-------|-------------|----------------|
| **E9-S1** | Design system tokens | ✅ |
| **E1-S1** | Next.js project init | ✅ |
| **E1-S3** | Supabase project setup | ✅ |
| **E4-S1** | Gemini extraction service | ✅ (with API key) |
| **E4-S2** | OpenAI embedding service | ✅ (with API key) |
| **E2-S1** | Whisper transcription | ✅ (with API key) |
| **E2-S2** | ElevenLabs TTS | ✅ (with API key) |
| **E2-S3** | Voice Agent state machine | ✅ |
| **E3-S1** | GitHub API client | ✅ |
| **E7-S6** | Resend email setup | ✅ (with API key) |

**Total: 10 stories can start immediately with zero dependencies.**

---

## 8. Dependency Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully independent, can start anytime |
| ❌ | Has dependencies, check matrix |
| → | Sequential dependency (must complete before) |
| ∥ | Can run in parallel |

---

*Dependency Matrix v1.0 — Ready for sprint planning with 3-person team.*
