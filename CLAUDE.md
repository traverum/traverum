# Traverum

B2B2C experience booking platform. Hotels embed a widget → guests book local experiences → suppliers deliver. Traverum is merchant of record via Stripe Connect. Revenue split: 80% supplier / 12% hotel / 8% platform.

## Monorepo

| Path | Stack | Purpose |
|------|-------|---------|
| `apps/widget` | Next.js 14 (App Router) | Guest booking widget + **all API routes** + cron jobs + email |
| `apps/dashboard` | Vite + React SPA | Supplier & hotel management dashboard |
| `apps/admin` | Vite + React SPA | Internal platform admin (superadmin only) |
| `packages/shared` | TypeScript | Shared types, constants (`@traverum/shared`) |

Two booking channels, one engine: **hotel widget** (white-label, 80/12/8 split) and **Veyond direct** (Veyond-branded, 92/8 split). A reservation with `hotel_id = null` is a direct Veyond booking.

## Key rules — always in effect

1. **Money in cents.** Integer `_cents` columns, `Math.round()` for splits, `formatPrice()` for display (`45 €`).
2. **European dates.** `dd.MM.yyyy`, 24-hour times, Monday-start weeks. Never American formats. Use `parseLocalDate()` for calendar dates — never `toISOString().split('T')[0]` or `new Date("yyyy-mm-dd")`.
3. **No emojis in UI.** Lucide icons only.
4. **Dashboard/Admin never mutate Supabase directly.** All mutations go through widget API routes (`apps/widget/src/app/api/`).
5. **Always sanitize guest input.** `sanitizeGuestText()`, `sanitizeGuestEmail()`, `escapeHtml()` in emails.
6. **Stripe Payment Links, not Checkout Sessions.** Stable URLs for email-based payment flow.
7. **Status transitions are one-way.** Never transition reservations or bookings backwards.

## Before editing any feature

1. Check for a matching purpose doc in `docs/purpose/` — read it first.
2. Check `docs/forbidden.md` — don't propose banned patterns.
3. Check `docs/decisions.md` — don't re-propose rejected approaches.
4. If your change affects booking flow, commission logic, or channel behavior — stop and ask.

## Documentation index

- **Full docs index:** `docs/CONTEXT.md`
- **Forbidden patterns:** `docs/forbidden.md`
- **Architecture decisions:** `docs/decisions.md`
- **Purpose docs (what & why):** `docs/purpose/`
- **Technical specs (how):** `docs/technical/`
- **Design specs:** `docs/design/`
- **Deployment guides:** `docs/deployment/`
- **Session logs:** `docs/sessions/` (daily dev notes — read for context recovery)

## Tech stack quick ref

- **UI:** shadcn/ui + Tailwind + Lucide (dashboard/admin), MUI + Tailwind (widget)
- **State:** React Context + React Query (no Zustand)
- **DB:** Supabase (Postgres + RLS + PostGIS)
- **Payments:** Stripe Connect (Payment Links)
- **Email:** Resend (`Traverum <bookings@veyond.eu>`)
- **Dates:** date-fns (no dayjs/moment)
- **Deploy:** Three separate Vercel projects — never mix them
