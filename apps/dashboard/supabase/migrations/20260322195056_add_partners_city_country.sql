-- Display fields on partners (dashboard useUserPartners nested select).
-- Matches staging history; idempotent for environments that already have columns.
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text;
