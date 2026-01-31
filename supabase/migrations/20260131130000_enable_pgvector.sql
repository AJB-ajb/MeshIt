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
