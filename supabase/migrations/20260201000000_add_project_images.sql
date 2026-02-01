-- Add image_url column to projects table
alter table public.projects
add column if not exists image_url text;

-- Add comment
comment on column public.projects.image_url is 'URL to the AI-generated project thumbnail image stored in Supabase Storage';

-- Create storage bucket for project images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

-- Enable RLS on the bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'project-images' );

create policy "Authenticated users can upload project images"
on storage.objects for insert
with check ( bucket_id = 'project-images' and auth.role() = 'authenticated' );

create policy "Users can update their own project images"
on storage.objects for update
using ( bucket_id = 'project-images' and auth.role() = 'authenticated' );

create policy "Users can delete their own project images"
on storage.objects for delete
using ( bucket_id = 'project-images' and auth.role() = 'authenticated' );
