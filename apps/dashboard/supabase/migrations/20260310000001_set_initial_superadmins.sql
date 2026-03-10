-- Set initial Traverum superadmins by email.
-- Run after 20260310000000_add_superadmin_and_audit_log.sql
UPDATE public.users
SET is_superadmin = true
WHERE email IN (
  'elias.salmi@traverum.com',
  'alessio.garzonio@traverum.com'
);
