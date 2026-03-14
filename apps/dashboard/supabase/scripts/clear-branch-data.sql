-- Clear all application data from the current database (e.g. receptionist branch).
-- Run this BEFORE restoring production data so FKs are satisfied.
-- Uses CASCADE so dependent rows are cleared; order is child tables first.
--
-- Usage: run in Supabase SQL Editor (branch), or:
--   psql "$BRANCH_DATABASE_URL" -f apps/dashboard/supabase/scripts/clear-branch-data.sql

BEGIN;

-- Child tables first (no other tables depend on these)
TRUNCATE public.bookings RESTART IDENTITY CASCADE;
TRUNCATE public.reservations RESTART IDENTITY CASCADE;
TRUNCATE public.distributions RESTART IDENTITY CASCADE;
TRUNCATE public.user_partners RESTART IDENTITY CASCADE;
TRUNCATE public.experience_sessions RESTART IDENTITY CASCADE;
TRUNCATE public.media RESTART IDENTITY CASCADE;
TRUNCATE public.experiences RESTART IDENTITY CASCADE;
TRUNCATE public.hotel_configs RESTART IDENTITY CASCADE;
-- Optional: uncomment if your branch has these tables (same migration order)
-- TRUNCATE public.support_feedback RESTART IDENTITY CASCADE;
-- TRUNCATE public.admin_audit_log RESTART IDENTITY CASCADE;
-- TRUNCATE public.analytics_events RESTART IDENTITY CASCADE;
TRUNCATE public.partners RESTART IDENTITY CASCADE;
TRUNCATE public.users RESTART IDENTITY CASCADE;

COMMIT;
