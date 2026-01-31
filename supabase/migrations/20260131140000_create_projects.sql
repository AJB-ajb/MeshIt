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
  embedding extensions.vector(1536),
  
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

-- Skip vector index creation for now - will be created after data is populated
-- Index can be added later via: CREATE INDEX projects_embedding_idx ON projects USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Auto-update updated_at trigger
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- Comments
comment on column public.projects.embedding is '1536-dimensional embedding vector from OpenAI text-embedding-3-small';
comment on column public.projects.status is 'Project status: open (accepting applications), closed (manually closed), filled (team complete), expired (past expiration date)';
