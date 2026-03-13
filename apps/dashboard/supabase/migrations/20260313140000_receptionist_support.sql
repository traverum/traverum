-- Receptionist tool support
-- Adds fields for hotel-only experience notes, receptionist role, and booking attribution.

-- 1. Experience: hotel-only operational notes (not visible to guests)
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS hotel_notes TEXT;

-- 2. Partners: website URL for supplier profile
ALTER TABLE partners ADD COLUMN IF NOT EXISTS website_url TEXT;

-- 3. User partners: link receptionist to a specific hotel property
ALTER TABLE user_partners ADD COLUMN IF NOT EXISTS hotel_config_id UUID REFERENCES hotel_configs(id);

-- 4. User partners: expand role constraint to include 'receptionist'
ALTER TABLE user_partners DROP CONSTRAINT IF EXISTS user_partners_role_check;
ALTER TABLE user_partners ADD CONSTRAINT user_partners_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'receptionist'));

-- 5. Reservations: track who created the booking (receptionist user id)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS booked_by_user_id UUID REFERENCES users(id);

-- Index for querying reservations by the receptionist who created them
CREATE INDEX IF NOT EXISTS idx_reservations_booked_by ON reservations(booked_by_user_id)
  WHERE booked_by_user_id IS NOT NULL;
