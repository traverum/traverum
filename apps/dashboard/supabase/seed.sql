-- Seed data for receptionist and widget testing.
-- Requires: migrations run (including hotel_config_location_radius and get_experiences_within_radius).
-- Widget must point to the same Supabase project to see Recommended + All Nearby.
--
-- After seeding: sign up at /receptionist/login, then run in branch SQL Editor:
--   apps/dashboard/supabase/grant-receptionist-access.sql
-- (Replace YOUR_EMAIL_HERE with your sign-up email so your account is linked to Test Hotel.)

-- 1. Partners: one hotel, two suppliers (second supplier = "nearby only", no distributions)
INSERT INTO public.partners (id, name, email, partner_type)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Test Hotel', 'hotel@test.example', 'hotel'),
  ('11111111-1111-1111-1111-111111111102', 'Test Supplier', 'supplier@test.example', 'supplier'),
  ('11111111-1111-1111-1111-111111111103', 'Local Adventures Co', 'local@test.example', 'supplier')
ON CONFLICT (id) DO NOTHING;

-- Ensure partners.phone exists (receptionist contact) and set for suppliers
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS phone TEXT;
UPDATE public.partners SET phone = '+393331234567' WHERE id = '11111111-1111-1111-1111-111111111102';
UPDATE public.partners SET phone = '+393339876543' WHERE id = '11111111-1111-1111-1111-111111111103';

-- 2. Hotel config for Test Hotel (slug + location so widget and "experiences within radius" work)
INSERT INTO public.hotel_configs (id, partner_id, display_name, slug, location_radius_km, location, address, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111101',
  'Test Hotel',
  'test-hotel',
  25,
  ST_SetSRID(ST_MakePoint(8.65, 45.95), 4326)::geography,
  'Lake Maggiore, Italy',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Experience (supplier) – same area so it appears in "experiences within radius"
INSERT INTO public.experiences (
  id, partner_id, title, slug, description, experience_status,
  price_cents, duration_minutes, max_participants, min_participants,
  location, location_address, allows_requests, tags
)
VALUES (
  '33333333-3333-3333-3333-333333333301',
  '11111111-1111-1111-1111-111111111102',
  'Lake Tour',
  'lake-tour',
  'A short boat tour on the lake.',
  'active',
  5000,
  120,
  10,
  1,
  ST_SetSRID(ST_MakePoint(8.66, 45.94), 4326)::geography,
  'Lake Maggiore pier',
  true,
  ARRAY['nature']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 4. Experience session (tomorrow 10:00, 5 spots) — session_status 'available' so receptionist can book
INSERT INTO public.experience_sessions (
  id, experience_id, session_date, start_time, spots_total, spots_available, session_status
)
VALUES (
  '44444444-4444-4444-4444-444444444401',
  '33333333-3333-3333-3333-333333333301',
  (CURRENT_DATE + INTERVAL '1 day')::date,
  '10:00'::time,
  5,
  5,
  'available'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Grant receptionist access to the most recently created user (the one you signed up with).
--    If you run the full seed after signing up, this links your account to Test Hotel. If you already ran seed before signing up, run only this block (and 6–9) in SQL Editor after signing up.
INSERT INTO public.user_partners (user_id, partner_id, role, hotel_config_id, is_default)
SELECT u.id, p.id, 'receptionist', hc.id, true
FROM public.users u
CROSS JOIN public.partners p
CROSS JOIN public.hotel_configs hc
WHERE p.name = 'Test Hotel' AND hc.partner_id = p.id
  AND u.id = (SELECT id FROM public.users ORDER BY created_at DESC NULLS LAST LIMIT 1)
ON CONFLICT (user_id, partner_id) DO UPDATE SET role = 'receptionist', hotel_config_id = EXCLUDED.hotel_config_id, is_default = true;

-- 6. More experiences (same supplier, same area). First 4 are in Recommended; others only in All Nearby.
INSERT INTO public.experiences (
  id, partner_id, title, slug, description, experience_status,
  price_cents, duration_minutes, max_participants, min_participants,
  location, location_address, allows_requests, tags, hotel_notes
)
VALUES
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111102', 'Wine Tasting', 'wine-tasting', 'Local wines and small bites by the lake.', 'active', 7500, 90, 8, 1, ST_SetSRID(ST_MakePoint(8.64, 45.96), 4326)::geography, 'Vineyard road', true, ARRAY['food']::text[], NULL),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111102', 'Kayak Hour', 'kayak-hour', 'One-hour kayak rental with briefing.', 'active', 3500, 60, 4, 1, ST_SetSRID(ST_MakePoint(8.66, 45.93), 4326)::geography, 'Main pier', true, ARRAY['nature', 'adventure']::text[], 'Meet at pier 10 min before. Life jackets provided.'),
  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111102', 'Sunset Cruise', 'sunset-cruise', 'Evening boat tour with views.', 'active', 12000, 120, 12, 1, ST_SetSRID(ST_MakePoint(8.65, 45.95), 4326)::geography, 'Harbour', true, ARRAY['nature']::text[], NULL),
  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111102', 'Cooking Class', 'cooking-class', 'Hands-on pasta and risotto class.', 'active', 9500, 180, 6, 1, ST_SetSRID(ST_MakePoint(8.64, 45.94), 4326)::geography, 'Cooking school', true, ARRAY['food']::text[], NULL),
  ('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111102', 'Walking Tour', 'walking-tour', 'Historic centre and waterfront walk.', 'active', 2500, 90, 15, 1, ST_SetSRID(ST_MakePoint(8.65, 45.96), 4326)::geography, 'Town square', true, ARRAY['culture']::text[], NULL),
  ('33333333-3333-3333-3333-333333333307', '11111111-1111-1111-1111-111111111102', 'Bike Rental Half Day', 'bike-rental-half-day', 'Half-day bike hire with map.', 'active', 2000, 240, 10, 1, ST_SetSRID(ST_MakePoint(8.66, 45.95), 4326)::geography, 'Bike shop', true, ARRAY['nature', 'adventure']::text[], NULL),
  ('33333333-3333-3333-3333-333333333308', '11111111-1111-1111-1111-111111111102', 'Private Boat Tour', 'private-boat-tour', 'Exclusive 2h boat for your group.', 'active', 45000, 120, 6, 1, ST_SetSRID(ST_MakePoint(8.65, 45.94), 4326)::geography, 'Marina', true, ARRAY['nature']::text[], NULL),
  ('33333333-3333-3333-3333-333333333309', '11111111-1111-1111-1111-111111111102', 'Olive Oil Tasting', 'olive-oil-tasting', 'Visit grove and taste local oils.', 'active', 5500, 75, 8, 1, ST_SetSRID(ST_MakePoint(8.63, 45.97), 4326)::geography, 'Olive farm', true, ARRAY['food']::text[], NULL)
ON CONFLICT (id) DO NOTHING;

-- 7. Sessions for the new experiences (tomorrow and day after) — session_status 'available' for booking
INSERT INTO public.experience_sessions (id, experience_id, session_date, start_time, spots_total, spots_available, session_status)
VALUES
  ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333302', (CURRENT_DATE + INTERVAL '1 day')::date, '11:00'::time, 8, 8, 'available'),
  ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333303', (CURRENT_DATE + INTERVAL '1 day')::date, '09:00'::time, 4, 4, 'available'),
  ('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333304', (CURRENT_DATE + INTERVAL '1 day')::date, '18:00'::time, 12, 12, 'available'),
  ('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333305', (CURRENT_DATE + INTERVAL '2 days')::date, '10:00'::time, 6, 6, 'available'),
  ('44444444-4444-4444-4444-444444444406', '33333333-3333-3333-3333-333333333306', (CURRENT_DATE + INTERVAL '1 day')::date, '14:00'::time, 15, 15, 'available'),
  ('44444444-4444-4444-4444-444444444407', '33333333-3333-3333-3333-333333333307', (CURRENT_DATE + INTERVAL '1 day')::date, '08:00'::time, 10, 10, 'available'),
  ('44444444-4444-4444-4444-444444444408', '33333333-3333-3333-3333-333333333308', (CURRENT_DATE + INTERVAL '2 days')::date, '15:00'::time, 6, 6, 'available'),
  ('44444444-4444-4444-4444-444444444409', '33333333-3333-3333-3333-333333333309', (CURRENT_DATE + INTERVAL '1 day')::date, '10:30'::time, 8, 8, 'available')
ON CONFLICT (id) DO NOTHING;

-- 8. Second supplier: two experiences (no distributions) — they appear only in "All Nearby"
INSERT INTO public.experiences (
  id, partner_id, title, slug, description, experience_status,
  price_cents, duration_minutes, max_participants, min_participants,
  location, location_address, allows_requests, tags
)
VALUES
  ('33333333-3333-3333-3333-333333333310', '11111111-1111-1111-1111-111111111103', 'Yoga by the Lake', 'yoga-by-the-lake', 'Morning yoga session with lake views.', 'active', 3500, 60, 12, 1, ST_SetSRID(ST_MakePoint(8.64, 45.95), 4326)::geography, 'Lakeside park', true, ARRAY['wellness', 'nature']::text[]),
  ('33333333-3333-3333-3333-333333333311', '11111111-1111-1111-1111-111111111103', 'Photography Walk', 'photography-walk', 'Guided photo walk around the old town.', 'active', 4000, 120, 8, 1, ST_SetSRID(ST_MakePoint(8.65, 45.96), 4326)::geography, 'Town square', true, ARRAY['culture']::text[])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.experience_sessions (id, experience_id, session_date, start_time, spots_total, spots_available, session_status)
VALUES
  ('44444444-4444-4444-4444-444444444410', '33333333-3333-3333-3333-333333333310', (CURRENT_DATE + INTERVAL '1 day')::date, '07:00'::time, 12, 12, 'available'),
  ('44444444-4444-4444-4444-444444444411', '33333333-3333-3333-3333-333333333311', (CURRENT_DATE + INTERVAL '1 day')::date, '16:00'::time, 8, 8, 'available')
ON CONFLICT (id) DO NOTHING;

-- 8b. Media: test images (Picsum) so receptionist and widget show images. Some experiences have 2–3 images.
INSERT INTO public.media (id, partner_id, storage_path, url, experience_id, sort_order)
VALUES
  ('66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111102', 'seed/lake-tour-1.jpg', 'https://picsum.photos/seed/lake-tour-1/800/600', '33333333-3333-3333-3333-333333333301', 0),
  ('66666666-6666-6666-6666-666666666602', '11111111-1111-1111-1111-111111111102', 'seed/lake-tour-2.jpg', 'https://picsum.photos/seed/lake-tour-2/800/600', '33333333-3333-3333-3333-333333333301', 1),
  ('66666666-6666-6666-6666-666666666603', '11111111-1111-1111-1111-111111111102', 'seed/wine-tasting-1.jpg', 'https://picsum.photos/seed/wine-tasting-1/800/600', '33333333-3333-3333-3333-333333333302', 0),
  ('66666666-6666-6666-6666-666666666604', '11111111-1111-1111-1111-111111111102', 'seed/wine-tasting-2.jpg', 'https://picsum.photos/seed/wine-tasting-2/800/600', '33333333-3333-3333-3333-333333333302', 1),
  ('66666666-6666-6666-6666-666666666605', '11111111-1111-1111-1111-111111111102', 'seed/kayak-1.jpg', 'https://picsum.photos/seed/kayak-hour/800/600', '33333333-3333-3333-3333-333333333303', 0),
  ('66666666-6666-6666-6666-666666666606', '11111111-1111-1111-1111-111111111102', 'seed/sunset-1.jpg', 'https://picsum.photos/seed/sunset-cruise-1/800/600', '33333333-3333-3333-3333-333333333304', 0),
  ('66666666-6666-6666-6666-666666666607', '11111111-1111-1111-1111-111111111102', 'seed/sunset-2.jpg', 'https://picsum.photos/seed/sunset-cruise-2/800/600', '33333333-3333-3333-3333-333333333304', 1),
  ('66666666-6666-6666-6666-666666666608', '11111111-1111-1111-1111-111111111102', 'seed/sunset-3.jpg', 'https://picsum.photos/seed/sunset-cruise-3/800/600', '33333333-3333-3333-3333-333333333304', 2),
  ('66666666-6666-6666-6666-666666666609', '11111111-1111-1111-1111-111111111102', 'seed/cooking-1.jpg', 'https://picsum.photos/seed/cooking-class-1/800/600', '33333333-3333-3333-3333-333333333305', 0),
  ('66666666-6666-6666-6666-666666666610', '11111111-1111-1111-1111-111111111102', 'seed/cooking-2.jpg', 'https://picsum.photos/seed/cooking-class-2/800/600', '33333333-3333-3333-3333-333333333305', 1),
  ('66666666-6666-6666-6666-666666666611', '11111111-1111-1111-1111-111111111102', 'seed/walking-1.jpg', 'https://picsum.photos/seed/walking-tour/800/600', '33333333-3333-3333-3333-333333333306', 0),
  ('66666666-6666-6666-6666-666666666612', '11111111-1111-1111-1111-111111111102', 'seed/bike-1.jpg', 'https://picsum.photos/seed/bike-rental-1/800/600', '33333333-3333-3333-3333-333333333307', 0),
  ('66666666-6666-6666-6666-666666666613', '11111111-1111-1111-1111-111111111102', 'seed/bike-2.jpg', 'https://picsum.photos/seed/bike-rental-2/800/600', '33333333-3333-3333-3333-333333333307', 1),
  ('66666666-6666-6666-6666-666666666614', '11111111-1111-1111-1111-111111111102', 'seed/private-boat-1.jpg', 'https://picsum.photos/seed/private-boat-1/800/600', '33333333-3333-3333-3333-333333333308', 0),
  ('66666666-6666-6666-6666-666666666615', '11111111-1111-1111-1111-111111111102', 'seed/private-boat-2.jpg', 'https://picsum.photos/seed/private-boat-2/800/600', '33333333-3333-3333-3333-333333333308', 1),
  ('66666666-6666-6666-6666-666666666616', '11111111-1111-1111-1111-111111111102', 'seed/private-boat-3.jpg', 'https://picsum.photos/seed/private-boat-3/800/600', '33333333-3333-3333-3333-333333333308', 2),
  ('66666666-6666-6666-6666-666666666617', '11111111-1111-1111-1111-111111111102', 'seed/olive-oil-1.jpg', 'https://picsum.photos/seed/olive-oil/800/600', '33333333-3333-3333-3333-333333333309', 0),
  ('66666666-6666-6666-6666-666666666618', '11111111-1111-1111-1111-111111111103', 'seed/yoga-1.jpg', 'https://picsum.photos/seed/yoga-lake-1/800/600', '33333333-3333-3333-3333-333333333310', 0),
  ('66666666-6666-6666-6666-666666666619', '11111111-1111-1111-1111-111111111103', 'seed/yoga-2.jpg', 'https://picsum.photos/seed/yoga-lake-2/800/600', '33333333-3333-3333-3333-333333333310', 1),
  ('66666666-6666-6666-6666-666666666620', '11111111-1111-1111-1111-111111111103', 'seed/photography-1.jpg', 'https://picsum.photos/seed/photography-walk-1/800/600', '33333333-3333-3333-3333-333333333311', 0),
  ('66666666-6666-6666-6666-666666666621', '11111111-1111-1111-1111-111111111103', 'seed/photography-2.jpg', 'https://picsum.photos/seed/photography-walk-2/800/600', '33333333-3333-3333-3333-333333333311', 1)
ON CONFLICT (id) DO NOTHING;

-- 9. Distributions: only 4 experiences are "Recommended" (hotel selected). The rest appear only in "All Nearby".
INSERT INTO public.distributions (id, experience_id, hotel_id, hotel_config_id, commission_supplier, commission_platform, commission_hotel)
VALUES
  ('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 80, 8, 12),
  ('55555555-5555-5555-5555-555555555502', '33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 80, 8, 12),
  ('55555555-5555-5555-5555-555555555503', '33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 80, 8, 12),
  ('55555555-5555-5555-5555-555555555504', '33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 80, 8, 12)
ON CONFLICT (id) DO NOTHING;
