-- ============================================
-- COMBINED MIGRATION FILE FOR MATCHING ENGINE
-- ============================================
-- Run this file in Supabase SQL Editor to apply all matching engine migrations
-- Order: pgvector -> projects -> matches -> functions

-- ============================================
-- MIGRATION 1: Enable pgvector and add profile embeddings
-- ============================================

-- Enable pgvector extension for similarity search
create extension if not exists vector;

-- Add embedding column to profiles table
alter table public.profiles
add column if not exists embedding vector(1536);

-- Create IVFFlat index for fast similarity search
-- Note: This index requires some data to be effective, but we create it now
create index if not exists profiles_embedding_idx 
on public.profiles 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Add comment explaining the embedding dimension
comment on column public.profiles.embedding is '1536-dimensional embedding vector from OpenAI text-embedding-3-small';

-- ============================================
-- MIGRATION 2: Create projects table
-- ============================================

-- Create projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(user_id) on delete cascade not null,
  
  -- Basic information
  title text not null,
  description text not null,
  
  -- Extracted structured data
  required_skills text[] default '{}',
  team_size integer default 3,
  experience_level text check (experience_level in ('any', 'beginner', 'intermediate', 'advanced', 'junior', 'senior', 'lead')),
  commitment_hours integer,
  timeline text check (timeline in ('weekend', '1_week', '1_month', 'ongoing')),
  
  -- Embedding for semantic matching
  embedding vector(1536),
  
  -- Status management
  status text default 'open' check (status in ('open', 'closed', 'filled', 'expired')),
  
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz not null
);

-- Enable RLS
alter table public.projects enable row level security;

-- RLS Policies
-- Anyone can view open projects, creators can view their own projects
create policy "Open projects are viewable"
  on public.projects
  for select
  using (status = 'open' or creator_id = auth.uid());

-- Users can create their own projects
create policy "Users can create projects"
  on public.projects
  for insert
  with check (auth.uid() = creator_id);

-- Creators can update their own projects
create policy "Creators can update own projects"
  on public.projects
  for update
  using (auth.uid() = creator_id);

-- Creators can delete their own projects
create policy "Creators can delete own projects"
  on public.projects
  for delete
  using (auth.uid() = creator_id);

-- Indexes for performance
create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_creator_idx on public.projects(creator_id);
create index if not exists projects_expires_at_idx on public.projects(expires_at);
create index if not exists projects_skills_idx on public.projects using gin (required_skills);

-- IVFFlat index for vector similarity search
create index if not exists projects_embedding_idx 
on public.projects 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Auto-update updated_at trigger
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- Comments
comment on column public.projects.embedding is '1536-dimensional embedding vector from OpenAI text-embedding-3-small';
comment on column public.projects.status is 'Project status: open (accepting applications), closed (manually closed), filled (team complete), expired (past expiration date)';

-- ============================================
-- MIGRATION 3: Create matches table
-- ============================================

-- Create matches table
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(user_id) on delete cascade not null,
  
  -- Match data
  similarity_score float not null check (similarity_score >= 0 and similarity_score <= 1),
  explanation text,
  
  -- Status tracking
  status text default 'pending' check (status in ('pending', 'applied', 'accepted', 'declined')),
  
  -- Metadata
  created_at timestamptz default now(),
  responded_at timestamptz,
  updated_at timestamptz default now(),
  
  -- Prevent duplicate matches
  unique(project_id, user_id)
);

-- Enable RLS
alter table public.matches enable row level security;

-- RLS Policies
-- Users can view their own matches (as applicant)
-- Project creators can view matches for their projects
create policy "Users can view their matches"
  on public.matches
  for select
  using (
    user_id = auth.uid() or 
    project_id in (select id from public.projects where creator_id = auth.uid())
  );

-- Only matched users can insert matches (typically done by system)
-- For now, allow authenticated users to create matches
create policy "Authenticated users can create matches"
  on public.matches
  for insert
  with check (auth.uid() is not null);

-- Users can update their own matches (apply)
-- Project creators can update matches for their projects (accept/decline)
create policy "Users can update their matches"
  on public.matches
  for update
  using (
    user_id = auth.uid() or 
    project_id in (select id from public.projects where creator_id = auth.uid())
  );

-- Indexes for performance
create index if not exists matches_user_idx on public.matches(user_id);
create index if not exists matches_project_idx on public.matches(project_id);
create index if not exists matches_status_idx on public.matches(status);
create index if not exists matches_user_status_idx on public.matches(user_id, status);
create index if not exists matches_project_status_idx on public.matches(project_id, status);

-- Auto-update updated_at trigger
create trigger set_matches_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

-- Comments
comment on column public.matches.similarity_score is 'Cosine similarity score between profile and project embeddings (0-1 range)';
comment on column public.matches.status is 'Match status: pending (new match), applied (user applied), accepted (owner accepted), declined (owner declined)';

-- ============================================
-- MIGRATION 4: Create matching functions
-- ============================================

-- Function: Find matching projects for a user
-- Uses pgvector cosine similarity to find projects that match a user's profile
create or replace function match_projects_to_user(
  user_embedding vector(1536),
  user_id_param uuid,
  match_limit integer default 10
)
returns table (
  project_id uuid,
  similarity float,
  title text,
  description text,
  required_skills text[],
  team_size integer,
  experience_level text,
  commitment_hours integer,
  timeline text,
  creator_id uuid,
  created_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    p.id as project_id,
    1 - (p.embedding <=> user_embedding) as similarity,
    p.title,
    p.description,
    p.required_skills,
    p.team_size,
    p.experience_level,
    p.commitment_hours,
    p.timeline,
    p.creator_id,
    p.created_at,
    p.expires_at
  from public.projects p
  where 
    p.status = 'open'
    and p.embedding is not null
    and p.creator_id != user_id_param  -- Exclude user's own projects
    and p.expires_at > now()  -- Exclude expired projects
  order by similarity desc
  limit match_limit;
end;
$$;

-- Function: Find matching users for a project
-- Uses pgvector cosine similarity to find profiles that match a project
create or replace function match_users_to_project(
  project_embedding vector(1536),
  project_id_param uuid,
  match_limit integer default 10
)
returns table (
  user_id uuid,
  similarity float,
  full_name text,
  headline text,
  bio text,
  skills text[],
  experience_level text,
  availability_hours integer,
  collaboration_style text
)
language plpgsql
security definer
as $$
declare
  project_creator_id uuid;
begin
  -- Get project creator to exclude them from matches
  select creator_id into project_creator_id
  from public.projects
  where id = project_id_param;
  
  return query
  select 
    p.user_id,
    1 - (p.embedding <=> project_embedding) as similarity,
    p.full_name,
    p.headline,
    p.bio,
    p.skills,
    p.experience_level,
    p.availability_hours,
    p.collaboration_style
  from public.profiles p
  where 
    p.embedding is not null
    and p.user_id != project_creator_id  -- Exclude project creator
  order by similarity desc
  limit match_limit;
end;
$$;

-- Function: Auto-expire old projects
-- Updates projects past their expiration date to 'expired' status
create or replace function expire_old_projects()
returns integer
language plpgsql
security definer
as $$
declare
  expired_count integer;
begin
  update public.projects
  set status = 'expired',
      updated_at = now()
  where status = 'open'
    and expires_at < now();
  
  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

-- Comments
comment on function match_projects_to_user is 'Finds top matching projects for a user based on embedding similarity';
comment on function match_users_to_project is 'Finds top matching users for a project based on embedding similarity';
comment on function expire_old_projects is 'Automatically expires projects past their expiration date. Returns count of expired projects.';
