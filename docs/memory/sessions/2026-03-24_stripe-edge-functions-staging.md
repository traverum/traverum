# 2026-03-24_stripe-edge-functions-staging

## Goal

Fix supplier Stripe Connect (“Failed to send a request to the Edge Function”) by deploying Edge Functions to **staging only** — no production (`vwbxkkzzpacqzqvqxqvf`) changes.

## Blast Radius

Staging Supabase only. MCP: `user-supabase-staging`.

## Done

- Confirmed dashboard calls `supabase.functions.invoke('create-connect-account', …)` (no functions existed on staging before).
- Deployed **`create-connect-account`** and **`stripe-webhooks`** to staging via MCP `deploy_edge_function` with `verify_jwt: false` (matches `apps/dashboard/supabase/config.toml` — custom auth / webhook verification in function body).

## Decisions

- Production database/project was explicitly out of scope for this work.
- Use Stripe **test** keys for staging secrets when configuring.

## Open Items

- [ ] In Supabase **staging**: set Edge Function secret **`STRIPE_SECRET_KEY`** (test `sk_test_...`) so `create-connect-account` can run.
- [ ] Optional: if using **`stripe-webhooks`** on staging, add **`STRIPE_WEBHOOK_SECRET`** and register that function URL in Stripe (Connect events) with the matching signing secret.
- [ ] Verify local/staging dashboard **`VITE_SUPABASE_URL`** points at the **staging** project so `invoke` hits the deployed functions.

## Notes

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are typically auto-available to Edge Functions; `STRIPE_SECRET_KEY` must be set manually.
