-- Create github_profiles table for storing GitHub enrichment data
create table if not exists public.github_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  
  -- GitHub user info
  github_id text not null,
  github_username text not null,
  github_url text not null,
  avatar_url text,
  
  -- Extracted data
  primary_languages text[] default '{}',
  topics text[] default '{}',
  repo_count integer default 0,
  total_stars integer default 0,
  
  -- Inferred data (from LLM analysis)
  inferred_skills text[] default '{}',
  inferred_interests text[] default '{}',
  coding_style text,
  collaboration_style text check (collaboration_style in ('async', 'sync', 'hybrid')),
  experience_level text check (experience_level in ('junior', 'intermediate', 'senior', 'lead')),
  experience_signals text[] default '{}',
  suggested_bio text,
  
  -- Activity metrics
  activity_level text check (activity_level in ('low', 'medium', 'high')),
  last_active_at timestamptz,
  
  -- Raw data for future analysis
  raw_repos jsonb default '[]'::jsonb,
  
  -- Sync metadata
  last_synced_at timestamptz default now(),
  sync_status text default 'pending' check (sync_status in ('pending', 'syncing', 'completed', 'failed')),
  sync_error text,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for faster lookups
create index if not exists idx_github_profiles_github_username 
  on public.github_profiles(github_username);

create index if not exists idx_github_profiles_sync_status 
  on public.github_profiles(sync_status);

-- Enable RLS
alter table public.github_profiles enable row level security;

-- RLS policies
create policy "GitHub profiles are viewable by the owner"
  on public.github_profiles
  for select
  using (auth.uid() = user_id);

create policy "GitHub profiles can be inserted by the owner"
  on public.github_profiles
  for insert
  with check (auth.uid() = user_id);

create policy "GitHub profiles can be updated by the owner"
  on public.github_profiles
  for update
  using (auth.uid() = user_id);

-- Allow service role full access (for background jobs)
create policy "Service role can manage all github profiles"
  on public.github_profiles
  for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Trigger for updated_at
create trigger set_github_profiles_updated_at
before update on public.github_profiles
for each row execute function public.set_updated_at();
