-- Allow paid_at to be NULL for pay_on_site bookings.
-- These bookings are confirmed with a card guarantee but payment
-- happens on-site, so paid_at is only set after the guest pays.
ALTER TABLE public.bookings
  ALTER COLUMN paid_at DROP NOT NULL;
