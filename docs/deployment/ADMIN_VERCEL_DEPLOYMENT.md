# Admin app — Vercel deployment

Deploy the Traverum admin app (`apps/admin`) to Vercel. This app is for platform administrators only (superadmins).

## Critical: use the correct project

- **Root Directory:** `apps/admin` (not `apps/dashboard` or `apps/widget`).
- **Framework:** Vite (not Next.js). The admin app has no API routes.
- See [VERCEL_DEPLOYMENTS.md](./VERCEL_DEPLOYMENTS.md) for the three-app overview.

## Prerequisites

- Vercel account
- Same Supabase project as dashboard (admin uses anon key + RLS; superadmin users have `users.is_superadmin = true`)

## Step 1: Create / configure Vercel project

1. Create a **new** Vercel project (or use an existing one reserved for admin only).
2. **Settings → General:**
   - **Root Directory:** `apps/admin`
   - **Framework Preset:** Vite (or Other)
3. The repo's `apps/admin/vercel.json` provides:
   - `installCommand`: `cd ../.. && pnpm install --filter @traverum/admin...` (filtered — installs only admin deps, not the full monorepo)
   - `buildCommand`: `npx vite build` (runs directly from `apps/admin` — avoids pnpm workspace resolution overhead)
   - `outputDirectory`: `dist`
   - SPA rewrites: `(.*) → /index.html`

## Step 2: Environment variables

In Vercel → **Settings → Environment Variables**, add these for **Production** (and Preview/Development if you use them):

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (same as dashboard) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key (same as dashboard) |
| `VITE_DASHBOARD_URL` | Yes | Base URL for "Open in dashboard" links on Partners page (e.g. `https://dashboard.traverum.com`) |
| `VITE_WIDGET_API_URL` | Yes | Widget API base URL for Payouts page (e.g. `https://book.veyond.eu`) |

All are embedded at **build time** (Vite). Redeploy after adding or changing any variable.

## Step 3: Deploy

1. Connect the repo and set Root Directory to `apps/admin`.
2. Add the environment variables above.
3. Deploy. Build runs `npx vite build` directly and outputs to `dist`.

## Step 4: Domain

In Vercel → **Settings → Domains**, add your admin domain (e.g. `admin.traverum.com`) and configure DNS as instructed.

## Verification

- Login page loads; only users with `users.is_superadmin = true` can access the rest of the app.
- **Overview** shows platform stats.
- **Payouts** lists hotel payouts and can call the widget API (same origin or CORS as needed).
- **Partners** lists partners and "Open in dashboard" links to `VITE_DASHBOARD_URL`.

## Troubleshooting

- **Out of Memory (OOM) / SIGKILL during build:** The admin app uses a filtered install (`pnpm install --filter @traverum/admin...`) and runs `npx vite build` directly to avoid pnpm workspace resolution overhead. Do NOT change the `buildCommand` to `pnpm --filter @traverum/admin build` — that forces pnpm to parse the entire monorepo graph and can OOM on Vercel Hobby.
- **Build fails / wrong app:** Confirm Root Directory is `apps/admin` and build log shows `vite build`.
- **Supabase errors:** Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (same values as dashboard).
- **"Open in dashboard" wrong URL:** Set `VITE_DASHBOARD_URL` and redeploy.
- **Payout actions fail:** Ensure `VITE_WIDGET_API_URL` is correct and widget API allows admin JWT (superadmin) for `/api/admin/hotel-payouts`.
