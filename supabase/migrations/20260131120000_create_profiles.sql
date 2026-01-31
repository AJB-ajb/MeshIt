create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  headline text,
  bio text,
  location text,
  experience_level text,
  collaboration_style text,
  availability_hours integer,
  skills text[],
  interests text[],
  portfolio_url text,
  github_url text,
  project_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by the owner"
  on public.profiles
  for select
  using (auth.uid() = user_id);

create policy "Profiles can be inserted by the owner"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

create policy "Profiles can be updated by the owner"
  on public.profiles
  for update
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
