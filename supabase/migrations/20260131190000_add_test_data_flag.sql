-- Add is_test_data flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_test_data boolean NOT NULL DEFAULT true;

-- Add is_test_data flag to projects
ALTER TABLE public.projects 
ADD COLUMN is_test_data boolean NOT NULL DEFAULT true;

-- Mark all existing data as test data
UPDATE public.profiles SET is_test_data = true;
UPDATE public.projects SET is_test_data = true;

-- Add indexes for performance
CREATE INDEX profiles_is_test_data_idx ON public.profiles(is_test_data);
CREATE INDEX projects_is_test_data_idx ON public.projects(is_test_data);

-- Comments
COMMENT ON COLUMN public.profiles.is_test_data IS 'Flag indicating whether this is test/mock data (true) or production data (false). Used for data isolation between environments.';
COMMENT ON COLUMN public.projects.is_test_data IS 'Flag indicating whether this is test/mock data (true) or production data (false). Used for data isolation between environments.';
