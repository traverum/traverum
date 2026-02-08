-- Phase 4A: Multi-Property Support
-- Drop UNIQUE constraint on hotel_configs.partner_id to allow multiple properties per org.
-- Add hotel_config_id to distributions and reservations for per-property scoping.

-- ============================================================
-- Step 1: Drop the UNIQUE constraint on hotel_configs.partner_id
-- (keep the FK relationship, just allow multiple rows per partner)
-- ============================================================
ALTER TABLE public.hotel_configs
  DROP CONSTRAINT hotel_configs_partner_unique;

-- ============================================================
-- Step 2: Add hotel_config_id to distributions
-- ============================================================
ALTER TABLE public.distributions
  ADD COLUMN hotel_config_id uuid REFERENCES public.hotel_configs(id);

-- ============================================================
-- Step 3: Add hotel_config_id to reservations
-- ============================================================
ALTER TABLE public.reservations
  ADD COLUMN hotel_config_id uuid REFERENCES public.hotel_configs(id);

-- ============================================================
-- Step 4: Backfill existing distributions
-- Set hotel_config_id from matching hotel_configs row (via hotel_id = partner_id)
-- ============================================================
UPDATE public.distributions d
SET hotel_config_id = (
  SELECT hc.id
  FROM public.hotel_configs hc
  WHERE hc.partner_id = d.hotel_id
  LIMIT 1
)
WHERE d.hotel_config_id IS NULL;

-- ============================================================
-- Step 5: Backfill existing reservations
-- Set hotel_config_id from matching hotel_configs row (via hotel_id = partner_id)
-- ============================================================
UPDATE public.reservations r
SET hotel_config_id = (
  SELECT hc.id
  FROM public.hotel_configs hc
  WHERE hc.partner_id = r.hotel_id
  LIMIT 1
)
WHERE r.hotel_config_id IS NULL;

-- ============================================================
-- Step 6: Add index for performance
-- ============================================================
CREATE INDEX idx_distributions_hotel_config_id ON public.distributions(hotel_config_id);
CREATE INDEX idx_reservations_hotel_config_id ON public.reservations(hotel_config_id);
