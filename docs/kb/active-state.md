---
last_updated: 2026-04-13
migrated_from: docs/memory/active-state.md
---

# Active State

Operational state — what's pending, blocked, or needs attention. Kept lean (<50 lines).

## Known Issues

- Staging DB may drift from production schema (`sort_order` fallback in `hotels.ts`)
- Placeholder highlights/included/not-included shown for all experiences (no DB columns yet)
- Root `node_modules/lucide-react` still resolves to v0.462.0 — mitigated by webpack alias
- **CRITICAL before production deploy:** `partners.payment_mode` defaults to `'pay_on_site'`. Existing Stripe-active partners need `UPDATE partners SET payment_mode = 'stripe' WHERE stripe_onboarding_complete = true`

## Open Items

- [ ] **Production migration Phase 2–5:** Merge PR #1 → apply 8 migrations → regenerate types → deploy Dashboard → Widget → Admin → verify
- [ ] **Check `payment_mode` default for existing partners** before applying pay_on_site schema to production
- [ ] **Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** is set on production Vercel (widget project)
- [ ] **DiVinea `sync-divinea` cron** — verify graceful exit when env vars not set on production
- [ ] **Invoice cron test:** Trigger `generate-invoices` manually on staging with test data
- [ ] **PDF invoices (optional):** `commission_invoices.pdf_url` column exists but unused
- [ ] **DiVinea go-live:** Apply migration → set Vercel env vars → link experience → run sync → verify
- [ ] Staging Stripe Connect: set `STRIPE_SECRET_KEY` (test) on staging Edge Function secrets
- [ ] Optional: `STRIPE_WEBHOOK_SECRET` + Stripe webhook URL for staging `stripe-webhooks`

## Latest Session

[2026-03-31_production-migration-phase1](sessions/2026-03-31_production-migration-phase1.md)
