-- Phase 1: Reserve & Pay on Site — schema additions
-- All changes are additive. Default values preserve existing behavior.
-- Zero blast radius: no existing columns modified, no data migrated.

-- ============================================================
-- 1. partners.payment_mode
-- ============================================================
-- Controls how money moves for this supplier's bookings.
-- 'stripe' = current flow (guest pays upfront through Stripe)
-- 'pay_on_site' = guest saves card as guarantee, pays supplier directly
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'pay_on_site';

ALTER TABLE public.partners
  ADD CONSTRAINT partners_payment_mode_check
  CHECK (payment_mode IN ('stripe', 'pay_on_site'));

-- ============================================================
-- 2. reservations: Stripe Setup Intent tracking
-- ============================================================
-- For pay_on_site flow: tracks the guest's card guarantee
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS stripe_setup_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- ============================================================
-- 3. bookings.payment_mode (denormalized from partner)
-- ============================================================
-- Copied from partner at booking creation time.
-- Lets crons and invoicing filter without joining partners.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'stripe';

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_mode_check
  CHECK (payment_mode IN ('stripe', 'pay_on_site'));

-- ============================================================
-- 4. commission_invoices
-- ============================================================
-- Monthly commission invoices for pay_on_site suppliers.
-- Traverum sends; supplier pays net amount via bank transfer.
CREATE TABLE IF NOT EXISTS public.commission_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  commission_amount_cents integer NOT NULL,
  cancellation_credit_cents integer NOT NULL DEFAULT 0,
  net_amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  paid_at timestamptz,

  CONSTRAINT commission_invoices_status_check
    CHECK (status IN ('draft', 'sent', 'paid')),
  CONSTRAINT commission_invoices_period_check
    CHECK (period_end >= period_start),
  CONSTRAINT commission_invoices_amounts_non_negative
    CHECK (commission_amount_cents >= 0 AND cancellation_credit_cents >= 0)
);

ALTER TABLE public.commission_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own invoices"
  ON public.commission_invoices
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT public.get_user_partner_ids()));

-- ============================================================
-- 5. attendance_verifications
-- ============================================================
-- Prevents suppliers from falsely claiming no-shows.
-- Supplier marks no-show → guest gets email to confirm/deny.
CREATE TABLE IF NOT EXISTS public.attendance_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  supplier_claim text NOT NULL DEFAULT 'no_show',
  guest_response text,
  verification_token text NOT NULL UNIQUE,
  reminder_sent boolean NOT NULL DEFAULT false,
  responded_at timestamptz,
  deadline timestamptz NOT NULL,
  outcome text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT attendance_guest_response_check
    CHECK (guest_response IS NULL OR guest_response IN ('attended', 'not_attended')),
  CONSTRAINT attendance_outcome_check
    CHECK (outcome IN ('pending', 'supplier_upheld', 'guest_overridden'))
);

ALTER TABLE public.attendance_verifications ENABLE ROW LEVEL SECURITY;

-- Suppliers can view verifications for bookings of their experiences
CREATE POLICY "Suppliers can view attendance verifications"
  ON public.attendance_verifications
  FOR SELECT TO authenticated
  USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.reservations r ON r.id = b.reservation_id
      JOIN public.experiences e ON e.id = r.experience_id
      WHERE e.partner_id IN (SELECT public.get_user_partner_ids())
    )
  );

-- ============================================================
-- 6. cancellation_charges
-- ============================================================
-- Off-session charges for late cancellations / no-shows (pay_on_site only).
-- Traverum charges guest's saved card, records here for invoicing.
CREATE TABLE IF NOT EXISTS public.cancellation_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  commission_split_cents jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT cancellation_charges_status_check
    CHECK (status IN ('pending', 'succeeded', 'failed')),
  CONSTRAINT cancellation_charges_amount_positive
    CHECK (amount_cents > 0)
);

ALTER TABLE public.cancellation_charges ENABLE ROW LEVEL SECURITY;

-- Suppliers can view charges for bookings of their experiences
CREATE POLICY "Suppliers can view cancellation charges"
  ON public.cancellation_charges
  FOR SELECT TO authenticated
  USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.reservations r ON r.id = b.reservation_id
      JOIN public.experiences e ON e.id = r.experience_id
      WHERE e.partner_id IN (SELECT public.get_user_partner_ids())
    )
  );
