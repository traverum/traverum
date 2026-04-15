---
type: concept
created: 2026-04-15
updated: 2026-04-15
sources:
  - DEPLOYMENT.md
tags: [deployment, vercel, operations, migrations, crons, environment]
---

# Deployment

Runbook-level deployment rules for Traverum's three-app architecture. Use this page before any release, env change, cron setup, or schema rollout.

## Project boundaries (must not mix)

| Vercel project | App | Framework | Domain |
|---|---|---|---|
| Dashboard | `apps/dashboard` | Vite | `dashboard.traverum.com` |
| Widget | `apps/widget` | Next.js 14 | `book.veyond.eu` |
| Admin | `apps/admin` | Vite | `admin.traverum.com` |

Widget is the only Next.js app. If Dashboard/Admin shows Next.js build behavior, the wrong root/project is configured.

## Environment and build rules

- Keep environment variables scoped per app; do not share assumptions across projects.
- Dashboard/Admin rely on `VITE_*` vars that are embedded at build time; env changes require redeploy.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed client-side.
- Admin build command stays `npx vite build` on Vercel Hobby to avoid OOM from workspace resolution.

## Cron operations

- Cron endpoints live in Widget (`apps/widget/vercel.json`).
- Daily job (`auto-complete`) works on Vercel Hobby; hourly jobs require Pro or an external scheduler.
- External schedulers must call `https://book.veyond.eu/api/cron/{job}` with `Authorization: Bearer <CRON_SECRET>`.

## Migration and type-safety rollout

1. Apply and verify SQL in staging first.
2. Save migration under `apps/dashboard/supabase/migrations/`.
3. Regenerate Supabase types and typecheck Widget before merge/release.
4. Apply identical SQL to production only after staging validation.

Generated types may miss tables; where queries produce `never`, add explicit type assertions to protect `next build`.

## Stripe webhooks and rollback

- Stripe webhook endpoint: `https://book.veyond.eu/api/webhooks/stripe`.
- Required events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`.
- Rollback uses Vercel deployment promotion to the previous known-good release.

## Related pages

- [[tech-decisions]] — Broader architecture and anti-pattern constraints.
- [[booking]] — Booking lifecycle touched by cron jobs.
- [[payment-modes]] — Stripe behavior that deployment wiring must preserve.
- [[source-deployment]] — Source-level summary for this operational reference.
