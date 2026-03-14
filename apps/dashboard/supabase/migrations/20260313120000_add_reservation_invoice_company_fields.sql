-- Add company / invoice fields to reservations for B2B bookings.
-- All nullable so existing rows and private guests are unchanged.

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS guest_company_name text,
  ADD COLUMN IF NOT EXISTS guest_vat text,
  ADD COLUMN IF NOT EXISTS guest_billing_address text,
  ADD COLUMN IF NOT EXISTS invoice_requested boolean DEFAULT false;

COMMENT ON COLUMN public.reservations.guest_company_name IS 'Company or organisation name when booking is for a business';
COMMENT ON COLUMN public.reservations.guest_vat IS 'VAT identification number when booking is for a business';
COMMENT ON COLUMN public.reservations.guest_billing_address IS 'Billing address for invoice';
COMMENT ON COLUMN public.reservations.invoice_requested IS 'Guest requested an invoice for this booking';
