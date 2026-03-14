-- Add columns used by get_experiences_within_radius and seed (missing when schema comes from bootstrap).
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT 10;
