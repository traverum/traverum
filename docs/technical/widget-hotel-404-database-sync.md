# Widget hotel 404 — database sync required

This doc describes why the widget shows "Hotel Not Found" (404) for hotel slugs (e.g. `http://localhost:3000/test-hotel`) when the hotel row exists, and exactly what must be changed in the database to fix it.

## Context

- **Widget:** Next.js app in `apps/widget`. Hotel list page is `/[hotelSlug]` (e.g. `/test-hotel`).
- **Flow:** The layout (`[hotelSlug]/layout.tsx`) calls `getHotelBySlug(hotelSlug)`. The page (`[hotelSlug]/page.tsx`) calls `getHotelWithExperiences(hotelSlug)`. If either returns null, the app calls `notFound()` and shows the custom "Hotel Not Found" page.
- **Observed behaviour:** `getHotelBySlug` succeeds (simple `SELECT * FROM hotel_configs WHERE slug = ? AND is_active = true`). `getHotelWithExperiences` fails because its Supabase/PostgREST queries error out. The code is considered correct; the database is out of sync.

## Problem 1: Foreign key constraint names

The code uses **relationship hints** in Supabase/PostgREST select strings. These hints must match the **actual constraint names** in the database. If they don’t, PostgREST returns an error and the query fails.

### What the code uses (in `apps/widget/src/lib/hotels.ts` and various API routes)

| Hint used in code        | Table / relationship |
|-------------------------|------------------------|
| `hotel_configs_partner_fk` | `hotel_configs` → `partners` |
| `distributions_experience_fk` | `distributions` → `experiences` |
| `experiences_partner_fk` | `experiences` → `partners` (supplier) |

### What the database had (at time of investigation)

Constraint names in `information_schema` were:

| Actual constraint name                 | Table        | Column           | References   |
|---------------------------------------|--------------|------------------|-------------|
| `hotel_configs_partner_id_fkey`        | hotel_configs | partner_id       | partners(id) |
| `distributions_experience_id_fkey`     | distributions | experience_id    | experiences(id) |
| `experiences_partner_id_fkey`         | experiences   | partner_id       | partners(id) |

So the code expects names ending in `_fk` (e.g. `hotel_configs_partner_fk`), while the database had the default Postgres names ending in `_fkey` (e.g. `hotel_configs_partner_id_fkey`).

### Fix for Problem 1

Bring the database in line with the code by **renaming** the constraints to the names the code expects:

- `hotel_configs_partner_id_fkey` → `hotel_configs_partner_fk`
- `distributions_experience_id_fkey` → `distributions_experience_fk`
- `experiences_partner_id_fkey` → `experiences_partner_fk`

Example (run in your Supabase SQL editor or via a migration):

```sql
ALTER TABLE hotel_configs  RENAME CONSTRAINT hotel_configs_partner_id_fkey  TO hotel_configs_partner_fk;
ALTER TABLE distributions RENAME CONSTRAINT distributions_experience_id_fkey TO distributions_experience_fk;
ALTER TABLE experiences   RENAME CONSTRAINT experiences_partner_id_fkey    TO experiences_partner_fk;
```

If your schema uses different source constraint names, query `information_schema.table_constraints` and `constraint_column_usage` for the exact names, then rename them to the three names above.

---

## Problem 2: Missing columns on `partners`

The code selects `stripe_account_id` and `stripe_onboarding_complete` from the `partners` table (e.g. in `getHotelWithExperiences` when loading supplier info for experiences). In the database we inspected, `partners` had no such columns, so the query failed with:

- `column partners_2.stripe_account_id does not exist`
- (and similarly for `stripe_onboarding_complete`)

### Fix for Problem 2

Add the columns the code expects:

- **`stripe_account_id`** — type as in your codebase (e.g. `text` or `uuid`), nullable.
- **`stripe_onboarding_complete`** — type `boolean`, nullable is typical.

Example (run in Supabase SQL editor or via a migration):

```sql
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean;
```

Adjust types/lengths to match your application’s types (e.g. in `apps/widget/src/lib/supabase/types.ts` or shared types).

---

## Summary checklist

To get the widget hotel pages working without 404:

1. **Rename FK constraints** to the names the code uses:  
   `hotel_configs_partner_fk`, `distributions_experience_fk`, `experiences_partner_fk`.
2. **Add on `partners`:**  
   `stripe_account_id`, `stripe_onboarding_complete`.

After applying these changes to the same Supabase project the widget uses (e.g. staging/local), restart or refresh the widget and open `http://localhost:3000/test-hotel` again. No code changes are required.

## References

- Session log: `docs/sessions/2026-03-20_hotel-widget-404.md`
- Data layer: `apps/widget/src/lib/hotels.ts`
- Hotel layout: `apps/widget/src/app/[hotelSlug]/layout.tsx`
- Hotel page: `apps/widget/src/app/[hotelSlug]/page.tsx`
