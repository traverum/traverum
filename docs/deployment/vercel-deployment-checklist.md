# Vercel deployment checklist

Traverum has **three Vercel projects**. Use one project per app and set **Root Directory** correctly so the right app is deployed. See [VERCEL_DEPLOYMENTS.md](./VERCEL_DEPLOYMENTS.md) for the overview.

## Which app are you deploying?

| App | Root Directory | Guide | Env / checklist |
|-----|----------------|-------|------------------|
| **Dashboard** | `apps/dashboard` | [DASHBOARD_VERCEL_DEPLOYMENT.md](./DASHBOARD_VERCEL_DEPLOYMENT.md) | VITE_* (Supabase, optional Google Maps, etc.) |
| **Widget** | `apps/widget` | [vercel-widget-deployment.md](./vercel-widget-deployment.md) | NEXT_PUBLIC_*, Stripe, Resend, CRON_SECRET, etc. |
| **Admin** | `apps/admin` | [ADMIN_VERCEL_DEPLOYMENT.md](./ADMIN_VERCEL_DEPLOYMENT.md) | VITE_SUPABASE_*, VITE_DASHBOARD_URL, VITE_WIDGET_API_URL |

## Pre-deployment (all apps)

- [ ] Vercel project is created and **Root Directory** is set to the correct app path (`apps/dashboard`, `apps/widget`, or `apps/admin`).
- [ ] Repository is connected; you are not reusing one Vercel project for a different app.
- [ ] Environment variables for that app are added (see the app-specific guide above).

## Widget-only checklist (when deploying widget)

- [ ] Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`
- [ ] Optional: `TOKEN_SECRET`, `CRON_SECRET`, `FROM_EMAIL`
- [ ] Stripe webhook URL: `https://book.veyond.eu/api/webhooks/stripe` (or your widget domain)
- [ ] Cron jobs: see [vercel-widget-deployment.md](./vercel-widget-deployment.md)

## Dashboard-only checklist (when deploying dashboard)

- [ ] Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Optional: `VITE_GOOGLE_MAPS_API_KEY`, `VITE_RECAPTCHA_SITE_KEY`, `VITE_WIDGET_URL`
- [ ] Redeploy after any env change (Vite embeds at build time)

## Admin-only checklist (when deploying admin)

- [ ] Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_DASHBOARD_URL`, `VITE_WIDGET_API_URL`
- [ ] Redeploy after any env change (Vite embeds at build time)

## Verification

- **Dashboard:** Login, partner switcher, no Next.js in build log.
- **Widget:** Hotel/experience pages, embed.js, API routes, crons; build log shows Next.js.
- **Admin:** Login (superadmin only), Overview, Payouts, Partners; build log shows Vite, not Next.js.

## Rollback

- Vercel dashboard → Deployments → previous deployment → Promote to Production.

## Quick build commands (local)

```bash
pnpm --filter @traverum/dashboard build
pnpm --filter @traverum/widget build
pnpm --filter @traverum/admin build
```
