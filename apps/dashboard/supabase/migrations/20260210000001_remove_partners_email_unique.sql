-- Remove UNIQUE constraint on partners.email
-- Multiple organizations can share the same email address
-- (one user can create multiple organizations with their email)
ALTER TABLE public.partners DROP CONSTRAINT IF EXISTS partners_email_unique;
ALTER TABLE public.partners DROP CONSTRAINT IF EXISTS partners_email_key;
DROP INDEX IF EXISTS partners_email_unique;
DROP INDEX IF EXISTS partners_email_key;

-- Remove UNIQUE constraint on hotel_configs.partner_id
-- Multiple hotel properties can belong to the same organization
ALTER TABLE public.hotel_configs DROP CONSTRAINT IF EXISTS hotel_configs_partner_id_key;
ALTER TABLE public.hotel_configs DROP CONSTRAINT IF EXISTS hotel_configs_partner_id_unique;
ALTER TABLE public.hotel_configs DROP CONSTRAINT IF EXISTS hotel_configs_partner_unique;
DROP INDEX IF EXISTS hotel_configs_partner_id_key;
DROP INDEX IF EXISTS hotel_configs_partner_id_unique;
DROP INDEX IF EXISTS hotel_configs_partner_unique;
