-- Remove backup tables from production (security: they had no RLS, anon could read/write).
-- These were one-off copies and should not live in the live database.

DROP TABLE IF EXISTS public.backup_20260312_lago_maggiore_reservations;
DROP TABLE IF EXISTS public.backup_20260312_lago_maggiore_distributions;
DROP TABLE IF EXISTS public.backup_20260312_lago_maggiore_hotel_configs;
