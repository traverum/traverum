-- Add rental pricing fields for per_day pricing type
ALTER TABLE public.experiences
ADD COLUMN min_days integer,
ADD COLUMN max_days integer;

-- Add comment to clarify usage
COMMENT ON COLUMN public.experiences.min_days IS 'Minimum rental period in days (required for per_day pricing)';
COMMENT ON COLUMN public.experiences.max_days IS 'Maximum rental period in days (optional for per_day pricing)';
