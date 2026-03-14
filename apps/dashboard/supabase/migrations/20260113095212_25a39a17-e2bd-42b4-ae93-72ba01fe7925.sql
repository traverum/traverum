-- Add new pricing columns to experiences
ALTER TABLE experiences
ADD COLUMN IF NOT EXISTS pricing_type varchar NOT NULL DEFAULT 'per_person',
ADD COLUMN IF NOT EXISTS base_price_cents integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS included_participants integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_person_cents integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_participants integer NOT NULL DEFAULT 1;

-- Ensure price_cents exists for migration (bootstrap may not have it)
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS price_cents integer NOT NULL DEFAULT 0;

-- Migrate existing data (all current experiences are per-person)
UPDATE experiences
SET 
  pricing_type = 'per_person',
  base_price_cents = 0,
  included_participants = 0,
  extra_person_cents = COALESCE(price_cents, 0),
  min_participants = 1;

-- Add session pricing override
ALTER TABLE experience_sessions
ADD COLUMN IF NOT EXISTS price_override_cents integer,
ADD COLUMN IF NOT EXISTS price_note varchar;

-- Ensure allows_requests exists (bootstrap may have it)
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS allows_requests boolean DEFAULT true;

-- Update allows_requests default to true (ensuring on-request is the primary mode)
ALTER TABLE experiences
ALTER COLUMN allows_requests SET DEFAULT true;