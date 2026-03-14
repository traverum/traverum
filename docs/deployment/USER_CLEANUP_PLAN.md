# User database cleanup plan

**Goal:** Remove unused users (e.g. Alessio’s test accounts) while keeping Traverum team and specified business accounts. **Partners are not deleted** — only auth users and their `public.users` / `user_partners` rows.

**Do not run any destructive steps until you have reviewed the dry-run results.**

---

## Deletion manifest (run this first)

Run the script below in **Supabase → SQL Editor**. It returns several result sets. Together they are the full list of **what would be deleted** and **what would be updated** (nothing is deleted or updated by this script).

**Result 1 — Accounts that would be DELETED**  
Every auth account + its `public.users` row. These are the users that do *not* match the keep rules.

**Result 2 — `user_partners` rows that would be DELETED**  
CASCADE when the user is removed: each row links a deleted user to a partner (partner is kept).

**Result 3 — `admin_audit_log` rows that would be UPDATED**  
Rows where `user_id` would be set to `NULL` so the user can be deleted (audit log row stays, reference cleared).

**Result 4 — `reservations` rows that would be UPDATED**  
Rows where `booked_by_user_id` would be set to `NULL` (reservation stays, “booked by” reference cleared).

```sql
-- ========== DELETION MANIFEST (read-only) ==========
-- Run in Supabase SQL Editor. No data is modified.

WITH keep_partner_ids AS (
  SELECT p.id
  FROM public.partners p
  LEFT JOIN public.hotel_configs hc ON hc.partner_id = p.id
  WHERE (hc.slug IN ('immpbiliare-fortina', 'novagragreenhome')
     OR LOWER(TRIM(p.name)) LIKE '%immpbiliare%fortina%'
     OR LOWER(TRIM(p.name)) LIKE '%nova%gra%green%home%')
),
users_to_keep AS (
  SELECT u.id
  FROM public.users u
  WHERE u.email LIKE '%@traverum.com'
     OR u.email IN ('eliassalmi02@gmail.com', 'info@cantinafontechiara')
  UNION
  SELECT up.user_id
  FROM public.user_partners up
  JOIN keep_partner_ids k ON k.id = up.partner_id
),
users_to_delete AS (
  SELECT u.id AS public_user_id, u.auth_id, u.email, u.created_at
  FROM public.users u
  LEFT JOIN users_to_keep k ON k.id = u.id
  WHERE k.id IS NULL
)

-- (1) Accounts that would be DELETED (auth.users + public.users)
SELECT
  'DELETE' AS action,
  'auth.users + public.users' AS what,
  d.public_user_id,
  d.auth_id,
  d.email,
  d.created_at
FROM users_to_delete d
ORDER BY d.email;

-- (2) user_partners rows that would be DELETED (CASCADE)
SELECT
  'DELETE' AS action,
  'user_partners' AS what,
  up.id AS user_partners_id,
  d.email AS user_email,
  p.name AS partner_name,
  up.role,
  up.hotel_config_id
FROM users_to_delete d
JOIN public.user_partners up ON up.user_id = d.public_user_id
JOIN public.partners p ON p.id = up.partner_id
ORDER BY d.email, p.name;

-- (3) admin_audit_log rows that would be UPDATED (user_id → NULL)
SELECT
  'UPDATE' AS action,
  'admin_audit_log.user_id → NULL' AS what,
  a.id AS audit_log_id,
  d.email AS user_email,
  a.action,
  a.target_type,
  a.target_id,
  a.created_at
FROM users_to_delete d
JOIN public.admin_audit_log a ON a.user_id = d.public_user_id
ORDER BY d.email, a.created_at;

-- (4) reservations rows that would be UPDATED (booked_by_user_id → NULL)
SELECT
  'UPDATE' AS action,
  'reservations.booked_by_user_id → NULL' AS what,
  r.id AS reservation_id,
  d.email AS user_email,
  r.status,
  r.created_at
FROM users_to_delete d
JOIN public.reservations r ON r.booked_by_user_id = d.public_user_id
ORDER BY d.email, r.created_at;
```

If a result set is empty, nothing in that category would be touched. **Partners, hotel_configs, experiences, and reservation rows themselves are never deleted** — only the user accounts and the links/columns above.

---

## 1. Who to keep (allow list)

Keep **all** users that match any of the following:

| Rule | Example / note |
|------|----------------|
| Email domain `@traverum.com` | Any Traverum team account |
| Email exactly `eliassalmi02@gmail.com` | Your account |
| Email exactly `info@cantinafontechiara` | Cantina Fontechiara (if the real email is `info@cantinafontechiara.it` or similar, add that too) |
| User is linked (via `user_partners`) to a partner whose **hotel_config slug** or **partner name** matches | `immpbiliare-fortina`, `novagragreenhome` |

So: **keep** = `email LIKE '%@traverum.com'` OR `email IN ('eliassalmi02@gmail.com', 'info@cantinafontechiara', ...)` OR user has at least one `user_partners` row for a partner that we identify from slugs/names below.

**Resolving “immpbiliare-fortina” and “novagragreenhome”:**  
These are treated as hotel/property identifiers. In the DB they may appear as:
- `hotel_configs.slug` (e.g. `immpbiliare-fortina`, `novagragreenhome`)
- or `partners.name` (e.g. “Immobiliare Fortina”, “Nova Gra Green Home”)

The plan uses **slug** first; if nothing matches, use **partner name** (case-insensitive, partial match).

---

## 2. Who to delete

**Delete** every user who is **not** on the allow list above.  
Deleting a user means removing them from **Supabase Auth** (`auth.users`). That will CASCADE to:
- `public.users` (row with matching `auth_id`)
- `public.user_partners` (rows for that `public.users.id`)

**We do not delete or change:** `partners`, `hotel_configs`, `experiences`, `reservations`, or any other data — only the user’s auth account and the two tables above.

---

## 3. Blocking references (must handle before delete)

Two tables reference `public.users.id` **without** ON DELETE CASCADE, so they can block deletion:

| Table | Column | Action if user has rows |
|-------|--------|--------------------------|
| `admin_audit_log` | `user_id` | Set `user_id = NULL` for those rows before deleting the user (or delete will fail). |
| `reservations` | `booked_by_user_id` | Set `booked_by_user_id = NULL` for those rows before deleting the user (or delete will fail). |

For users we are about to delete, we will clear these references first (see Step 6).

---

## 4. Step-by-step plan (no deletes until you confirm)

### Step 1 — Resolve “keep” partners (slugs / names)

Run in **Supabase SQL Editor** to get partner IDs we care about (adjust slug/name patterns if your DB differs):

```sql
-- Partners to keep: by hotel_config slug or partner name
SELECT p.id AS partner_id, p.name AS partner_name, hc.slug AS hotel_slug
FROM public.partners p
LEFT JOIN public.hotel_configs hc ON hc.partner_id = p.id
WHERE (hc.slug IN ('immpbiliare-fortina', 'novagragreenhome')
   OR LOWER(TRIM(p.name)) LIKE '%immpbiliare%fortina%'
   OR LOWER(TRIM(p.name)) LIKE '%nova%gra%green%home%'
   OR LOWER(TRIM(p.name)) = 'immpbiliare-fortina'
   OR LOWER(TRIM(p.name)) = 'novagragreenhome');
```

Note the `partner_id` values. We’ll use them in Step 2 to mark “keep” users.

---

### Step 2 — List all users and classify KEEP vs DELETE (dry run)

Replace `'{partner_id_1}', '{partner_id_2}'` with the UUIDs from Step 1 (or use a CTE). This only **selects**; it does not delete.

```sql
WITH keep_partner_ids AS (
  SELECT p.id
  FROM public.partners p
  LEFT JOIN public.hotel_configs hc ON hc.partner_id = p.id
  WHERE (hc.slug IN ('immpbiliare-fortina', 'novagragreenhome')
     OR LOWER(TRIM(p.name)) LIKE '%immpbiliare%fortina%'
     OR LOWER(TRIM(p.name)) LIKE '%nova%gra%green%home%')
),
users_to_keep AS (
  SELECT u.id
  FROM public.users u
  WHERE u.email LIKE '%@traverum.com'
     OR u.email IN (
       'eliassalmi02@gmail.com',
       'info@cantinafontechiara'
       -- add info@cantinafontechiara.it etc. if needed
     )
  UNION
  SELECT up.user_id
  FROM public.user_partners up
  JOIN keep_partner_ids k ON k.id = up.partner_id
)
SELECT
  u.id AS public_user_id,
  u.auth_id,
  u.email,
  u.partner_id,
  CASE WHEN k.id IS NOT NULL THEN 'KEEP' ELSE 'DELETE' END AS action,
  (SELECT count(*) FROM admin_audit_log a WHERE a.user_id = u.id) AS audit_log_rows,
  (SELECT count(*) FROM reservations r WHERE r.booked_by_user_id = u.id) AS reservations_booked
FROM public.users u
LEFT JOIN users_to_keep k ON k.id = u.id
ORDER BY action, u.email;
```

**Review the result:**  
- Every row with `action = 'KEEP'` must remain.  
- Every row with `action = 'DELETE'` is a candidate for removal.  
- If any `DELETE` row has `audit_log_rows > 0` or `reservations_booked > 0`, we will clear those in Step 6 before deleting.

---

### Step 3 — Export the list of users to delete (optional but recommended)

Same as Step 2, but only the delete candidates and only the identifiers you need for the next steps:

```sql
-- Same CTEs as in Step 2; then:
SELECT u.id AS public_user_id, u.auth_id, u.email
FROM public.users u
LEFT JOIN users_to_keep k ON k.id = u.id
WHERE k.id IS NULL
ORDER BY u.email;
```

Save this list (e.g. CSV or copy) so you can double-check against Supabase Auth and use `auth_id` for the actual delete.

---

### Step 4 — Confirm no partners are removed

Partners are **not** deleted in this plan. To confirm that your “keep” partners still exist and are untouched:

```sql
SELECT id, name, email, partner_type FROM public.partners ORDER BY name;
```

No DELETE or UPDATE on `partners` is part of this cleanup.

---

### Step 5 — (Optional) Backup auth users list

In **Supabase Dashboard → Authentication → Users**, you can export or screenshot the current user list before any delete. Alternatively, you can dump the list from the DB (auth schema is readable by the project):

```sql
SELECT id, email, created_at
FROM auth.users
ORDER BY email;
```

Keep this for rollback reference (re-inviting someone if needed).

---

### Step 6 — Clear blocking references for DELETE candidates only

Only for users that are in the “DELETE” list from Step 2, set their references to NULL so the CASCADE from `public.users` won’t be blocked. **Run only after you are satisfied with the dry run.**

```sql
-- Replace the IN list with the public.user ids you want to delete (from Step 3).
-- Or use the same users_to_keep logic to compute "users to delete" and then update.

WITH users_to_delete AS (
  -- Paste the same logic as Step 2: users NOT in users_to_keep
  SELECT u.id
  FROM public.users u
  LEFT JOIN (
    SELECT u2.id FROM public.users u2
    WHERE u2.email LIKE '%@traverum.com'
       OR u2.email IN ('eliassalmi02@gmail.com', 'info@cantinafontechiara')
    UNION
    SELECT up.user_id FROM public.user_partners up
    JOIN (SELECT p.id FROM public.partners p
          LEFT JOIN public.hotel_configs hc ON hc.partner_id = p.id
          WHERE hc.slug IN ('immpbiliare-fortina', 'novagragreenhome')
             OR LOWER(TRIM(p.name)) LIKE '%immpbiliare%fortina%'
             OR LOWER(TRIM(p.name)) LIKE '%nova%gra%green%home%') k ON k.id = up.partner_id
  ) k ON k.id = u.id
  WHERE k.id IS NULL
)
UPDATE admin_audit_log
SET user_id = NULL
WHERE user_id IN (SELECT id FROM users_to_delete);

UPDATE reservations
SET booked_by_user_id = NULL
WHERE booked_by_user_id IN (SELECT id FROM users_to_delete);
```

Verify row counts (e.g. “X rows updated” in the editor) and that only delete-candidate users were affected.

---

### Step 7 — Delete users from Supabase Auth (execution)

Deletion is done in **Authentication**, not by deleting from `public.users` first (so CASCADE behaves correctly).

**Option A — Supabase Dashboard**  
1. Go to **Authentication → Users**.  
2. For each user you want to remove (cross-check with Step 3 list), open the user and delete.  
3. Supabase will remove the row from `auth.users`; the FK from `public.users.auth_id` has ON DELETE CASCADE, so the corresponding `public.users` row and its `user_partners` rows will be removed automatically.

**Option B — Supabase API / script**  
Use the Admin API `DELETE /auth/v1/admin/users/{user_id}` with the **auth_id** (UUID from `auth.users.id`), not `public.users.id`. You can script this with the `auth_id` list from Step 3.

**Important:**  
- Use the **auth_id** (from `auth.users`) when deleting in Auth.  
- Do **not** delete from `public.users` manually; let CASCADE from `auth.users` do it.

---

### Step 8 — Verify after cleanup

```sql
-- Should only see kept users
SELECT id, email, partner_id FROM public.users ORDER BY email;

-- Counts (optional)
SELECT count(*) AS total_users FROM public.users;
```

And in **Authentication → Users**, confirm the list matches the users you intended to keep (Traverum, eliassalmi02@gmail.com, info@cantinafontechiara, and users for immpbiliare-fortina / novagragreenhome).

---

## 5. Summary checklist

- [ ] Step 1: Resolve partner IDs for immpbiliare-fortina and novagragreenhome.
- [ ] Step 2: Run dry-run query; review KEEP vs DELETE; confirm allow-list emails (e.g. cantinafontechiara spelling).
- [ ] Step 3: Export list of users to delete; confirm with stakeholder.
- [ ] Step 4: Confirm partners table is untouched.
- [ ] Step 5: (Optional) Backup auth user list.
- [ ] Step 6: Clear `admin_audit_log.user_id` and `reservations.booked_by_user_id` for delete candidates only.
- [ ] Step 7: Delete users from Authentication (Dashboard or API) using **auth_id**.
- [ ] Step 8: Verify `public.users` and Auth user list.

**Partners:** No DELETE or UPDATE on `partners` in this plan. Only auth users and their `public.users` / `user_partners` rows are removed.
