-- Enable pgvector extension for similarity search
-- On Supabase, the extension is typically in the 'extensions' schema
create extension if not exists vector with schema extensions;

-- Add embedding column to profiles table
-- Use extensions.vector to reference the type
alter table public.profiles
add column if not exists embedding extensions.vector(1536);

-- Skip index creation for now - will be created after data is populated
-- The pgvector version on this Supabase instance may be older
-- Index can be added later via: CREATE INDEX profiles_embedding_idx ON profiles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add comment explaining the embedding dimension
comment on column public.profiles.embedding is '1536-dimensional embedding vector from OpenAI text-embedding-3-small';
