-- Add available_languages column to experiences table
ALTER TABLE public.experiences
ADD COLUMN available_languages text[] DEFAULT '{}' NOT NULL;

-- Add preferred_language column to reservations table
ALTER TABLE public.reservations
ADD COLUMN preferred_language varchar(10);
