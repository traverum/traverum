# Tech Context

Technical decisions made by the AI during implementation. These are not set in stone — they reflect choices made with the information available at the time. Override freely.

Entries are reverse chronological. Most recent first.

---

## Avoid

Patterns that caused bugs or are wrong for this project. Check before proposing alternatives.

- **Never store money as floats.** Always integer cents with `_cents` suffix.
- **Never use `Math.floor()` for commission splits.** Use `Math.round()`. Rounding remainder goes to platform amount.
- **Never derive a calendar date with `toISOString().split('T')[0]`.** Returns UTC, shifts the day in non-UTC timezones.
- **Never use `new Date("yyyy-mm-dd")`.** Parsed as UTC midnight — wrong day west of UTC. Use `parseLocalDate()`.
- **Dashboard/Admin must never mutate Supabase directly.** They call widget API routes for all mutations. Reads via Supabase client are fine.
- **Never mix Vercel projects.** Three separate projects, one per app. Wrong Root Directory = broken production.
- **Never deploy Admin with `pnpm --filter`.** Use `npx vite build` directly to avoid OOM on Vercel Hobby.
- **Never use Stripe Checkout Sessions.** Always Payment Links — stable URLs for email-based payment.
- **Never skip `source_transaction` on Stripe transfers in test mode.** Required for test-mode transfer association.
- **Never use CSS classes in email templates.** Inline styles only — email clients strip `<style>` blocks.
- **Never use flexbox in email layout.** Stacked layout (label above value). Flexbox breaks in email clients.
- **Never forget `escapeHtml()` for user-provided content in emails.** Always sanitize via `@/lib/sanitize`.
- **Never forget `style="color: white"` on email button text.** Gmail/Outlook override `<a>` colors to blue.
- **Always sanitize guest input.** `sanitizeGuestText()`, `sanitizeGuestEmail()` from `@/lib/sanitize`.
- **Never assume generated Supabase types cover all tables.** `users`, `user_partners` may be missing — add explicit type assertions or `next build` breaks.
- **Never confuse auth UUID with app user ID.** Supabase Auth `user.id` is NOT `users.id`. Always resolve via `auth_id` first, then use `users.id` for `user_partners`.
- **Never add Zustand, Redux, or other state libraries.** React Context + React Query is sufficient.
- **Never add dayjs or moment.** date-fns only.

---

## 2026-03 — Receptionist context: multi-partner resolution

`getReceptionistContext()` loads all memberships with allowed roles (`receptionist`, `owner`, `admin`), sorts by priority (`receptionist` first, then rows with explicit `hotel_config_id`, then the rest), and returns the first membership that resolves to a `hotel_configs` row. Deterministic behavior for hybrid accounts without requiring one row per user.

---

## 2026-03 — Widget API JSON response shape

Prefer `NextResponse.json({ success: true, data: ... })` for success and `NextResponse.json({ error: 'message' }, { status })` for errors. One predictable contract for SPA clients and future API consumers.

---

## 2026-01 — Math.round for commission splits

`Math.round()` for all three amounts (supplier, hotel, platform). Rounding remainder assigned to platform amount so the sum always equals the total. `Math.floor` systematically loses cents over thousands of bookings.

---

## 2026-01 — Three separate Vercel projects

One per app (widget, dashboard, admin), each with its own Root Directory and build command. Mixing Root Directories caused production issues — dashboard build pulled Next.js config from widget.

---

## 2026-01 — Widget is the API layer

All mutations go through `apps/widget/src/app/api/` routes. Dashboard and Admin use Supabase client for reads only. Business logic (commission calculation, email triggers, Stripe operations) lives in the API routes. Direct mutations would bypass it.

---

## 2026-01 — Client-side image compression

Client-side via `browser-image-compression` (Web Workers, non-blocking). All images converted to WebP. Cover images: 0.90 quality, 1200×900px, 500KB max. Gallery: 0.85 quality, 1920×1080px, 700KB max. No server load, instant feedback, works with Supabase Storage direct upload.

---

## 2026-01 — Image storage: single bucket, flat files, media table

Single public bucket `traverum-assets`. Path: `partners/{partner_id}/experiences/{experience_id}/{uuid}.webp`. `media` table tracks each image with `sort_order`. Cover image = `sort_order = 0`. Changing cover = reorder in DB, no file operations.

---

## 2026-01 — date-fns, not dayjs or moment

date-fns everywhere. Tree-shakeable (smaller bundles). moment is deprecated. dayjs has weaker locale support for European formats.

---

## 2026-01 — Resend for transactional email

Resend with `Traverum <bookings@veyond.eu>` as sender. Templates are HTML strings with inline CSS via `baseTemplate()`. Simpler API and good DX compared to SES/SendGrid at current volume.

---

## 2026-01 — pnpm + Turborepo monorepo

pnpm workspaces with Turborepo for task orchestration. `@traverum/shared` package for shared code. pnpm is faster and stricter about phantom dependencies. Turborepo gives caching and parallel builds.

---

## 2026-01 — PostGIS for location matching

PostGIS extension with `geography(POINT, 4326)` columns. `get_experiences_within_radius()` RPC for radius queries. SQL-level geospatial queries are orders of magnitude faster than fetching all and filtering in JS.

---

## 2026-01 — Shadow DOM for widget isolation

`<veyond-widget>` Web Component with Shadow DOM. CSS variables for theming. Embed script at `/embed.js`. Better integration with host page than iframes (auto-height, shared scrolling, no cross-origin restrictions). Iframes offered as fallback for page builders like Wix.

---

## 2026-01 — React Context + React Query, not Zustand

`useAuth`, `useActivePartner`, `useActiveHotelConfig`, `SidebarContext` plus React Query for server state. Three contexts cover all current needs. Adding a state library would be premature abstraction for a solo-dev project.
