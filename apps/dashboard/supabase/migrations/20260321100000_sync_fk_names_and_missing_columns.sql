-- Sync FK constraint names to match PostgREST hints used in widget code.
-- Production had these renamed manually; this migration captures the change.
-- Also adds columns that were created via dashboard but not captured in migrations.

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

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reservations_hotel_id_fkey'
      AND table_name = 'reservations'
  ) THEN
    ALTER TABLE reservations RENAME CONSTRAINT reservations_hotel_id_fkey TO reservations_hotel_fk;
  END IF;
END $$;

-- Add missing columns on partners (Stripe Connect fields)
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false;

-- Add is_active + sort_order on distributions
ALTER TABLE public.distributions
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Add missing columns on reservations
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS is_request boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS requested_date date,
  ADD COLUMN IF NOT EXISTS requested_time time,
  ADD COLUMN IF NOT EXISTS time_preference text,
  ADD COLUMN IF NOT EXISTS payment_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_payment_link_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_link_url text,
  ADD COLUMN IF NOT EXISTS rental_start_date date,
  ADD COLUMN IF NOT EXISTS rental_end_date date;

-- hotel_id must be nullable for direct Veyond bookings (hotel_id = null)
ALTER TABLE public.reservations
  ALTER COLUMN hotel_id DROP NOT NULL;

-- Add missing columns on bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS experience_id uuid REFERENCES public.experiences(id),
  ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.partners(id),
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.partners(id),
  ADD COLUMN IF NOT EXISTS total_cents integer,
  ADD COLUMN IF NOT EXISTS supplier_cents integer,
  ADD COLUMN IF NOT EXISTS hotel_cents integer,
  ADD COLUMN IF NOT EXISTS platform_cents integer,
  ADD COLUMN IF NOT EXISTS booking_status text DEFAULT 'confirmed',
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_charge_id text;

-- session_id nullable on bookings (rentals don't have sessions)
ALTER TABLE public.bookings
  ALTER COLUMN session_id DROP NOT NULL;
