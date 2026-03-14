-- Run this in your branch SQL Editor (e.g. receptionist-test).
-- Replace YOUR_EMAIL_HERE with the email you use to sign in at /receptionist/login.
--
-- Step 1: Ensure public.users has a row for your auth account (in case the signup trigger didn't run).
-- Step 2: Link that user to Test Hotel so you get past "Access Not Available".

-- Step 1: Backfill public.users from auth.users if missing (no-op if you already have a row)
INSERT INTO public.users (auth_id, email, partner_id)
SELECT au.id, au.email, NULL
FROM auth.users au
WHERE au.email = 'YOUR_EMAIL_HERE'
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = au.id);

-- Step 2: Link your user to Test Hotel
INSERT INTO public.user_partners (user_id, partner_id, role, hotel_config_id, is_default)
SELECT u.id, p.id, 'receptionist', hc.id, true
FROM public.users u
CROSS JOIN public.partners p
CROSS JOIN public.hotel_configs hc
WHERE u.email = 'YOUR_EMAIL_HERE'
  AND p.name = 'Test Hotel'
  AND hc.partner_id = p.id
ON CONFLICT (user_id, partner_id) DO UPDATE
  SET role = 'receptionist', hotel_config_id = EXCLUDED.hotel_config_id, is_default = true;
