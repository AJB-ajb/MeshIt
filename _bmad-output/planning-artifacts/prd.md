---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - expedited-synthesis
  - dev-review-v1.1
inputDocuments:
  - spec/Mesh.md
  - spec/Matching.md
  - docs/GitGraph_Project_Documentation.md
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  projectDocs: 3
classification:
  projectType: Web Application (PWA)
  domain: Social/Marketplace - Collaboration & Matching
  complexity: Medium-High
  projectContext: Greenfield
---

# Product Requirements Document - MeshIt

**Author:** IBK  
**Date:** 2026-01-31  
**Version:** 1.1 (Dev Review Update)

> **Changelog v1.1:** Updated MVP scope per stakeholder decisions — Voice input/output IN, GitHub integration IN, Real-time notifications IN, In-app notifications IN. Matching algorithm deferred to implementation phase.

---

## Executive Summary

**MeshIt** is an AI-powered project collaboration matching platform that connects people with complementary skills and interests for small team projects (2-5 people). Unlike existing tools (Slack, Discord, Meetup) that require manual searching and random team formation, MeshIt uses **semantic embeddings** to understand what users bring and what projects need — then matches them intelligently.

**Core Differentiator:** Natural language in → AI-powered semantic matching out. Users describe themselves and their projects in plain language; the system does the rest.

---

## 1. Problem Statement

### The Pain
Finding collaborators for projects today requires high effort:
- Scanning Slack/WhatsApp channels manually
- Posting "looking for X" messages that get lost
- Large communities don't scale for individual matching
- Skill levels and personal compatibility are never explicit
- Teams form randomly; projects stall or fail due to mismatch

### The Gap
Existing tools match on surface-level signals (job title, programming language) or don't match at all. Nobody is understanding **how someone works**, what problems they solve, or whether they're compatible with a specific project's needs.

### The Opportunity
If we can deeply understand what someone brings (via their description + optional signals like GitHub) and what a project needs, we can match the right people to the right projects — fast.

---

## 2. Product Vision

**Tagline:** *"Stop posting 'looking for teammates' in Slack. Let AI find your perfect match."*

### Vision Statement
MeshIt makes finding collaborators as easy as describing what you need. Post a project in plain language, and within seconds, see the 3-5 people most likely to be a great fit — with explanations of why they matched.

### Success Looks Like
- A hackathon participant posts "Building an AI-powered recipe app, need someone good at mobile UI" and gets matched with the right person in under 30 seconds
- A student finds course project partners without scrolling through 200 Discord messages
- Teams that form through MeshIt have higher completion rates than random teams

---

## 3. Target Users

### Primary Personas

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| **Hackathon Hannah** | Participating in hackathons, needs teammates fast | Speed, skill matching, availability alignment |
| **Student Sam** | Finding course project partners | Location/schedule compatibility, skill level matching |
| **Side-Project Pete** | Has an idea, needs collaborators | Finding people excited about the same problem domain |
| **Mentor Maria** | Wants to help others learn | Finding mentees at the right skill level |

### Secondary Personas
- Event organizers (bulk team formation)
- Open source maintainers (finding contributors)

### NOT Target Users (Initially)
- Large enterprises with formal recruiting processes
- Long-term employment matching (this is project-focused)

---

## 4. Core Features (MVP Scope)

### 4.1 User Onboarding & Profile
- **One-click OAuth** (Google + GitHub) — no forms, no friction
  - GitHub OAuth enables automatic profile enrichment from repos/commits
- **Conversational Voice Agent for Profile Creation** (MVP):
  - 4-5 turn voice conversation to gather profile information
  - Voice input via OpenAI Whisper (speech-to-text)
  - AI asks follow-up questions to extract complete profile
  - Voice output via ElevenLabs (text-to-speech) for conversational UX
  - Fallback: Text input for users who prefer typing
- **Natural language profile creation**: User describes themselves in 30 seconds of text/voice
  - "I'm a backend developer with 3 years of Python experience, interested in AI and healthcare tech. I prefer async collaboration and can commit 10-15 hours/week."
- **AI extracts structured data** from description:
  - Skills, interests, availability, collaboration style, experience level
- **GitHub Profile Enrichment** (MVP):
  - On GitHub OAuth login, automatically extract:
    - Programming languages from repos
    - Contribution patterns (commit frequency, collaboration style)
    - Project types and domains
  - Merge with voice/text profile data
- **Profile embeddings generated** for matching

### 4.2 Project Posting
- **Natural language project creation**: Paste from Slack/WhatsApp or describe in text/voice
  - "Building a Minecraft-style collaborative IDE, need 2-3 people with WebGL or game dev experience, hackathon this weekend"
- **AI extracts**:
  - Required skills, team size, timeline, commitment level
- **Project embeddings generated** for matching

### 4.3 Matching Engine
- **Embedding-based semantic matching**:
  - Profile embeddings ↔ Project embeddings
  - Cosine similarity search
- **Match results**: Top 3-5 candidates per project
- **Match explanations**: Why this person matched (generated by LLM)

### 4.4 Match Interaction
- **Project creators** see match cards with:
  - Profile summary
  - Match score (e.g., 87%)
  - Why they matched
  - "Invite" button
- **Contributors** see projects they matched with:
  - Project description
  - Why they're a fit
  - "Apply" or "Decline"

### 4.5 Messaging
- **Basic instant messaging** between matched users (WebSocket via Supabase Realtime)
- **Purpose:** Initial contact only — not intended as primary communication platform
- **Handoff to external platforms:** Users share their Slack/Discord/WhatsApp links to continue collaboration
- **Social auth integration:** LinkedIn, Slack, Discord OAuth enables easy profile sharing

### 4.6 Notifications
- **Real-time In-App Notifications** (MVP):
  - Supabase Realtime for instant match notifications
  - Notification bell/badge in app header
  - Toast notifications for new matches
- **Push/Email Notifications** (MVP):
  - Browser push notifications for matches
  - Email notifications via Resend
- Daily digest for non-urgent matches (post-MVP enhancement)

---

## 5. Optional Enhancements (Post-MVP)

| Feature | Description | Value |
|---------|-------------|-------|
| **Collaboration Style Analysis** | Hume AI analysis of communication patterns | Match on working style, not just skills |
| **Calendar Integration** | Auto-suggest time slots based on availability | Reduce scheduling friction |
| **Rating System** | Post-project reviews (objective, not reputation-gaming) | Trust building |
| **Daily Digest Emails** | AI-generated summary of matches | Reduce notification fatigue |
| **Advanced Matching Algorithm** | Weighted multi-dimensional scoring per spec/Matching.md | Higher match quality |

---

## 6. User Flows

### Flow 1: New User Onboarding (Voice Agent)
```
Landing page → "Sign up with Google/GitHub" → OAuth
        ↓
[If GitHub] Auto-extract profile from repos/commits
        ↓
Voice Agent initiates conversation:
  Turn 1: "Hi! Tell me about yourself - what do you do?"
  Turn 2: "What skills are you strongest in?"
  Turn 3: "What kind of projects interest you?"
  Turn 4: "How many hours per week can you commit?"
  Turn 5: "Do you prefer sync or async collaboration?"
        ↓
AI processes all turns → Shows extracted profile preview
        ↓
User confirms/edits → Profile saved → Dashboard
```

### Flow 1b: New User Onboarding (Text Fallback)
```
Landing page → "Sign up with Google/GitHub" → OAuth
        ↓
[If GitHub] Auto-extract profile from repos/commits
        ↓
"Tell us about yourself" (text box)
        ↓
AI processes → Shows extracted profile preview
        ↓
"Looks good!" → Profile saved → Dashboard
```

### Flow 2: Post a Project
```
Dashboard → "Post Project"
        ↓
Text box: "Describe your project and who you need"
(or paste from Slack/WhatsApp)
        ↓
AI extracts → Preview project details
        ↓
Confirm → Project live → Matching begins
        ↓
See matches in ~10-30 seconds
```

### Flow 3: Receive & Accept Match
```
Notification: "You matched with a project!"
        ↓
View project details + why you matched
        ↓
"Apply" → Creator notified
        ↓
Creator accepts → Collaboration starts
        ↓
Messaging unlocked
```

---

## 7. Technical Requirements

### 7.1 Tech Stack (Final MVP)

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API routes |
| **Database** | Supabase PostgreSQL |
| **Vector DB** | pgvector (Supabase extension) |
| **Auth** | Supabase Auth (Google + GitHub OAuth) |
| **AI/LLM** | Gemini 2.0 Flash (extraction), OpenAI text-embedding-3-small (embeddings) |
| **Voice Input** | OpenAI Whisper (speech-to-text) |
| **Voice Output** | ElevenLabs (text-to-speech for voice agent) |
| **Real-time** | Supabase Realtime (notifications, messaging) |
| **Email** | Resend |
| **NLP Pipeline** | LangChain.js |
| **Deployment** | Vercel |
| **Package Manager** | pnpm |
| **Analytics** | PostHog |
| **Error Tracking** | Sentry |

### 7.2 Key Technical Components

1. **Embedding Pipeline**:
   - User description → LLM extraction → Structured profile → Embedding
   - Project description → LLM extraction → Structured requirements → Embedding

2. **Vector Search**:
   - Qdrant collection for user profile embeddings
   - Qdrant collection for project embeddings
   - Cosine similarity search with threshold (e.g., > 0.65)

3. **Match Explanation**:
   - LLM generates human-readable explanation of why profiles matched

### 7.3 Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Matching latency** | < 30 seconds from project post to matches displayed |
| **Embedding generation** | < 5 seconds per profile/project |
| **Uptime** | 99% (acceptable for MVP/hackathon) |
| **Concurrent users** | 100+ (hackathon scale) |
| **Mobile responsive** | Yes (PWA) |

---

## 8. Data Model (Core Entities)

```
Users
├── id (UUID)
├── email
├── name
├── avatar_url
├── profile_description (raw text)
├── profile_structured (JSON: skills, interests, availability, etc.)
├── embedding_id (reference to Qdrant)
├── created_at, updated_at

Projects
├── id (UUID)
├── creator_id (FK → Users)
├── title
├── description (raw text)
├── requirements_structured (JSON: skills needed, team size, timeline)
├── embedding_id (reference to Qdrant)
├── status (open, closed, filled)
├── created_at, expires_at

Matches
├── id (UUID)
├── project_id (FK → Projects)
├── user_id (FK → Users)
├── similarity_score (float)
├── explanation (text)
├── status (pending, applied, accepted, declined)
├── created_at

Messages
├── id (UUID)
├── project_id (FK → Projects)
├── sender_id (FK → Users)
├── content (text)
├── created_at
```

---

## 9. Success Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Time to first match** | < 30 seconds | Core value prop is speed |
| **Match acceptance rate** | > 50% | Measures match quality |
| **Profile completion rate** | > 80% | Low friction onboarding |
| **Project post → team formed** | > 60% | End-to-end success |
| **User return rate** | > 40% within 7 days | Stickiness |

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Cold start** (no users = no matches) | High | Seed with hackathon participants; allow self-matching exploration |
| **LLM extraction errors** | Medium | Show extracted data for user confirmation before saving |
| **Low match quality** | High | Tune similarity threshold; add LangGraph refinement post-MVP |
| **API costs** | Medium | Use Gemini Flash (cheap); cache embeddings; rate limit |
| **Scope creep** | High | Strict MVP boundary; defer GitHub integration to post-MVP |

---

## 11. MVP Scope Boundary

### ✅ IN SCOPE (MVP)
- **Auth:** Google + GitHub + LinkedIn + Slack + Discord OAuth via Supabase Auth
- **Voice Agent Onboarding:** 4-5 turn conversational profile creation
  - OpenAI Whisper for speech-to-text
  - ElevenLabs for text-to-speech responses
- **GitHub Profile Enrichment:** Auto-extract skills from repos on GitHub login
- **Natural language profile creation** (text fallback)
- **Profile Editing:** Users can edit AI-extracted profile data
- **Natural language project posting** (text + voice)
- **Project Expiration:** Auto-expire based on user-set date, with ability to reactivate
- **Embedding-based matching** (pgvector cosine similarity, threshold TBD during implementation)
- **Match display with explanations** (LLM-generated)
- **Voice match explanations** (ElevenLabs audio output)
- **Real-time in-app notifications** (Supabase Realtime)
- **Push/email notifications** (Browser push + Resend)
- **Basic messaging** (Supabase Realtime WebSocket) — handoff to external platforms (Slack/Discord)

### ❌ OUT OF SCOPE (Post-MVP)
- Calendar integration
- Rating system
- Advanced filtering (location, availability slots)
- Team composition optimization
- Miro/Slack integrations
- Daily digest emails (n8n automation)
- Weighted multi-dimensional matching (per spec/Matching.md)

---

## 12. Resolved Architecture Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Vector DB** | pgvector (Supabase) | Single service, no extra infra, good enough for MVP scale |
| **Embedding model** | text-embedding-3-small | Cost-effective, 1536 dimensions, sufficient quality |
| **Similarity threshold** | TBD (start ~0.65) | Will tune during implementation based on match quality |
| **Real-time** | Supabase Realtime (WebSocket) | Built-in, handles notifications + messaging |
| **Background jobs** | Vercel serverless | No extra infra, sufficient for MVP |
| **LangChain** | LangChain.js | Structured output parsing, prompt management, future extensibility |
| **Messaging scope** | Basic handoff | Initial contact only, users move to Slack/Discord for collaboration |
| **Auth providers** | Google, GitHub, LinkedIn, Slack, Discord | Multiple social logins for easy onboarding + platform sharing |

---

## 13. Epic Structure (For PM Handoff)

The following epics are recommended for story creation:

| Epic | Description | Dependencies |
|------|-------------|--------------|
| **E1: Foundation** | Project setup, Supabase config, auth flow | None |
| **E2: Voice Agent** | Whisper + ElevenLabs integration, conversational onboarding | E1 |
| **E3: GitHub Enrichment** | GitHub OAuth, repo analysis, profile merge | E1 |
| **E4: Profile Management** | Profile CRUD, AI extraction, embedding generation | E1 |
| **E5: Project Management** | Project CRUD, AI extraction, embedding generation | E1, E4 |
| **E6: Matching Engine** | Vector search, match generation, explanations | E4, E5 |
| **E7: Notifications** | Real-time in-app, push, email | E1, E6 |
| **E8: Messaging** | Real-time chat between matched users | E1, E6 |
| **E9: UI/UX** | Component library, pages, responsive design | E1 (parallel) |

### Parallel Workstreams

```
TRACK A (UI/Frontend) ──────────────────────────────────────────────►
  E9: Components, pages, forms (no backend dependency)

TRACK B (Backend/Infra) ───────────────────────────────────────────►
  E1 → E4 → E5 → E6 → E7 → E8

TRACK C (AI/Voice) ────────────────────────────────────────────────►
  E2 (Voice Agent) + E3 (GitHub) can run parallel to Track B after E1
```

---

*PRD Version 1.1 — Updated with MVP scope decisions per stakeholder review.*
*Ready for PM to create epics and stories.*
