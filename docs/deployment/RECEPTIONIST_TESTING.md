# Testing the receptionist tool (production)

## Does any user have receptionist access?

**No.** In production, no user has receptionist capability until you run the grant SQL. There is no invitation UI yet — you link a user to a hotel manually in Supabase.

---

## How to test (production)

### 1. Sign up as the receptionist

1. Open **https://book.veyond.eu/receptionist/login** (or your widget URL).
2. Sign up with the email you want to use (e.g. your own). Supabase Auth will create the account; a trigger should create a row in `public.users` (if not, the grant script backfills it).

### 2. See who exists and which hotels can be used

In **Supabase Dashboard** → your **production** project → **SQL Editor**, run:

```sql
-- Users (pick the email you signed up with)
SELECT id, email, created_at FROM public.users ORDER BY created_at DESC LIMIT 20;

-- Hotels that can be used for receptionist (must have location for "All Nearby" to work)
SELECT p.name AS hotel_name, hc.slug, hc.display_name,
       (hc.location IS NOT NULL) AS has_location,
       hc.location_radius_km
FROM public.partners p
JOIN public.hotel_configs hc ON hc.partner_id = p.id
WHERE p.partner_type = 'hotel'
ORDER BY p.name;

-- Who already has receptionist (or owner/admin) access
SELECT u.email, p.name AS hotel, up.role
FROM public.user_partners up
JOIN public.users u ON u.id = up.user_id
JOIN public.partners p ON p.id = up.partner_id
WHERE up.role IN ('receptionist', 'owner', 'admin');
```

Use the first two to choose **your email** and a **hotel name** that has `has_location = true`. Use the third to confirm no one (or who) already has access.

### 3. Grant receptionist access to your user

In the same SQL Editor, run the script below. Replace:

- `YOUR_EMAIL_HERE` → the email you used at `/receptionist/login`
- `'Your Hotel Name'` → exact `name` from `partners` for the hotel (from the second query above)

```sql
-- Backfill public.users if the signup trigger didn't run
INSERT INTO public.users (auth_id, email, partner_id)
SELECT au.id, au.email, NULL
FROM auth.users au
WHERE au.email = 'YOUR_EMAIL_HERE'
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = au.id);

-- Link your user to the hotel as receptionist
INSERT INTO public.user_partners (user_id, partner_id, role, hotel_config_id, is_default)
SELECT u.id, p.id, 'receptionist', hc.id, true
FROM public.users u
CROSS JOIN public.partners p
CROSS JOIN public.hotel_configs hc
WHERE u.email = 'YOUR_EMAIL_HERE'
  AND p.name = 'Your Hotel Name'
  AND hc.partner_id = p.id
ON CONFLICT (user_id, partner_id) DO UPDATE
  SET role = 'receptionist', hotel_config_id = EXCLUDED.hotel_config_id, is_default = true;
```

### 4. Use the tool

1. Go to **https://book.veyond.eu/receptionist** and log in with that email.
2. You should see **Book** and **Bookings**, and the hotel name in the nav.
3. **Recommended** tab shows experiences the hotel has in `distributions`; **All Nearby** shows experiences within the hotel’s `location_radius_km` (only if `hotel_configs.location` is set).

---

## Requirements for the hotel

| Requirement | Why |
|-------------|-----|
| Partner type `hotel` | Only hotels get a receptionist context. |
| `hotel_configs` row with `partner_id` | One config per hotel. |
| `hotel_configs.location` (geography) set | Needed for “All Nearby” (PostGIS radius). If null, Recommended still works if there are distributions. |
| `hotel_configs.location_radius_km` | Default 25; used for nearby radius. |
| Distributions (optional) | For “Recommended” tab; without them only “All Nearby” has items (if location is set). |

---

## Quick reference: grant script (by slug)

If you prefer to identify the hotel by **slug** (e.g. `test-hotel`):

```sql
INSERT INTO public.user_partners (user_id, partner_id, role, hotel_config_id, is_default)
SELECT u.id, hc.partner_id, 'receptionist', hc.id, true
FROM public.users u
CROSS JOIN public.hotel_configs hc
WHERE u.email = 'YOUR_EMAIL_HERE'
  AND hc.slug = 'your-hotel-slug'
ON CONFLICT (user_id, partner_id) DO UPDATE
  SET role = 'receptionist', hotel_config_id = EXCLUDED.hotel_config_id, is_default = true;
```

Run the users backfill (first block from step 3) if the user doesn’t exist in `public.users` yet.
