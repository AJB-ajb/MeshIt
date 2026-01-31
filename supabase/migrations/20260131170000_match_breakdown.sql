-- Migration: Add score breakdown to matches table
-- Adds fine-grained attribute scoring for matches

-- Add score_breakdown column to matches table
alter table public.matches 
add column if not exists score_breakdown jsonb default null;

-- Comment on the new column
comment on column public.matches.score_breakdown is 'Per-dimension match scores: semantic, skills_overlap, experience_match, commitment_match';

-- Helper function: Map experience level to ordinal value for distance calculation
-- Returns a numeric value representing the experience level hierarchy
create or replace function experience_to_ordinal(level text)
returns integer
language plpgsql
immutable
as $$
begin
  return case level
    when 'beginner' then 1
    when 'junior' then 2
    when 'intermediate' then 3
    when 'advanced' then 4
    when 'senior' then 5
    when 'lead' then 6
    when 'any' then 3  -- Treat 'any' as intermediate
    else 3  -- Default to intermediate for unknown values
  end;
end;
$$;

-- Function: Compute match breakdown scores
-- Calculates per-dimension compatibility scores between a profile and project
create or replace function compute_match_breakdown(
  profile_user_id uuid,
  target_project_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  profile_rec record;
  project_rec record;
  skills_score float;
  experience_score float;
  commitment_score float;
  semantic_score float;
  skills_intersection text[];
begin
  -- Fetch profile and project records
  select * into profile_rec 
  from public.profiles 
  where user_id = profile_user_id;
  
  select * into project_rec 
  from public.projects 
  where id = target_project_id;
  
  -- Validate records exist
  if profile_rec is null then
    raise exception 'Profile not found for user_id: %', profile_user_id;
  end if;
  
  if project_rec is null then
    raise exception 'Project not found for project_id: %', target_project_id;
  end if;
  
  -- Skills overlap: intersection / required_skills count
  -- Calculate how many required skills the user has
  select case
    when profile_rec.skills is null or project_rec.required_skills is null then 1.0
    when array_length(project_rec.required_skills, 1) is null or array_length(project_rec.required_skills, 1) = 0 then 1.0
    else (
      select coalesce(
        array_length(
          array(
            select unnest(profile_rec.skills)
            intersect
            select unnest(project_rec.required_skills)
          ),
          1
        )::float / array_length(project_rec.required_skills, 1)::float,
        0.0
      )
    )
  end into skills_score;
  
  -- Experience match: 1 - |diff|/scale
  -- Maps experience levels to ordinals and computes normalized distance
  select case
    when profile_rec.experience_level is null or project_rec.experience_level is null then 1.0
    when profile_rec.experience_level = project_rec.experience_level then 1.0
    when project_rec.experience_level = 'any' then 1.0
    else 1.0 - least(
      abs(
        experience_to_ordinal(profile_rec.experience_level) - 
        experience_to_ordinal(project_rec.experience_level)
      )::float / 5.0,
      1.0
    )
  end into experience_score;
  
  -- Commitment match: normalized difference in hours
  -- Computes how well user availability matches project commitment
  select case
    when profile_rec.availability_hours is null or project_rec.commitment_hours is null then 1.0
    when profile_rec.availability_hours = 0 and project_rec.commitment_hours = 0 then 1.0
    else 1.0 - least(
      abs(profile_rec.availability_hours - project_rec.commitment_hours)::float / 
      greatest(profile_rec.availability_hours, project_rec.commitment_hours, 1)::float,
      1.0
    )
  end into commitment_score;
  
  -- Semantic score: cosine similarity between embeddings
  -- Uses pgvector cosine distance operator
  select case
    when profile_rec.embedding is null or project_rec.embedding is null then 0.0
    else 1 - (profile_rec.embedding <=> project_rec.embedding)
  end into semantic_score;
  
  -- Return breakdown as JSONB object
  return jsonb_build_object(
    'semantic', coalesce(semantic_score, 0.0),
    'skills_overlap', coalesce(skills_score, 1.0),
    'experience_match', coalesce(experience_score, 1.0),
    'commitment_match', coalesce(commitment_score, 1.0)
  );
end;
$$;

-- Comments
comment on function experience_to_ordinal is 'Maps experience level strings to ordinal values for distance calculation';
comment on function compute_match_breakdown is 'Computes per-dimension compatibility scores between a profile and project';
