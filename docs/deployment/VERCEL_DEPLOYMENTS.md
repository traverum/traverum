# Vercel deployments — overview

Traverum has **three separate Vercel projects**. One project per app. Never use the same Vercel project for more than one app.

## Quick reference

| App | Vercel Root Directory | pnpm filter | Framework | Domain |
|-----|------------------------|-------------|-----------|--------|
| **Dashboard** | `apps/dashboard` | `@traverum/dashboard` | Vite (React) | dashboard.traverum.com |
| **Widget** | `apps/widget` | `@traverum/widget` | Next.js 14 | book.veyond.eu |
| **Admin** | `apps/admin` | `@traverum/admin` | Vite (React) | admin.traverum.com |

When creating or configuring a Vercel project, set **Root Directory** to the exact path above. Each app has its own `vercel.json` in that directory with the correct install/build commands.

## Per-app guides

- **[Dashboard](DASHBOARD_VERCEL_DEPLOYMENT.md)** — Supplier & hotel dashboard (Vite SPA).
- **[Widget](vercel-widget-deployment.md)** — Guest booking, API routes, cron jobs (Next.js).
- **[Admin](ADMIN_VERCEL_DEPLOYMENT.md)** — Platform admin: payouts, partners, superadmin (Vite SPA).

## Avoiding mix-ups

1. **One Vercel project = one app.** Do not point the Dashboard Vercel project at `apps/widget` or vice versa.
2. **Check Root Directory** in Vercel → Settings → General. It must match the app you intend to deploy.
3. **Build command** — Dashboard and Widget use `cd ../.. && pnpm --filter <name> build`. Admin uses `npx vite build` directly (avoids pnpm workspace overhead that can OOM on Vercel Hobby).
4. **Dashboard and Admin** are both Vite; if you see Next.js in the build log for either, the wrong app is being built.
5. **Widget** is the only app with API routes and crons; it uses `framework: "nextjs"` in its `vercel.json`.

## Local build commands

```bash
pnpm --filter @traverum/dashboard build   # Dashboard
pnpm --filter @traverum/widget build      # Widget
pnpm --filter @traverum/admin build       # Admin
```
