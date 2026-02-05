-- Add new pricing columns to experiences
ALTER TABLE experiences
ADD COLUMN pricing_type varchar NOT NULL DEFAULT 'per_person',
ADD COLUMN base_price_cents integer NOT NULL DEFAULT 0,
ADD COLUMN included_participants integer NOT NULL DEFAULT 0,
ADD COLUMN extra_person_cents integer NOT NULL DEFAULT 0,
ADD COLUMN min_participants integer NOT NULL DEFAULT 1;

-- Migrate existing data (all current experiences are per-person)
UPDATE experiences
SET 
  pricing_type = 'per_person',
  base_price_cents = 0,
  included_participants = 0,
  extra_person_cents = price_cents,
  min_participants = 1;

-- Add session pricing override
ALTER TABLE experience_sessions
ADD COLUMN price_override_cents integer,
ADD COLUMN price_note varchar;

-- Update allows_requests default to true (ensuring on-request is the primary mode)
ALTER TABLE experiences
ALTER COLUMN allows_requests SET DEFAULT true;