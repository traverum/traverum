# Supabase scripts

## Copy production data to a branch

Use this to replace test/seed data on the receptionist (or any) branch with real production data for better testing.

### 1. Clear branch and restore production data

- **Clear script:** `clear-branch-data.sql` — truncates all app tables (bookings, reservations, distributions, experiences, partners, users, etc.) so the branch is empty. Run in the branch’s SQL Editor, or via `psql`.
- **Copy script:** `copy-production-to-branch.sh` — dumps **content** from production (partners, hotel_configs, experiences, experience_sessions, media, distributions, reservations, bookings), clears the branch, then restores that data. It does **not** copy `users` or `user_partners` so branch auth stays separate and there are no FK issues with `auth.users`.

### 2. Run the copy script

```bash
# From repo root. Set these (get from Supabase Dashboard → Project → Settings → Database):
export PRODUCTION_DATABASE_URL="postgresql://postgres.[PROD-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
export BRANCH_DATABASE_URL="postgresql://postgres.[BRANCH-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

./apps/dashboard/supabase/scripts/copy-production-to-branch.sh
```

Use the **Session mode** connection string (port 6543). You need `pg_dump` and `psql` on your PATH (Postgres client tools or Supabase CLI).

### 3. After restore

- Sign up at the branch’s receptionist login (e.g. `https://…/receptionist/login` with the widget pointing at the branch).
- In the branch SQL Editor, link your user to a hotel, for example:

```sql
INSERT INTO public.user_partners (user_id, partner_id, role, hotel_config_id, is_default)
SELECT u.id, p.id, 'receptionist', hc.id, true
FROM public.users u, public.partners p, public.hotel_configs hc
WHERE u.email = 'your@email.com' AND hc.partner_id = p.id
ON CONFLICT (user_id, partner_id) DO UPDATE SET role = 'receptionist', hotel_config_id = EXCLUDED.hotel_config_id, is_default = true;
```

Replace `your@email.com` with the email you used to sign up on the branch. Use any `(p, hc)` pair that exists (e.g. a production hotel you want to test with).

### Optional: clear only (no production copy)

To only wipe the branch and keep it empty (or then run seed again):

```bash
psql "$BRANCH_DATABASE_URL" -f apps/dashboard/supabase/scripts/clear-branch-data.sql
```

Or paste the contents of `clear-branch-data.sql` into the branch’s SQL Editor and run it.
