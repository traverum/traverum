-- Drop the old constraint and add one with correct values
ALTER TABLE public.experiences DROP CONSTRAINT experiences_status_check;

ALTER TABLE public.experiences ADD CONSTRAINT experiences_status_check 
  CHECK (experience_status IN ('draft', 'active', 'archived'));

-- Update all experiences to active
UPDATE public.experiences SET experience_status = 'active';