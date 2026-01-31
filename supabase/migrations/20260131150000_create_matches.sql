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
