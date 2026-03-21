-- Sync FK constraint names to match PostgREST hints used in widget code.
-- Production had these renamed manually; this migration captures the change.

-- Rename FK constraints (IF the default names exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'hotel_configs_partner_id_fkey'
      AND table_name = 'hotel_configs'
  ) THEN
    ALTER TABLE hotel_configs RENAME CONSTRAINT hotel_configs_partner_id_fkey TO hotel_configs_partner_fk;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'distributions_experience_id_fkey'
      AND table_name = 'distributions'
  ) THEN
    ALTER TABLE distributions RENAME CONSTRAINT distributions_experience_id_fkey TO distributions_experience_fk;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'experiences_partner_id_fkey'
      AND table_name = 'experiences'
  ) THEN
    ALTER TABLE experiences RENAME CONSTRAINT experiences_partner_id_fkey TO experiences_partner_fk;
  END IF;
END $$;

-- Add missing columns on partners (Stripe Connect fields)
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false;

-- Add is_active on distributions (code filters by this)
ALTER TABLE public.distributions
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
