-- Function: Find matching projects for a user
-- Uses pgvector cosine similarity to find projects that match a user's profile
create or replace function match_projects_to_user(
  user_embedding extensions.vector(1536),
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
  project_embedding extensions.vector(1536),
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
