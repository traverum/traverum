-- Add tags column to experiences table
ALTER TABLE public.experiences
ADD COLUMN tags text[] DEFAULT '{}' NOT NULL;