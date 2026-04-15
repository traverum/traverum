---
type: concept
created: 2026-04-15
updated: 2026-04-15
sources:
  - tech-context.md
  - DEPLOYMENT.md
tags: [tech, stack, architecture, patterns, anti-patterns, supabase, stripe, monorepo]
---

# Tech Decisions

Technical stack, patterns, and anti-patterns. **Check before writing code.**

## Tech stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turborepo |
| Shared code | `@traverum/shared` package |
| Widget app | Next.js (`apps/widget`) — [[guest]] + [[receptionist]] + API layer |
| Dashboard app | Next.js (`apps/dashboard`) — [[supplier]] + [[hotel]] |
| Admin app | Vite + React (`apps/admin`) |
| Database | Supabase (PostgreSQL + PostGIS + Auth + Storage) |
| Payments | Stripe (Connect, Payment Links, Setup Intents) |
| Email | Resend (`bookings@veyond.eu`) via `baseTemplate()` |
| Hosting | Vercel (3 separate projects, one per app) |
| State management | React Context + React Query |
| Date library | date-fns |
| Icons | lucide-react |
| Images | Client-side compression via `browser-image-compression`, WebP, Supabase Storage |

## Architecture rules

### Widget is the API layer

All mutations go through `apps/widget/src/app/api/` routes. Dashboard and Admin use Supabase client for **reads only**. Business logic (commission, emails, Stripe) lives in API routes. Direct mutations bypass it.

### Three separate Vercel projects

One per app, each with its own Root Directory and build command. Never mix — dashboard build once pulled widget's Next.js config.

Widget is the only Next.js app (`apps/widget`). Dashboard/Admin are Vite apps and must not inherit Next.js build settings. See [[deployment]] for operational mapping.

### Channel is metadata, not architecture

`hotel_id` null = Veyond direct. Same code path, same status transitions, same emails. See [[channels]].

### AI agent interfaces

CLI, MCP, and OpenAPI all wrap the same functions. Never duplicate business logic across interfaces. Widget API routes remain source of truth. Read-only operations unauthenticated; write operations use API keys with rate limiting.

## Hard anti-patterns (the "Avoid" list)

- **Never store money as floats.** Integer cents with `_cents` suffix.
- **Never use `Math.floor()` for [[commission]] splits.** Use `Math.round()`. Remainder to platform.
- **Never derive calendar date with `toISOString().split('T')[0]`.** Returns UTC, shifts day in non-UTC zones.
- **Never use `new Date("yyyy-mm-dd")`.** Parsed as UTC midnight — wrong day west of UTC. Use `parseLocalDate()`.
- **Dashboard/Admin must never mutate Supabase directly.** Call widget API routes.
- **Never mix Vercel projects.** Three separate, one per app. Wrong Root Directory = broken prod.
- **Never deploy Admin with `pnpm --filter`.** Use `npx vite build` directly (OOM on Vercel Hobby).
- **Never skip `source_transaction` on Stripe transfers in test mode.**
- **Never use CSS classes in email templates.** Inline styles only.
- **Never use flexbox in email layout.** Stacked layout. See [[design-system]].
- **Never forget `escapeHtml()` for user content in emails.**
- **Never forget `style="color: white"` on email button text.** Gmail/Outlook override to blue.
- **Always sanitize guest input.** `sanitizeGuestText()`, `sanitizeGuestEmail()` from `@/lib/sanitize`.
- **Never assume generated Supabase types cover all tables.** Add explicit type assertions.
- **Never confuse auth UUID with app user ID.** `user.id` (Auth) ≠ `users.id` (app). Resolve via `auth_id` first.
- **Never add Zustand, Redux, or other state libraries.** React Context + React Query.
- **Never add dayjs or moment.** date-fns only.
- **Never overwrite `types.ts` with raw Supabase generated output.** Re-append convenience aliases after regeneration.

## Supabase patterns

### Generated types: convenience aliases mandatory

Both widget (`apps/widget/src/lib/supabase/types.ts`) and dashboard (`apps/dashboard/src/integrations/supabase/types.ts`) have convenience type aliases appended after `// Convenience types`: `Experience`, `Booking`, `Partner`, `HotelConfig`, `Media`, `Distribution`, `ExperienceSession`, `Reservation`, `User`, `HotelPayout`, plus status unions. Without them, `next build` fails (200+ type errors).

### Query `never` types: use type assertions

Some queries return `never` because generated types have empty `Relationships: []`. Runtime works. Fix: `as any` on `.from()` + explicit return type.

### Intersection types for extending Row types

`type X = Experience & { ... }` (intersection), not `interface X extends Experience { ... }`. Nullable fields in generated Row types break interface extends. Always use `&` intersection.

## Stripe patterns

### Pick surface per flow

Payment Links (async "Pay now" emails), Checkout Sessions (hosted redirect), Payment Element / Setup Intents (in-widget). No blanket ban on Checkout Sessions.

### Setup Intent + Payment Element for card guarantees

Deferred intent pattern: `PaymentElement` with `mode: 'setup'`, `currency: 'eur'`. No SetupIntent until form submission. Off-session charges use `stripe.paymentIntents.create` with `off_session: true`.

### `payment_mode` denormalized on bookings

Copied from `partners.payment_mode` at creation time. Lets crons filter without joining.

### Commission pre-calculated at booking creation

`supplier_amount_cents` stored on booking record. Settlement just transfers the stored amount — no recalculation.

## Lucide version pinning

All apps must use the same `lucide-react` version. Webpack `resolve.alias` in `next.config.js` pins to app's own copy. Hydration errors from version mismatch (different SVG primitives server vs client).

## Image storage

Single bucket `traverum-assets`. Path: `partners/{partner_id}/experiences/{experience_id}/{uuid}.webp`. Cover = `sort_order = 0`. Client-side compression: covers 0.90/1200x900/500KB, gallery 0.85/1920x1080/700KB.

## Receptionist auth

`getReceptionistContext()` loads all memberships, sorts by priority (`receptionist` first, then rows with `hotel_config_id`), returns first resolving to a `hotel_configs` row.

## Related pages

- [[product-rules]] — Product-level constraints
- [[design-system]] — UI and visual rules
- [[booking]] — Core flow the code implements
- [[commission]] — Split logic and rounding
- [[payment-modes]] — Stripe and pay-on-site implementation
- [[deployment]] — Release, env, cron, migration, and rollback runbook
