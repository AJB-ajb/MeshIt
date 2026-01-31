# MeshIt - Epics & Stories Master List

**Version:** 2.0  
**Last Updated:** 2026-01-31  
**Total Epics:** 9 (8 MVP + 1 Post-MVP)  
**Total Stories:** 62

---

## Quick Navigation

| Epic | Name | Stories | Status | Priority |
|------|------|---------|--------|----------|
| [E1](#e1-foundation) | Foundation | 12 | MVP | P0 |
| [E2](#e2-github-enrichment) | GitHub Enrichment | 6 | MVP | P1 |
| [E3](#e3-profile-management) | Profile Management | 7 | MVP | P0 |
| [E4](#e4-project-management) | Project Management | 7 | MVP | P0 |
| [E5](#e5-matching-engine) | Matching Engine | 6 | MVP | P0 |
| [E6](#e6-notifications) | Notifications | 6 | MVP | P1 |
| [E7](#e7-messaging) | Messaging | 5 | MVP | P1 |
| [E8](#e8-uiux) | UI/UX | 9 | MVP | P0 |
| [E9](#e9-voice-agent-post-mvp) | Voice Agent | 5 | Post-MVP | P2 |

---

## E1: Foundation

**Document:** [E1-foundation.md](./E1-foundation.md)  
**Dependencies:** None  
**Blocks:** E2, E3, E4, E5, E6, E7

| Story | Title | Document | Dependencies | Status |
|-------|-------|----------|--------------|--------|
| 1.1 | Initialize Next.js Project | [E1-S1.md](./E1-S1.md) | None | ready-for-dev |
| 1.2 | Set Up shadcn/ui | [E1-S2.md](./E1-S2.md) | 1.1 | ready-for-dev |
| 1.3 | Create Supabase Project | [E1-S3.md](./E1-S3.md) | None | ready-for-dev |
| 1.4 | Run Database Schema | [E1-S4.md](./E1-S4.md) | 1.3 | ready-for-dev |
| 1.5 | Configure Google OAuth | [E1-S5.md](./E1-S5.md) | 1.3 | ready-for-dev |
| 1.6 | Configure GitHub OAuth | [E1-S6.md](./E1-S6.md) | 1.3 | ready-for-dev |
| 1.7 | Configure LinkedIn OAuth | [E1-S7.md](./E1-S7.md) | 1.3 | ready-for-dev |
| 1.8 | Configure Slack OAuth | [E1-S8.md](./E1-S8.md) | 1.3 | ready-for-dev |
| 1.9 | Configure Discord OAuth | [E1-S9.md](./E1-S9.md) | 1.3 | ready-for-dev |
| 1.10 | Implement Auth Flow | [E1-S10.md](./E1-S10.md) | 1.5-1.9 | ready-for-dev |
| 1.11 | Create Basic Layout | [E1-S11.md](./E1-S11.md) | 1.1, 1.2 | ready-for-dev |
| 1.12 | Set Up Environment Variables | [E1-S12.md](./E1-S12.md) | 1.3 | ready-for-dev |

---

## E2: GitHub Enrichment

**Document:** [E2-github-enrichment.md](./E2-github-enrichment.md)  
**Dependencies:** E1 (GitHub OAuth)  
**Blocks:** None

| Story | Title | Document | Dependencies | Status |
|-------|-------|----------|--------------|--------|
| 2.1 | Implement GitHub API Client | [E2-S1.md](./E2-S1.md) | E1-S6 | ready-for-dev |
| 2.2 | Create Repo/Language Extraction | [E2-S2.md](./E2-S2.md) | 2.1 | ready-for-dev |
| 2.3 | Build Profile Inference | [E2-S3.md](./E2-S3.md) | 2.2 | ready-for-dev |
| 2.4 | Create Profile Merger | [E2-S4.md](./E2-S4.md) | 2.3, E3-S1 | ready-for-dev |
| 2.5 | Store GitHub Profile Data | [E2-S5.md](./E2-S5.md) | E1-S4 | ready-for-dev |
| 2.6 | Add GitHub Sync on OAuth Callback | [E2-S6.md](./E2-S6.md) | 2.4, 2.5, E1-S10 | ready-for-dev |

---

## E3: Profile Management

**Document:** [E3-profile-management.md](./E3-profile-management.md)  
**Dependencies:** E1 (Foundation)  
**Blocks:** E4, E5

| Story | Title | Document | Dependencies | Status |
|-------|-------|----------|--------------|--------|
| 3.1 | Implement Gemini Extraction Service | [E3-S1.md](./E3-S1.md) | API key | ready-for-dev |
| 3.2 | Implement OpenAI Embedding Service | [E3-S2.md](./E3-S2.md) | API key | ready-for-dev |
| 3.3 | Create Profile Extraction API Route | [E3-S3.md](./E3-S3.md) | 3.1, E1-S10 | ready-for-dev |
| 3.4 | Create Profile CRUD API Routes | [E3-S4.md](./E3-S4.md) | E1-S4, E1-S10 | ready-for-dev |
| 3.5 | Build Text-Based Onboarding Page | [E3-S5.md](./E3-S5.md) | 3.3, 3.4 | ready-for-dev |
| 3.6 | Build Profile Edit Page | [E3-S6.md](./E3-S6.md) | 3.4 | ready-for-dev |
| 3.7 | Store Profile Embeddings | [E3-S7.md](./E3-S7.md) | 3.2, E1-S4 | ready-for-dev |

---

## E4: Project Management

**Document:** [E4-project-management.md](./E4-project-management.md)  
**Dependencies:** E1, E3  
**Blocks:** E5

| Story | Title | Document | Dependencies | Status |
|-------|-------|----------|--------------|--------|
| 4.1 | Implement Project Extraction Service | [E4-S1.md](./E4-S1.md) | 3.1 | ready-for-dev |
| 4.2 | Create Project CRUD API Routes | [E4-S2.md](./E4-S2.md) | E1-S4, E1-S10 | ready-for-dev |
| 4.3 | Build Project Creation Page | [E4-S3.md](./E4-S3.md) | 4.1, 4.2 | ready-for-dev |
| 4.4 | Build Project List Page | [E4-S4.md](./E4-S4.md) | 4.2 | ready-for-dev |
| 4.5 | Build Project Detail Page | [E4-S5.md](./E4-S5.md) | 4.2 | ready-for-dev |
| 4.6 | Store Project Embeddings | [E4-S6.md](./E4-S6.md) | 3.2, E1-S4 | ready-for-dev |
| 4.7 | Implement Project Expiration | [E4-S7.md](./E4-S7.md) | E1-S4 | ready-for-dev |

---

## E5: Matching Engine

**Document:** [E5-matching-engine.md](./E5-matching-engine.md)  
**Dependencies:** E3, E4 (embeddings)  
**Blocks:** E6, E7

| Story | Title | Document | Dependencies | Status |
|-------|-------|----------|--------------|--------|
| 5.1 | Implement Profile-to-Project Matching | [E5-S1.md](./E5-S1.md) | E3-S7, E4-S6 | ready-for-dev |
| 5.2 | Implement Project-to-Profile Matching | [E5-S2.md](./E5-S2.md) | E3-S7, E4-S6 | ready-for-dev |
| 5.3 | Create Match API Routes | [E5-S3.md](./E5-S3.md) | 5.1, 5.2 | ready-for-dev |
| 5.4 | Build Match Results Page | [E5-S4.md](./E5-S4.md) | 5.3 | ready-for-dev |
| 5.5 | Build Match Detail Page | [E5-S5.md](./E5-S5.md) | 5.3 | ready-for-dev |
| 5.6 | Generate Match Explanations | [E5-S6.md](./E5-S6.md) | 5.1, 5.2 | ready-for-dev |

---

## E6: Notifications

**Document:** [E6-notifications.md](./E6-notifications.md)  
**Dependencies:** E5  
**Blocks:** None

| Story | Title | Document | Dependencies | Status |
|-------|-------|----------|--------------|--------|
| 6.1 | Set Up Supabase Realtime | [E6-S1.md](./E6-S1.md) | E1-S4 | ready-for-dev |
| 6.2 | Create Notification Service | [E6-S2.md](./E6-S2.md) | 6.1 | ready-for-dev |
| 6.3 | Build Notification Bell Component | [E6-S3.md](./E6-S3.md) | 6.2 | ready-for-dev |
| 6.4 | Create Notification List Page | [E6-S4.md](./E6-S4.md) | 6.2 | ready-for-dev |
| 6.5 | Implement Email Notifications | [E6-S5.md](./E6-S5.md) | 6.2 | ready-for-dev |
| 6.6 | Trigger Match Notifications | [E6-S6.md](./E6-S6.md) | 6.2, E5 | ready-for-dev |

---

## E7: Messaging

**Document:** [E7-messaging.md](./E7-messaging.md)  
**Dependencies:** E5  
**Blocks:** None

| Story | Title | Document | Dependencies | Status |
|-------|-------|----------|--------------|--------|
| 7.1 | Create Message API Routes | [E7-S1.md](./E7-S1.md) | E1-S4, E1-S10 | ready-for-dev |
| 7.2 | Build Message Initiation UI | [E7-S2.md](./E7-S2.md) | 7.1, E5-S5 | ready-for-dev |
| 7.3 | Build Conversation List Page | [E7-S3.md](./E7-S3.md) | 7.1 | ready-for-dev |
| 7.4 | Build Conversation Detail Page | [E7-S4.md](./E7-S4.md) | 7.1 | ready-for-dev |
| 7.5 | Add Real-time Message Updates | [E7-S5.md](./E7-S5.md) | 7.1, E6-S1 | ready-for-dev |

---

## E8: UI/UX

**Document:** [E8-ui-ux.md](./E8-ui-ux.md)  
**Dependencies:** None (can start Day 1)  
**Blocks:** None

| Story | Title | Document | Dependencies | Status |
|-------|-------|----------|--------------|--------|
| 8.1 | Design System Tokens | [E8-S1.md](./E8-S1.md) | None | ready-for-dev |
| 8.2 | Responsive Layout System | [E8-S2.md](./E8-S2.md) | 8.1 | ready-for-dev |
| 8.3 | Dark Mode Support | [E8-S3.md](./E8-S3.md) | 8.1 | ready-for-dev |
| 8.4 | Loading States & Skeletons | [E8-S4.md](./E8-S4.md) | 8.1 | ready-for-dev |
| 8.5 | Error States & Empty States | [E8-S5.md](./E8-S5.md) | 8.1 | ready-for-dev |
| 8.6 | PWA Configuration | [E8-S6.md](./E8-S6.md) | None | ready-for-dev |
| 8.7 | Animations & Micro-interactions | [E8-S7.md](./E8-S7.md) | 8.1 | ready-for-dev |
| 8.8 | Accessibility Audit | [E8-S8.md](./E8-S8.md) | All E8 | ready-for-dev |
| 8.9 | Landing Page | [E8-S9.md](./E8-S9.md) | 8.1, 8.2 | ready-for-dev |

---

## E9: Voice Agent (POST-MVP)

**Document:** [E9-voice-agent.md](./E9-voice-agent.md)  
**Dependencies:** E1, E3  
**Blocks:** None

| Story | Title | Document | Dependencies | Status |
|-------|-------|----------|--------------|--------|
| 9.1 | Implement Whisper STT Service | [E9-S1.md](./E9-S1.md) | API key | post-mvp |
| 9.2 | Implement ElevenLabs TTS Service | [E9-S2.md](./E9-S2.md) | API key | post-mvp |
| 9.3 | Build Voice Conversation Flow | [E9-S3.md](./E9-S3.md) | 9.1, 9.2 | post-mvp |
| 9.4 | Create Voice Onboarding UI | [E9-S4.md](./E9-S4.md) | 9.3 | post-mvp |
| 9.5 | Add Voice Match Explanations | [E9-S5.md](./E9-S5.md) | 9.2, E5 | post-mvp |

---

## Day 1 Kickoff - Parallel Workstreams

### Team of 3 Recommended Split:

**Developer 1 (Backend/Infra):**
- E1-S1: Initialize Next.js Project
- E1-S3: Create Supabase Project
- E1-S4: Run Database Schema
- E1-S12: Environment Variables

**Developer 2 (Auth/Integration):**
- E1-S5 through E1-S9: All OAuth providers
- E1-S10: Auth Flow
- E3-S1: Gemini Extraction (can start with API key)

**Developer 3 (UI/UX):**
- E8-S1: Design System Tokens
- E8-S6: PWA Configuration
- E8-S9: Landing Page
- E1-S2: shadcn/ui setup
- E1-S11: Basic Layout

---

## File Index

All story documents are located in: `_bmad-output/implementation-artifacts/`

```
E1-foundation.md
E1-S1.md through E1-S12.md

E2-github-enrichment.md
E2-S1.md through E2-S6.md

E3-profile-management.md
E3-S1.md through E3-S7.md

E4-project-management.md
E4-S1.md through E4-S7.md

E5-matching-engine.md
E5-S1.md through E5-S6.md

E6-notifications.md
E6-S1.md through E6-S6.md

E7-messaging.md
E7-S1.md through E7-S5.md

E8-ui-ux.md
E8-S1.md through E8-S9.md

E9-voice-agent.md
E9-S1.md through E9-S5.md
```
