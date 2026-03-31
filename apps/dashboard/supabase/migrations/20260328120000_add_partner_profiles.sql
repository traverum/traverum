-- Add host profile fields to partners for guest-facing "Hosts" section
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS profile_visible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS partner_slug text;

-- Unique constraint on partner_slug (only non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS partners_partner_slug_unique
  ON partners (partner_slug)
  WHERE partner_slug IS NOT NULL;
