# Deployment reference

Three Vercel projects, one per app. High-level intent is in `.cursor/rules/project.mdc` and `.cursor/rules/technical.mdc`; this file is the operational reference (env, crons, migrations, type safety).

## Vercel projects (do not mix)

| Vercel project | App | Framework | Root Directory | Package filter | Domain |
|----------------|-----|-----------|----------------|------------------|--------|
| Dashboard | `apps/dashboard` | Vite | `apps/dashboard` | `@traverum/dashboard` | dashboard.traverum.com |
| Widget | `apps/widget` | Next.js 14 | `apps/widget` | `@traverum/widget` | book.veyond.eu |
| Admin | `apps/admin` | Vite | `apps/admin` | `@traverum/admin` | admin.traverum.com |

Dashboard and Admin are Vite SPAs. Widget is the only Next.js app (API routes, crons, server code). A Next.js build error on Dashboard or Admin means the wrong project or root was used.

## Environment variables

### Widget (`apps/widget` — Next.js)

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only, never exposed to client |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://book.veyond.eu` |
| `STRIPE_SECRET_KEY` | Yes | `sk_live_...` in production |
| `STRIPE_WEBHOOK_SECRET` | Yes | From Stripe Dashboard > Webhooks |
| `RESEND_API_KEY` | Yes | |
| `RECAPTCHA_SECRET_KEY` | Yes (prod) | Verifies dashboard signup captcha |
| `CRON_SECRET` | Optional | Secures cron endpoints; Vercel sends it automatically |
| `TOKEN_SECRET` | Optional | Falls back to `SUPABASE_SERVICE_ROLE_KEY` |
| `FROM_EMAIL` | Optional | Default: `Traverum <bookings@veyond.eu>` |

### Dashboard (`apps/dashboard` — Vite)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_SUPABASE_URL` | Yes | |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | This is the anon key — name is `PUBLISHABLE_KEY`, not `ANON_KEY` |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Location autocomplete |
| `VITE_RECAPTCHA_SITE_KEY` | Yes (prod) | Signup blocked without it |
| `VITE_WIDGET_URL` | Optional | Default: `https://book.veyond.eu` |

### Admin (`apps/admin` — Vite)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_SUPABASE_URL` | Yes | Same as dashboard |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Same as dashboard |
| `VITE_DASHBOARD_URL` | Yes | `https://dashboard.traverum.com` |
| `VITE_WIDGET_API_URL` | Yes | `https://book.veyond.eu` |

**Vite caveat:** All `VITE_*` vars are embedded at build time. You must redeploy after changing them.

## Admin build (OOM workaround)

The admin `vercel.json` uses `npx vite build` directly instead of `pnpm --filter @traverum/admin build`. This avoids pnpm workspace resolution overhead that causes OOM on Vercel Hobby. Do not change this.

## Cron jobs

Configured in `apps/widget/vercel.json`.

| Job | Schedule | Notes |
|-----|----------|-------|
| `/api/cron/auto-complete` | Daily 2 AM | Completes bookings 7+ days after experience |
| `/api/cron/completion-check` | Hourly | Sends completion check emails after experience ends |
| `/api/cron/expire-unpaid` | Hourly (needs Pro or external) | Expires unpaid reservations |
| `/api/cron/expire-pending` | Hourly (needs Pro or external) | Expires pending bookings |
| `/api/cron/expire-reservations` | Hourly (needs Pro or external) | Expires old reservations |

Vercel Hobby only supports daily crons. For hourly jobs, use an external service (e.g. [cron-job.org](https://cron-job.org), free) with POST to `https://book.veyond.eu/api/cron/{job}` and header `Authorization: Bearer <CRON_SECRET>`.

## Supabase CLI

Before running or suggesting any Supabase CLI command, read `docs/context7/supabase-cli-reference.md`. Do not rely on memory for CLI syntax.

## Supabase migrations

**Full workflow:** Read `.agents/skills/database-migrations/SKILL.md` before any schema change. It covers the complete staging-to-production process.

Migrations live in `apps/dashboard/supabase/migrations/`.

**Current method (MCP-based):**
1. Write migration SQL
2. Apply to staging via `user-supabase-staging` MCP `apply_migration`
3. Verify on staging
4. Save migration file to `apps/dashboard/supabase/migrations/YYYYMMDDHHMMSS_name.sql`
5. Regenerate types, typecheck widget
6. Commit to git
7. Apply identical SQL to production via production MCP `apply_migration`

**Alternative (Supabase CLI):**

```bash
cd apps/dashboard

# Link to production (once per machine)
pnpm exec supabase link --project-ref vwbxkkzzpacqzqvqxqvf

# Push unapplied migrations
pnpm exec supabase db push --linked
```

Verify at Supabase Dashboard > Database > Migrations.

### Experience tags (2026-03, data-only)

Migration file: `apps/dashboard/supabase/migrations/20260327120000_replace_categories_with_tags.sql`.

- **What it does:** Rewrites legacy category values inside `experiences.tags` (e.g. `food` → `food_wine`), then deduplicates arrays. **No new columns** — still `tags text[]`.
- **Types:** Regenerating Supabase types is optional for this migration (no schema change).
- **App deploy order (production):** Deploy **dashboard** first → apply this migration on production → deploy **widget**. Keeps supplier UI and guest browse aligned with DB slugs. See also `docs/memory/sessions/2026-03-27_experience-tags.md`.

| Environment | Project ref |
|-------------|-------------|
| Production | `vwbxkkzzpacqzqvqxqvf` |

## Stripe webhooks

Endpoint: `https://book.veyond.eu/api/webhooks/stripe`

Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`.

## TypeScript / Supabase generated types

Generated types may not include every table. Missing tables cause `never` on query `.data` and can **break `next build` on Vercel** — add explicit type assertions where needed.

```bash
# After schema changes, regenerate (replace project id)
npx supabase gen types typescript --project-id <id> > apps/widget/src/lib/supabase/types.ts

# Widget typecheck before push
pnpm --filter @traverum/widget typecheck
```

**Auth vs app user:** Supabase Auth `user.id` is not `users.id`. Resolve app user via `auth_id` before `user_partners` queries.

## Rollback

Vercel Dashboard > Deployments > previous deployment > Promote to Production.
