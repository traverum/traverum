---
type: source
created: 2026-04-15
updated: 2026-04-15
sources:
  - DEPLOYMENT.md
tags: [source, deployment, vercel, supabase, stripe, operations]
---

# Source — Deployment reference

Operational deployment reference for Traverum's three-app setup on Vercel, including environment variables, cron strategy, migration workflow, and rollback guidance.

## Core takeaways

- Traverum runs on **three separate Vercel projects**: Dashboard (`apps/dashboard`), Widget (`apps/widget`), Admin (`apps/admin`). Mixing roots or framework assumptions causes broken builds.
- `apps/widget` is the only Next.js app and hosts API routes, cron endpoints, and Stripe webhooks.
- Environment variables differ by app and are strict; `SUPABASE_SERVICE_ROLE_KEY`, Stripe secrets, and captcha keys are mandatory for production-critical paths.
- Vite env vars (`VITE_*`) are build-time only, so changes require a redeploy.
- Admin build command is intentionally `npx vite build` to avoid Vercel Hobby OOM from workspace-resolution overhead.
- Hourly cron jobs need Vercel Pro or an external scheduler; external calls must include `Authorization: Bearer <CRON_SECRET>`.
- Supabase migration flow is staging-first, then production with identical SQL; migration files are stored under `apps/dashboard/supabase/migrations/`.
- Stripe webhook endpoint is centralized at Widget (`/api/webhooks/stripe`) for success/failure/refund events.
- Supabase generated-type gaps can break `next build`; explicit type assertions are sometimes required.
- Rollback path is Vercel deployment promotion (previous deployment -> promote).

## Entities and concepts surfaced

- [[tech-decisions]] — Existing technical constraints and anti-patterns that this source expands.
- [[deployment]] — Operational deployment model, runbook-level details, and release safety checks.
