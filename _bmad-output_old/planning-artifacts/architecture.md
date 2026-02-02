---
title: MeshIt Architecture Document
version: "1.1"
date: 2026-01-31
author: Winston (Architect), Amelia (Dev Review)
status: Ready for Development
changelog:
  - "1.1: Updated per stakeholder decisions - Voice Agent IN, GitHub Enrichment IN, Real-time notifications IN"
---

# MeshIt — Technical Architecture Document

## Executive Summary

MeshIt is an AI-powered project collaboration matching platform. This document defines the technical architecture for a **15-hour hackathon build** by a **3-person team**.

**Core Architecture Principle:** Ruthless simplicity. One stack, minimal services, maximum parallelization.

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              VERCEL                                      │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                       NEXT.JS 15 APP                                │ │
│  │                                                                     │ │
│  │   /app                            /lib                              │ │
│  │   ├── page.tsx                    ├── ai/                           │ │
│  │   ├── (auth)/                     │   ├── types.ts                  │ │
│  │   │   ├── login/                  │   ├── service.ts                │ │
│  │   │   └── callback/               │   ├── langchain.ts              │ │
│  │   ├── onboarding/                 │   ├── prompts/                  │ │
│  │   │   └── voice-agent/            │   └── voice-agent.ts            │ │
│  │   ├── dashboard/                  ├── voice/                        │ │
│  │   ├── projects/                   │   ├── elevenlabs.ts             │ │
│  │   │   ├── [id]/                   │   └── whisper.ts                │ │
│  │   │   └── new/                    ├── github/                       │ │
│  │   ├── matches/                    │   ├── api.ts                    │ │
│  │   ├── messages/                   │   └── profile-extractor.ts      │ │
│  │   ├── notifications/              ├── supabase/                     │ │
│  │   └── api/                        │   ├── client.ts                 │ │
│  │       ├── profile/                │   ├── server.ts                 │ │
│  │       ├── projects/               │   ├── realtime.ts               │ │
│  │       ├── matches/                │   └── types.ts                  │ │
│  │       ├── voice/                  └── utils/                        │ │
│  │       ├── github/                                                   │ │
│  │       └── notifications/                                            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
    ┌──────────────┬─────────────┼─────────────┬──────────────┬──────────┐
    ▼              ▼             ▼             ▼              ▼          ▼
┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌──────┐
│SUPABASE│  │  GEMINI  │  │  OPENAI  │  │ELEVENLABS│  │ GITHUB │  │RESEND│
│        │  │  2.0     │  │          │  │          │  │  API   │  │      │
│- Auth  │  │  FLASH   │  │- Whisper │  │  TTS     │  │        │  │Email │
│- Postgres│ │          │  │- Embed  │  │(Voice    │  │- Repos │  │      │
│- pgvector│ │Extraction│  │  -3-small│ │ Agent)   │  │- Commits│ │      │
│- Realtime│ │+ Voice   │  │          │  │          │  │- Lang  │  │      │
│        │  │  Agent   │  │          │  │          │  │        │  │      │
└────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘  └──────┘
```

### Key Architecture Changes (v1.1)

| Change | Description |
|--------|-------------|
| **Voice Agent Module** | `/lib/ai/voice-agent.ts` - Conversational 4-5 turn onboarding |
| **GitHub Integration** | `/lib/github/` - Profile enrichment from repos on OAuth |
| **Real-time Notifications** | `/lib/supabase/realtime.ts` - In-app notification system |
| **Resend for Email** | Replaces n8n for MVP email notifications |
| **Messages Route** | `/app/messages/` - Real-time chat UI |
| **Notifications Route** | `/app/notifications/` - Notification center UI |

---

## 2. Tech Stack (Final)

### Core Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 15 | Full-stack React framework |
| **Runtime** | React | 19 | UI library |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **Components** | shadcn/ui | latest | Pre-built components |
| **Package Manager** | pnpm | 8.x | Fast, efficient |

### Backend & Data

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Database** | Supabase PostgreSQL | Primary data store |
| **Vector Search** | pgvector (in Supabase) | Embedding similarity search |
| **Auth** | Supabase Auth | Google, GitHub, LinkedIn, Slack, Discord OAuth |
| **Real-time** | Supabase Realtime (WebSocket) | Live notifications + basic messaging |
| **Email** | Resend | Transactional emails (match notifications) |

### AI & Voice

| Layer | Technology | Purpose |
|-------|------------|---------|
| **AI Orchestration** | LangChain.js | Pipeline management |
| **LLM - Extraction** | Gemini 2.0 Flash | Profile/project extraction |
| **Embeddings** | OpenAI text-embedding-3-small | Semantic vectors (1536 dim) |
| **Voice TTS** | ElevenLabs | Match explanations |
| **Voice STT** | OpenAI Whisper | Voice transcription |

### Infrastructure & DevOps

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Deployment** | Vercel | Hosting + Edge Functions |
| **Analytics** | PostHog | Product analytics |
| **Error Tracking** | Sentry | Error monitoring |
| **IDE** | Cursor | AI-powered development |
| **UI Generation** | v0 | Rapid component creation |

> **Note:** n8n deferred to post-MVP. Email notifications handled directly via Resend API.

---

## 3. MCP Servers Required

### For Development (Install in Cursor)

| MCP Server | Purpose | Install Command | Priority |
|------------|---------|-----------------|----------|
| **Supabase MCP** | Query database, manage auth, debug | `npx @supabase/mcp-server` | ✅ Required |
| **GitHub MCP** | Access repos, manage code | Built into Cursor | ✅ Required |
| **Filesystem MCP** | Local file operations | Built into Cursor | ✅ Required |

### Optional (Post-MVP)

| MCP Server | Purpose | When to Add |
|------------|---------|-------------|
| **Browserbase MCP** | Web scraping (LinkedIn, portfolio sites) | When adding external profile enrichment |
| **Postgres MCP** | Direct SQL access | If Supabase MCP is insufficient |

### MCP Configuration for Cursor

Create/update `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    }
  }
}
```

---

## 4. Database Schema (Supabase SQL)

### Enable Extensions

```sql
-- Run once in Supabase SQL Editor
create extension if not exists vector;
create extension if not exists pg_trgm;  -- For text search
```

### Tables

```sql
-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  
  -- Raw input
  description text,
  
  -- Extracted structured data (from Gemini) - USER EDITABLE
  skills text[] default '{}',
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  availability_hours integer,
  interests text[] default '{}',
  collaboration_style text check (collaboration_style in ('sync', 'async', 'flexible')),
  
  -- Social platform links (for handoff after matching)
  linkedin_url text,
  slack_id text,
  discord_username text,
  
  -- Embedding (1536 dimensions for text-embedding-3-small)
  embedding vector(1536),
  
  -- Metadata
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for vector similarity search
create index profiles_embedding_idx on profiles 
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index for skill filtering
create index profiles_skills_idx on profiles using gin (skills);

-- ============================================
-- PROJECTS TABLE
-- ============================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Raw input
  title text not null,
  description text not null,
  
  -- Extracted structured data (from Gemini)
  required_skills text[] default '{}',
  team_size integer default 3,
  experience_level text check (experience_level in ('any', 'beginner', 'intermediate', 'advanced')),
  commitment_hours integer,
  timeline text check (timeline in ('weekend', '1_week', '1_month', 'ongoing')),
  
  -- Embedding
  embedding vector(1536),
  
  -- Status
  status text default 'open' check (status in ('open', 'closed', 'filled', 'expired')),
  
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz not null  -- Required: user sets expiration date
);

-- Index for vector similarity search
create index projects_embedding_idx on projects 
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index for filtering
create index projects_status_idx on projects(status);
create index projects_skills_idx on projects using gin (required_skills);

-- ============================================
-- MATCHES TABLE
-- ============================================
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Match data
  similarity_score float not null,
  explanation text,
  explanation_audio_url text,  -- ElevenLabs generated audio
  
  -- Status
  status text default 'pending' check (status in ('pending', 'applied', 'accepted', 'declined')),
  
  -- Metadata
  created_at timestamptz default now(),
  responded_at timestamptz,
  
  -- Prevent duplicate matches
  unique(project_id, user_id)
);

-- Index for user's matches
create index matches_user_idx on matches(user_id);
create index matches_project_idx on matches(project_id);

-- ============================================
-- MESSAGES TABLE (Basic chat)
-- ============================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- Index for conversation loading
create index messages_project_idx on messages(project_id, created_at);

-- ============================================
-- NOTIFICATIONS TABLE (NEW - MVP)
-- ============================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Notification type
  type text not null check (type in ('new_match', 'match_accepted', 'match_declined', 'new_message', 'project_update')),
  
  -- Reference to related entity
  reference_type text check (reference_type in ('match', 'project', 'message')),
  reference_id uuid,
  
  -- Content
  title text not null,
  body text,
  
  -- Status
  read boolean default false,
  
  -- Metadata
  created_at timestamptz default now()
);

-- Index for user's notifications
create index notifications_user_idx on notifications(user_id, created_at desc);
create index notifications_unread_idx on notifications(user_id, read) where read = false;

-- ============================================
-- GITHUB PROFILES TABLE (NEW - MVP)
-- ============================================
create table public.github_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  
  -- GitHub data
  github_username text not null,
  github_id text not null,
  
  -- Extracted data
  primary_languages text[] default '{}',
  topics text[] default '{}',
  project_types text[] default '{}',
  activity_level text check (activity_level in ('low', 'medium', 'high')),
  repo_count integer default 0,
  total_stars integer default 0,
  
  -- Raw data cache
  raw_repos jsonb,
  
  -- Metadata
  last_synced_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Index for GitHub username lookup
create index github_profiles_username_idx on github_profiles(github_username);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.github_profiles enable row level security;

-- Profiles: Users can read all, update own
create policy "Profiles are viewable by everyone" on profiles
  for select using (true);
  
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Projects: Anyone can read open, creator can manage
create policy "Open projects are viewable" on projects
  for select using (status = 'open' or creator_id = auth.uid());
  
create policy "Users can create projects" on projects
  for insert with check (auth.uid() = creator_id);
  
create policy "Creators can update own projects" on projects
  for update using (auth.uid() = creator_id);

-- Matches: Involved parties can view/update
create policy "Users can view their matches" on matches
  for select using (
    user_id = auth.uid() or 
    project_id in (select id from projects where creator_id = auth.uid())
  );

-- Messages: Project participants can read/write
create policy "Participants can view messages" on messages
  for select using (
    project_id in (
      select project_id from matches where user_id = auth.uid() and status = 'accepted'
      union
      select id from projects where creator_id = auth.uid()
    )
  );

create policy "Participants can send messages" on messages
  for insert with check (
    auth.uid() = sender_id and
    project_id in (
      select project_id from matches where user_id = auth.uid() and status = 'accepted'
      union
      select id from projects where creator_id = auth.uid()
    )
  );

-- Notifications: Users can only see their own
create policy "Users can view own notifications" on notifications
  for select using (user_id = auth.uid());

create policy "Users can update own notifications" on notifications
  for update using (user_id = auth.uid());

-- GitHub Profiles: Users can view all, update own
create policy "GitHub profiles are viewable" on github_profiles
  for select using (true);

create policy "Users can update own GitHub profile" on github_profiles
  for update using (user_id = auth.uid());

create policy "Users can insert own GitHub profile" on github_profiles
  for insert with check (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Find matching users for a project
create or replace function match_users_to_project(
  project_embedding vector(1536),
  required_skills text[],
  min_experience text default 'any',
  min_hours integer default 0,
  match_limit integer default 5
)
returns table (
  user_id uuid,
  similarity float,
  skills text[],
  experience_level text,
  availability_hours integer
)
language plpgsql
as $$
begin
  return query
  select 
    p.id as user_id,
    1 - (p.embedding <=> project_embedding) as similarity,
    p.skills,
    p.experience_level,
    p.availability_hours
  from profiles p
  where 
    p.onboarding_complete = true
    and p.embedding is not null
    -- Skill overlap (at least one matching skill)
    and (array_length(required_skills, 1) is null or p.skills && required_skills)
    -- Experience level filter
    and (min_experience = 'any' or p.experience_level = min_experience)
    -- Availability filter
    and (min_hours = 0 or p.availability_hours >= min_hours)
  order by similarity desc
  limit match_limit;
end;
$$;

-- Function: Find matching projects for a user
create or replace function match_projects_to_user(
  user_embedding vector(1536),
  user_skills text[],
  match_limit integer default 5
)
returns table (
  project_id uuid,
  similarity float,
  title text,
  required_skills text[]
)
language plpgsql
as $$
begin
  return query
  select 
    pr.id as project_id,
    1 - (pr.embedding <=> user_embedding) as similarity,
    pr.title,
    pr.required_skills
  from projects pr
  where 
    pr.status = 'open'
    and pr.embedding is not null
    -- Skill overlap
    and (array_length(pr.required_skills, 1) is null or pr.required_skills && user_skills)
  order by similarity desc
  limit match_limit;
end;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================
-- PROJECT AUTO-EXPIRATION
-- ============================================

-- Function to auto-expire projects past their expiration date
create or replace function expire_old_projects()
returns void as $$
begin
  update projects
  set status = 'expired'
  where status = 'open'
    and expires_at < now();
end;
$$ language plpgsql security definer;

-- Call this via Vercel cron or pg_cron extension
-- Example: SELECT expire_old_projects(); -- run daily

-- Function to reactivate an expired project
create or replace function reactivate_project(
  project_id uuid,
  new_expires_at timestamptz
)
returns void as $$
begin
  update projects
  set status = 'open',
      expires_at = new_expires_at,
      updated_at = now()
  where id = project_id
    and status = 'expired';
end;
$$ language plpgsql security definer;
```

---

## 5. AI Service Interface

### Types Definition

```typescript
// /lib/ai/types.ts

export interface StructuredProfile {
  skills: string[];
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  availability_hours: number;
  interests: string[];
  collaboration_style: 'sync' | 'async' | 'flexible';
}

export interface StructuredProject {
  title: string;
  required_skills: string[];
  team_size: number;
  experience_level: 'any' | 'beginner' | 'intermediate' | 'advanced';
  commitment_hours: number;
  timeline: 'weekend' | '1_week' | '1_month' | 'ongoing';
}

export interface MatchResult {
  user_id: string;
  similarity: number;
  explanation?: string;
}

export interface AIService {
  // Extraction
  extractProfile(description: string): Promise<StructuredProfile>;
  extractProject(description: string): Promise<StructuredProject>;
  
  // Embeddings
  generateEmbedding(text: string): Promise<number[]>;
  
  // Explanation
  generateMatchExplanation(
    userProfile: StructuredProfile,
    projectDescription: string
  ): Promise<string>;
  
  // FUTURE: GitHub integration
  analyzeGitHub?(username: string): Promise<any>;
}
```

### LangChain.js Implementation

```typescript
// /lib/ai/langchain.ts

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import type { AIService, StructuredProfile, StructuredProject } from "./types";

// Initialize models
const gemini = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-exp",
  temperature: 0,
});

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

// Profile extraction parser
const profileParser = StructuredOutputParser.fromZodSchema(
  z.object({
    skills: z.array(z.string()).describe("Technical and soft skills"),
    experience_level: z.enum(["beginner", "intermediate", "advanced"]),
    availability_hours: z.number().describe("Hours per week available"),
    interests: z.array(z.string()).describe("Areas of interest"),
    collaboration_style: z.enum(["sync", "async", "flexible"]),
  })
);

// Project extraction parser
const projectParser = StructuredOutputParser.fromZodSchema(
  z.object({
    title: z.string().describe("Short project title"),
    required_skills: z.array(z.string()),
    team_size: z.number().default(3),
    experience_level: z.enum(["any", "beginner", "intermediate", "advanced"]),
    commitment_hours: z.number().describe("Hours per week expected"),
    timeline: z.enum(["weekend", "1_week", "1_month", "ongoing"]),
  })
);

// Prompts
const profilePrompt = PromptTemplate.fromTemplate(`
Extract structured information from this user's self-description.
If information is not provided, make reasonable assumptions based on context.

User description:
{description}

{format_instructions}
`);

const projectPrompt = PromptTemplate.fromTemplate(`
Extract structured information from this project description.
If information is not provided, make reasonable assumptions based on context.

Project description:
{description}

{format_instructions}
`);

const matchExplanationPrompt = PromptTemplate.fromTemplate(`
Write a brief, friendly explanation (2-3 sentences) of why this user is a good match for this project.
Focus on specific skill overlaps and relevant experience.

User profile:
- Skills: {skills}
- Experience: {experience_level}
- Interests: {interests}
- Collaboration style: {collaboration_style}

Project:
{project_description}

Explanation:
`);

// Service implementation
export const aiService: AIService = {
  async extractProfile(description: string): Promise<StructuredProfile> {
    const prompt = await profilePrompt.format({
      description,
      format_instructions: profileParser.getFormatInstructions(),
    });
    
    const response = await gemini.invoke(prompt);
    return profileParser.parse(response.content as string);
  },

  async extractProject(description: string): Promise<StructuredProject> {
    const prompt = await projectPrompt.format({
      description,
      format_instructions: projectParser.getFormatInstructions(),
    });
    
    const response = await gemini.invoke(prompt);
    return projectParser.parse(response.content as string);
  },

  async generateEmbedding(text: string): Promise<number[]> {
    const result = await embeddings.embedQuery(text);
    return result;
  },

  async generateMatchExplanation(
    userProfile: StructuredProfile,
    projectDescription: string
  ): Promise<string> {
    const prompt = await matchExplanationPrompt.format({
      skills: userProfile.skills.join(", "),
      experience_level: userProfile.experience_level,
      interests: userProfile.interests.join(", "),
      collaboration_style: userProfile.collaboration_style,
      project_description: projectDescription,
    });
    
    const response = await gemini.invoke(prompt);
    return response.content as string;
  },
};
```

---

## 6. Voice Agent System (MVP)

The Voice Agent provides a conversational onboarding experience through 4-5 turns of dialogue.

### Voice Agent State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                    VOICE AGENT FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [START] ──► Turn 1: "Tell me about yourself"                   │
│                 │                                                │
│                 ▼                                                │
│             Turn 2: "What skills are you strongest in?"         │
│                 │                                                │
│                 ▼                                                │
│             Turn 3: "What kind of projects interest you?"       │
│                 │                                                │
│                 ▼                                                │
│             Turn 4: "Hours per week you can commit?"            │
│                 │                                                │
│                 ▼                                                │
│             Turn 5: "Sync or async collaboration?"              │
│                 │                                                │
│                 ▼                                                │
│  [EXTRACT] ──► AI processes all turns ──► Structured Profile    │
│                 │                                                │
│                 ▼                                                │
│  [CONFIRM] ──► User reviews/edits ──► Save to DB               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Voice Agent Implementation

```typescript
// /lib/ai/voice-agent.ts

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { transcribeAudio } from "@/lib/voice/whisper";
import { generateSpeech } from "@/lib/voice/elevenlabs";

interface ConversationTurn {
  role: "agent" | "user";
  content: string;
  audioUrl?: string;
}

interface VoiceAgentState {
  turns: ConversationTurn[];
  currentStep: number;
  extractedProfile: Partial<StructuredProfile> | null;
}

const AGENT_PROMPTS = [
  "Hi! I'm here to help set up your profile. Tell me a bit about yourself - what do you do and what's your background?",
  "Great! What technical or professional skills are you strongest in?",
  "What kind of projects or domains interest you most?",
  "How many hours per week can you typically commit to a project?",
  "Last question - do you prefer synchronous collaboration like pair programming, or async work with occasional check-ins?",
];

export class VoiceAgent {
  private state: VoiceAgentState;
  private gemini: ChatGoogleGenerativeAI;

  constructor() {
    this.state = {
      turns: [],
      currentStep: 0,
      extractedProfile: null,
    };
    this.gemini = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash-exp",
      temperature: 0.7,
    });
  }

  async startConversation(): Promise<{ text: string; audioUrl: string }> {
    const prompt = AGENT_PROMPTS[0];
    const audioUrl = await generateSpeech(prompt);
    
    this.state.turns.push({ role: "agent", content: prompt, audioUrl });
    this.state.currentStep = 1;
    
    return { text: prompt, audioUrl };
  }

  async processUserInput(audioBlob: Blob): Promise<{
    text: string;
    audioUrl: string;
    isComplete: boolean;
    profile?: StructuredProfile;
  }> {
    // Transcribe user audio
    const userText = await transcribeAudio(audioBlob);
    this.state.turns.push({ role: "user", content: userText });

    // Check if conversation is complete
    if (this.state.currentStep >= AGENT_PROMPTS.length) {
      const profile = await this.extractProfile();
      const summaryText = `Perfect! Based on our conversation, here's what I understood: 
        You have skills in ${profile.skills.join(", ")}, 
        you're at ${profile.experience_level} level, 
        interested in ${profile.interests.join(", ")}, 
        can commit ${profile.availability_hours} hours per week, 
        and prefer ${profile.collaboration_style} collaboration. Does this look right?`;
      
      const audioUrl = await generateSpeech(summaryText);
      
      return {
        text: summaryText,
        audioUrl,
        isComplete: true,
        profile,
      };
    }

    // Get next prompt
    const nextPrompt = AGENT_PROMPTS[this.state.currentStep];
    const audioUrl = await generateSpeech(nextPrompt);
    
    this.state.turns.push({ role: "agent", content: nextPrompt, audioUrl });
    this.state.currentStep++;

    return {
      text: nextPrompt,
      audioUrl,
      isComplete: false,
    };
  }

  private async extractProfile(): Promise<StructuredProfile> {
    const conversationText = this.state.turns
      .map((t) => `${t.role}: ${t.content}`)
      .join("\n");

    const prompt = `Extract a structured profile from this conversation:

${conversationText}

Return JSON with: skills (array), experience_level (beginner/intermediate/advanced), 
availability_hours (number), interests (array), collaboration_style (sync/async/flexible)`;

    const response = await this.gemini.invoke(prompt);
    return JSON.parse(response.content as string);
  }
}
```

### Voice Integration APIs

#### ElevenLabs TTS

```typescript
// /lib/voice/elevenlabs.ts

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel - default voice

export async function generateSpeech(text: string): Promise<ArrayBuffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs error: ${response.statusText}`);
  }

  return response.arrayBuffer();
}

export async function generateMatchExplanationAudio(
  explanation: string
): Promise<string> {
  const audioBuffer = await generateSpeech(explanation);
  
  // Convert to base64 data URL for simple playback
  // In production, upload to Supabase Storage and return URL
  const base64 = Buffer.from(audioBuffer).toString("base64");
  return `data:audio/mpeg;base64,${base64}`;
}
```

### Voice Transcription (Whisper)

```typescript
// /lib/voice/transcribe.ts

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-1");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Whisper error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.text;
}
```

---

## 7. GitHub Profile Enrichment (MVP)

When users authenticate via GitHub OAuth, we automatically extract profile data from their public repos.

### GitHub Data Extraction

```typescript
// /lib/github/api.ts

const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN; // From OAuth flow

interface GitHubRepo {
  name: string;
  language: string;
  stargazers_count: number;
  fork: boolean;
  description: string;
  topics: string[];
}

interface GitHubContribution {
  totalCommits: number;
  languages: Record<string, number>; // language -> bytes
}

export async function fetchUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  
  if (!response.ok) throw new Error("Failed to fetch repos");
  return response.json();
}

export async function fetchRepoLanguages(
  accessToken: string,
  owner: string,
  repo: string
): Promise<Record<string, number>> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  
  if (!response.ok) return {};
  return response.json();
}
```

### Profile Extractor

```typescript
// /lib/github/profile-extractor.ts

import { fetchUserRepos, fetchRepoLanguages } from "./api";

interface GitHubProfileData {
  primaryLanguages: string[];
  topics: string[];
  projectTypes: string[];
  activityLevel: "low" | "medium" | "high";
  estimatedExperience: "beginner" | "intermediate" | "advanced";
}

export async function extractGitHubProfile(
  accessToken: string,
  username: string
): Promise<GitHubProfileData> {
  const repos = await fetchUserRepos(accessToken);
  
  // Filter out forks, get original work only
  const ownRepos = repos.filter((r) => !r.fork);
  
  // Aggregate languages across all repos
  const languageTotals: Record<string, number> = {};
  for (const repo of ownRepos.slice(0, 20)) {
    const langs = await fetchRepoLanguages(accessToken, username, repo.name);
    for (const [lang, bytes] of Object.entries(langs)) {
      languageTotals[lang] = (languageTotals[lang] || 0) + bytes;
    }
  }
  
  // Sort by usage
  const sortedLanguages = Object.entries(languageTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
  
  // Extract topics/tags
  const allTopics = ownRepos.flatMap((r) => r.topics || []);
  const uniqueTopics = [...new Set(allTopics)];
  
  // Estimate experience based on repo count and stars
  const totalStars = ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0);
  let estimatedExperience: "beginner" | "intermediate" | "advanced" = "beginner";
  if (ownRepos.length > 20 || totalStars > 50) estimatedExperience = "advanced";
  else if (ownRepos.length > 5 || totalStars > 10) estimatedExperience = "intermediate";
  
  // Activity level based on recent repos
  const activityLevel = ownRepos.length > 10 ? "high" : ownRepos.length > 3 ? "medium" : "low";
  
  return {
    primaryLanguages: sortedLanguages.slice(0, 5),
    topics: uniqueTopics.slice(0, 10),
    projectTypes: inferProjectTypes(ownRepos),
    activityLevel,
    estimatedExperience,
  };
}

function inferProjectTypes(repos: GitHubRepo[]): string[] {
  const types: Set<string> = new Set();
  
  for (const repo of repos) {
    const desc = (repo.description || "").toLowerCase();
    const name = repo.name.toLowerCase();
    
    if (desc.includes("api") || name.includes("api")) types.add("API Development");
    if (desc.includes("web") || repo.language === "JavaScript" || repo.language === "TypeScript") 
      types.add("Web Development");
    if (desc.includes("mobile") || repo.language === "Swift" || repo.language === "Kotlin") 
      types.add("Mobile Development");
    if (desc.includes("ml") || desc.includes("machine learning") || repo.language === "Python") 
      types.add("Data/ML");
    if (desc.includes("game") || repo.language === "C#" || repo.language === "C++") 
      types.add("Game Development");
  }
  
  return [...types];
}
```

### Merging GitHub Data with Voice Profile

```typescript
// /lib/ai/profile-merger.ts

import { StructuredProfile } from "./types";
import { GitHubProfileData } from "@/lib/github/profile-extractor";

export function mergeProfiles(
  voiceProfile: StructuredProfile,
  githubData: GitHubProfileData | null
): StructuredProfile {
  if (!githubData) return voiceProfile;
  
  // Merge skills (voice profile takes precedence, GitHub adds more)
  const mergedSkills = [
    ...new Set([
      ...voiceProfile.skills,
      ...githubData.primaryLanguages,
      ...githubData.projectTypes,
    ]),
  ];
  
  // Merge interests
  const mergedInterests = [
    ...new Set([
      ...voiceProfile.interests,
      ...githubData.topics,
    ]),
  ];
  
  // Use higher experience level
  const experienceLevels = { beginner: 1, intermediate: 2, advanced: 3 };
  const voiceLevel = experienceLevels[voiceProfile.experience_level];
  const githubLevel = experienceLevels[githubData.estimatedExperience];
  const finalLevel = voiceLevel >= githubLevel 
    ? voiceProfile.experience_level 
    : githubData.estimatedExperience;
  
  return {
    ...voiceProfile,
    skills: mergedSkills,
    interests: mergedInterests,
    experience_level: finalLevel,
  };
}
```

---

## 8. API Routes Specification

### Profile APIs

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/profile` | Get current user's profile |
| POST | `/api/profile/extract` | Extract structured data from description |
| PATCH | `/api/profile` | Update profile with structured data + embedding |
| POST | `/api/profile/voice` | Transcribe voice → extract profile |

### Voice Agent APIs (NEW)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/voice-agent/start` | Initialize voice agent conversation |
| POST | `/api/voice-agent/turn` | Process user voice input, return next prompt |
| POST | `/api/voice-agent/complete` | Finalize and extract profile from conversation |

### GitHub APIs (NEW)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/github/profile` | Extract profile data from user's GitHub repos |
| POST | `/api/github/merge` | Merge GitHub data with voice profile |

### Notification APIs (NEW)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/notifications` | Get user's notifications |
| PATCH | `/api/notifications/[id]` | Mark notification as read |
| POST | `/api/notifications/subscribe` | Subscribe to push notifications |

### Project APIs

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/projects` | List open projects |
| GET | `/api/projects/[id]` | Get project details |
| POST | `/api/projects` | Create project (extract + embed + find matches) |
| PATCH | `/api/projects/[id]` | Update project |
| DELETE | `/api/projects/[id]` | Close/delete project |

### Match APIs

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/matches` | Get user's matches (projects they matched with) |
| GET | `/api/matches/project/[id]` | Get matches for a specific project (creator only) |
| PATCH | `/api/matches/[id]` | Update match status (apply/accept/decline) |
| POST | `/api/matches/[id]/explain` | Generate voice explanation |

### Voice APIs

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/voice/transcribe` | Audio → Text (Whisper) |
| POST | `/api/voice/speak` | Text → Audio (ElevenLabs) |

---

## 9. Real-time Notifications System (MVP)

### Supabase Realtime Integration

```typescript
// /lib/supabase/realtime.ts

import { createClient } from "@supabase/supabase-js";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
): RealtimeChannel {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();
}

export function subscribeToMessages(
  projectId: string,
  onMessage: (message: Message) => void
): RealtimeChannel {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabase
    .channel(`messages:${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();
}
```

### Notification Creation Trigger

```sql
-- Auto-create notification when match is created
create or replace function create_match_notification()
returns trigger as $$
begin
  -- Notify the matched user
  insert into notifications (user_id, type, reference_type, reference_id, title, body)
  values (
    new.user_id,
    'new_match',
    'match',
    new.id,
    'New project match!',
    'You matched with a project. Check it out!'
  );
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_match_created
  after insert on matches
  for each row execute function create_match_notification();

-- Auto-create notification when match status changes
create or replace function create_match_status_notification()
returns trigger as $$
declare
  project_creator_id uuid;
begin
  -- Get project creator
  select creator_id into project_creator_id from projects where id = new.project_id;
  
  if new.status = 'applied' and old.status = 'pending' then
    -- Notify project creator
    insert into notifications (user_id, type, reference_type, reference_id, title, body)
    values (
      project_creator_id,
      'match_accepted',
      'match',
      new.id,
      'Someone applied to your project!',
      'A user has applied to join your project.'
    );
  elsif new.status = 'accepted' and old.status = 'applied' then
    -- Notify the applicant
    insert into notifications (user_id, type, reference_type, reference_id, title, body)
    values (
      new.user_id,
      'match_accepted',
      'match',
      new.id,
      'Your application was accepted!',
      'You can now message the project creator.'
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_match_status_changed
  after update on matches
  for each row execute function create_match_status_notification();
```

### React Hook for Notifications

```typescript
// /hooks/useNotifications.ts

import { useEffect, useState } from "react";
import { subscribeToNotifications } from "@/lib/supabase/realtime";
import { useUser } from "@/hooks/useUser";

export function useNotifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch existing notifications
    fetchNotifications();

    // Subscribe to new notifications
    const channel = subscribeToNotifications(user.id, (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Show toast notification
      toast({
        title: newNotification.title,
        description: newNotification.body,
      });
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    
    setNotifications(data || []);
    setUnreadCount(data?.filter((n) => !n.read).length || 0);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return { notifications, unreadCount, markAsRead };
}
```

### Email Notifications via Resend

```typescript
// /lib/email/resend.ts

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMatchNotificationEmail(
  to: string,
  projectTitle: string,
  matchScore: number
) {
  await resend.emails.send({
    from: "MeshIt <notifications@meshit.app>",
    to,
    subject: `New match on MeshIt: ${projectTitle}`,
    html: `
      <h1>You have a new match!</h1>
      <p>You matched with the project "${projectTitle}" with a ${Math.round(matchScore * 100)}% compatibility score.</p>
      <a href="https://meshit.app/matches">View your matches</a>
    `,
  });
}

export async function sendApplicationAcceptedEmail(
  to: string,
  projectTitle: string
) {
  await resend.emails.send({
    from: "MeshIt <notifications@meshit.app>",
    to,
    subject: `Your application was accepted: ${projectTitle}`,
    html: `
      <h1>Congratulations!</h1>
      <p>Your application to join "${projectTitle}" has been accepted.</p>
      <p>You can now message the project creator and start collaborating!</p>
      <a href="https://meshit.app/messages">Start chatting</a>
    `,
  });
}
```

---

## 10. n8n Automation Workflows (POST-MVP)

> **Note:** n8n workflows deferred to post-MVP. Email notifications handled directly via Resend API in MVP.

### Workflow 1: Daily Digest (Post-MVP)

**Trigger:** Cron (9:00 AM daily)

```
1. Query Supabase: Users with unviewed matches in last 24h
2. For each user:
   a. Aggregate matches
   b. Generate AI digest summary
   c. Send email via Resend
```

---

## 11. Environment Variables

```env
# ===================
# Supabase
# ===================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# ===================
# AI Services
# ===================
GOOGLE_AI_API_KEY=AIza...
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=xi-...

# ===================
# Email (MVP)
# ===================
RESEND_API_KEY=re_xxx

# ===================
# Analytics & Monitoring
# ===================
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
SENTRY_DSN=https://xxx@sentry.io/xxx

# ===================
# Optional (Post-MVP)
# ===================
N8N_WEBHOOK_URL=https://xxx.n8n.cloud/webhook/xxx
```

---

## 12. Component Structure (v0 Prompts)

Use these prompts in v0 to generate components:

### Match Card
```
Create a match card component with shadcn/ui and Tailwind:
- User avatar (rounded), name, and match percentage badge (green for >80%, yellow for >60%)
- Row of skill tags (max 5, overflow with +N)
- "Why you matched" explanation text (2-3 lines, truncated)
- Audio player button (speaker icon) for voice explanation
- Two buttons: "Apply" (primary) and "Decline" (secondary/outline)
- Subtle hover state with shadow
```

### Project Card
```
Create a project listing card with shadcn/ui:
- Project title (bold, large)
- Creator avatar + name (small, inline)
- Description (3 lines max, truncated)
- Required skills as tags
- Team size indicator (e.g., "Looking for 3 people")
- Timeline badge (weekend, 1 week, etc.)
- "View Details" button
```

### Voice Input Button
```
Create a voice recording button with shadcn/ui:
- Microphone icon button (circular)
- When recording: pulsing red indicator, "Recording..." text
- When stopped: "Processing..." loading state
- Accessible (aria labels)
- Uses browser MediaRecorder API
```

### Profile Form
```
Create a profile onboarding form with shadcn/ui:
- Large textarea for free-form description
- OR voice input button to record
- "What we understood" section showing extracted:
  - Skills (editable tags)
  - Experience level (dropdown)
  - Availability (number input with "hours/week")
  - Interests (editable tags)
  - Collaboration style (radio group)
- "Save Profile" button
```

---

## 13. Team Workstream Allocation

### 15-Hour Build Timeline

```
HOUR 0-3: Foundation (Parallel)
├── Frontend (Dev 1):
│   ├── Next.js 15 project setup
│   ├── Tailwind + shadcn/ui setup
│   ├── Basic layout + navigation
│   └── Auth pages (login, callback)
│
├── Backend (Dev 2):
│   ├── Supabase project setup
│   ├── Run database schema SQL
│   ├── Configure GitHub OAuth in Supabase
│   ├── Set up environment variables
│   └── Test auth flow end-to-end
│
└── AI (Dev 3):
    ├── Set up /lib/ai/ structure
    ├── Implement LangChain extraction
    ├── Test Gemini prompts in isolation
    └── Implement embedding generation

HOUR 3-8: Core Features (Parallel)
├── Frontend (Dev 1):
│   ├── Onboarding page (text + voice input)
│   ├── Dashboard layout
│   ├── Project listing page
│   └── Match cards (use v0)
│
├── Backend (Dev 2):
│   ├── API: /api/profile (GET, PATCH)
│   ├── API: /api/profile/extract
│   ├── API: /api/projects (GET, POST)
│   ├── API: /api/matches
│   └── Supabase RLS policies testing
│
└── AI (Dev 3):
    ├── Voice transcription (Whisper)
    ├── Full extraction pipeline
    ├── Matching query implementation
    └── Match explanation generation

HOUR 8-12: Integration (Collaborative)
├── Frontend + Backend:
│   ├── Connect onboarding to APIs
│   ├── Connect project creation to APIs
│   ├── Connect match display to APIs
│   └── Real-time match updates
│
├── AI + Backend:
│   ├── Full flow: description → extract → embed → store
│   ├── Full flow: project → match users → explanations
│   └── Voice explanation audio (ElevenLabs)
│
└── Backend + Notifications:
    ├── Supabase Realtime setup
    ├── Notification triggers
    └── Resend email integration

HOUR 8-12: Voice Agent + GitHub (Parallel Track C)
├── Voice Agent:
│   ├── Voice Agent state machine
│   ├── Whisper integration
│   ├── ElevenLabs conversational responses
│   └── Profile extraction from conversation
│
└── GitHub Integration:
    ├── GitHub OAuth callback handler
    ├── Repo/language extraction
    └── Profile merger logic

HOUR 12-15: Polish & Deploy
├── All:
│   ├── Deploy to Vercel
│   ├── Test full user journey (voice + text)
│   ├── Fix critical bugs
│   ├── Add PostHog + Sentry
│   ├── Create demo accounts/data
│   └── Prepare demo script
```

---

## 14. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Supabase pgvector setup fails** | Fallback: Use cosine similarity in application code |
| **LangChain.js issues** | Fallback: Direct API calls to Gemini/OpenAI |
| **ElevenLabs rate limits** | Cache audio files, generate async, fallback to text-only |
| **Voice Agent complexity** | Fallback: Text-only onboarding (already built) |
| **GitHub API rate limits** | Cache extracted data, sync on login only |
| **Whisper latency** | Show "processing" state, optimize audio chunk size |
| **Time crunch** | Priority order: Core matching → Notifications → Voice Agent → GitHub |

---

## 15. Future Extension Points (Post-MVP)

1. **Advanced Matching Algorithm** (per spec/Matching.md):
   - Weighted multi-dimensional scoring
   - Availability-based matching with time slot compatibility
   - Collaboration style compatibility

2. **n8n Automation**:
   - Daily digest emails
   - Complex notification workflows

3. **Calendar Integration**:
   - Google Calendar sync
   - Auto-suggest meeting times

4. **Rating System**:
   - Post-project reviews
   - Compatibility scoring from ratings

---

## 16. Checklist Before Development

- [ ] Supabase project created
- [ ] Google OAuth configured in Supabase
- [ ] GitHub OAuth configured in Supabase
- [ ] pgvector extension enabled
- [ ] Database schema executed (including new tables)
- [ ] Environment variables set in Vercel
- [ ] API keys obtained:
  - [ ] Google AI (Gemini)
  - [ ] OpenAI (Whisper + Embeddings)
  - [ ] ElevenLabs
  - [ ] Resend
  - [ ] PostHog
  - [ ] Sentry

---

*Architecture Document v1.1 — Updated with Voice Agent, GitHub Integration, Real-time Notifications*
*Ready for PM to create epics and stories*
