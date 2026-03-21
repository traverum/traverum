# Decisions

Architecture decisions, reverse chronological. Most recent first.
When proposing a change that touches one of these, read the decision first.

---

## 2026-03 — Widget API JSON response shape

**Context:** Dashboard and Admin call widget API routes; guests hit the same routes. Inconsistent JSON makes clients harder to maintain.
**Decision:** Prefer `NextResponse.json({ success: true, data: ... })` for success and `NextResponse.json({ error: 'message' }, { status })` for errors, consistent with existing routes. Only change shape when intentionally migrating callers.
**Why:** One predictable contract for SPA clients and for future API consumers.

---

## 2026-03 — Guest-facing booking reference format

**Context:** Bookings need a short human-readable reference in email and UI.
**Decision:** Display format `TRV-XXXXXX` — first 8 characters of the booking UUID, uppercase (e.g. `TRV-A1B2C3D4`).
**Why:** Short, unique enough for support context, avoids exposing full UUID in every surface.

---

## 2026-02 — Rental end date is inclusive

**Context:** `rental_end_date` was originally exclusive (day after last rental day), causing mismatches between displayed dates and duration across dashboard, emails, and calendar.
**Decision:** `rental_end_date` is the last calendar day of the rental (inclusive). "Start 1 April, 2 days" → end date is 2 April. Computed as `start + (days - 1)`. Duration = `differenceInCalendarDays(end, start) + 1`.
**Why inclusive:** Our model is "start date + N days", not hotel check-in/check-out. Inclusive end means the stored value matches what the user sees — no off-by-one adjustments needed anywhere (display, calendar overlap, "is active today" checks).

---

## 2026-02 — min_participants is a UI booking minimum, not a pricing floor

**Context:** Suppliers want to set a minimum group size (e.g. "at least 2 people for a wine tasting"). Could enforce as a pricing floor (charge for N even if fewer book) or as a selection constraint.
**Decision:** `min_participants` is enforced at the UI level — the widget's participant selector starts at `min_participants` and guests cannot choose fewer. It is not a backend pricing multiplier. `Math.max(participants, min_participants)` exists in pricing functions only as a safety net.
**Why UI-level:** Simpler mental model for suppliers ("minimum 2 people" means you can't book for 1) and avoids confusing "you picked 1 but we're charging for 2" scenarios.

---

## 2026-02 — Session price override is per-unit, not a flat total

**Context:** Sessions can have a `price_override_cents` for promotions or peak pricing. Could replace the total price or replace the unit price.
**Decision:** Override replaces the unit price and scales with quantity. For `per_person`: `override × participants`. For `flat_rate`: `override` (constant). For `per_day`: `override × days × quantity`.
**Why per-unit:** Consistent behavior across pricing types. A flat total override would need different logic per type and wouldn't scale with group size, which would confuse suppliers setting "discounted price per person."

---

## 2026-01 — Client-side image compression, WebP, specific quality targets

**Context:** Suppliers upload experience photos. Could compress server-side or client-side.
**Decision:** Client-side compression via `browser-image-compression` (Web Workers, non-blocking). All images converted to WebP. Cover images: 0.90 quality, 1200×900px, 500KB max. Gallery: 0.85 quality, 1920×1080px, 700KB max.
**Why client-side:** No server load, instant feedback, works with Supabase Storage (direct upload). WebP is 30-40% smaller than JPEG at equivalent quality.

---

## 2026-01 — Image storage: single bucket, flat files, media table

**Context:** Need to store and order experience images. Could use nested folders, separate buckets, or a flat structure.
**Decision:** Single public bucket `traverum-assets`. Path: `partners/{partner_id}/experiences/{experience_id}/{uuid}.webp`. `media` table tracks each image with `sort_order`. Cover image = `sort_order = 0`. Changing cover = reorder in DB, no file operations.
**Why flat:** Simple path structure, RLS on storage uses `partner_id` in path. Reordering is a DB operation (cheap) not a file rename (expensive).

---

## 2026-01 — Embed opens new tab for booking flow

**Context:** Guest clicks an experience card in the embedded widget. Could open booking in the same page (SPA-style), in a modal, or in a new tab.
**Decision:** Card click opens `book.veyond.eu/{hotelSlug}/{experienceSlug}?returnUrl=...` in a new tab. `returnUrl` is set automatically from `window.location.href`. The hotel name button in the booking flow navigates back using `returnUrl` (priority) or `hotel_configs.website_url` (fallback).
**Why new tab:** The embed is a lightweight Shadow DOM widget (~15KB, no React). Running the full Next.js booking flow inside it would require shipping React into the hotel's page. A new tab keeps the embed tiny and the booking flow full-featured.

---

## 2026-01 — Legacy embed pattern auto-converts

**Context:** Early hotels were given a `<div id="traverum-widget">` + `<script data-hotel="slug">` embed snippet. We later switched to a `<traverum-widget>` Web Component.
**Decision:** `embed.js` detects both patterns. The old `<div>` pattern auto-converts to the Web Component internally. No action needed from hotels.
**Why:** Breaking existing embeds on hotel websites is unacceptable. Hotels won't update their code promptly. Silent upgrade preserves existing integrations.

---

## 2026-01 — Math.round for commission splits, not Math.floor

**Context:** Commission split (supplier + hotel + platform = 100%) produces fractional cents.
**Decision:** Use `Math.round()` for all three amounts. Rounding remainder assigned to platform amount so the sum always equals the total.
**Why not Math.floor:** Floor systematically loses cents. Over thousands of bookings, the deficit adds up and the books don't balance.

---

## 2026-01 — Three separate Vercel projects

**Context:** Monorepo has three apps (widget, dashboard, admin). Could deploy as one Vercel project with multiple builds or three separate projects.
**Decision:** Three separate Vercel projects, each with its own Root Directory and build command.
**Why not one project:** Mixing Root Directories causes the wrong app to deploy. This happened in production — dashboard build pulled Next.js config from widget. Separate projects make it impossible to cross-contaminate.

---

## 2026-01 — Widget is the API layer

**Context:** Dashboard and Admin need to create/update data. Could call Supabase directly or go through widget API routes.
**Decision:** All mutations go through `apps/widget/src/app/api/` routes. Dashboard and Admin use Supabase client for reads only.
**Why not direct Supabase mutations:** Business logic (commission calculation, email triggers, Stripe operations) lives in the API routes. Direct mutations would bypass it, causing inconsistent state.

---

## 2026-01 — Per-day rentals have no sessions

**Context:** Rental experiences (bikes, boats) use per-day pricing. Could model as sessions or as date-range requests.
**Decision:** Rentals use `pricing_type: 'per_day'` with `rental_start_date` / `rental_end_date` on the reservation. No session records created. Always request-based flow.
**Why not sessions:** A 7-day bike rental would need 7 session records. Date ranges are simpler and match how rental businesses think.

---

## 2026-01 — date-fns, not dayjs or moment

**Context:** Need a date manipulation library with European locale support.
**Decision:** date-fns everywhere. European format `dd.MM.yyyy`, 24-hour times, Monday-start weeks.
**Why not dayjs/moment:** date-fns is tree-shakeable (smaller bundles). moment is deprecated. dayjs has weaker locale support for European formats.

---

## 2026-01 — Resend for transactional email

**Context:** Need to send booking confirmations, supplier notifications, payment links.
**Decision:** Resend with `Traverum <bookings@veyond.eu>` as sender. Templates are HTML strings with inline CSS via `baseTemplate()`.
**Why not SES/SendGrid:** Resend has a simpler API, good DX, and reasonable pricing for our volume. No need for SES complexity at this stage.

---

## 2026-01 — pnpm + Turborepo monorepo

**Context:** Three apps sharing types and constants.
**Decision:** pnpm workspaces with Turborepo for task orchestration. `@traverum/shared` package for shared code.
**Why not npm/yarn workspaces:** pnpm is faster, stricter about phantom dependencies. Turborepo gives caching and parallel builds.

---

## 2026-01 — PostGIS for location matching

**Context:** Hotels need to show "nearby experiences" within a configurable radius.
**Decision:** PostGIS extension with `geography(POINT, 4326)` columns. `get_experiences_within_radius()` RPC for radius queries.
**Why not application-level filtering:** SQL-level geospatial queries are orders of magnitude faster than fetching all experiences and filtering in JS. PostGIS is battle-tested.

---

## 2026-01 — Shadow DOM for widget isolation

**Context:** Hotel widget embeds on third-party hotel websites with unpredictable CSS.
**Decision:** `<veyond-widget>` Web Component with Shadow DOM. CSS variables for theming. Embed script at `/embed.js`.
**Why not iframe:** Shadow DOM allows better integration with the host page (auto-height, shared scrolling, no cross-origin restrictions). Iframes are offered as a fallback for page builders like Wix.

---

## 2026-01 — React Context, not Zustand

**Context:** Dashboard needs auth state, active partner selection, sidebar state.
**Decision:** React Context (`useAuth`, `useActivePartner`, `useActiveHotelConfig`, `SidebarContext`) plus React Query for server state.
**Why not Zustand/Redux:** Three contexts and React Query cover all current needs. Adding a state library would be premature abstraction for a solo-dev project.

---

## 2026-01 — Stripe Payment Links, not Checkout Sessions

**Context:** Two booking flows need payment: session-based (immediate) and request-based (email hours later).
**Decision:** Stripe Payment Links for both flows. Each booking creates a new Price with dynamic pricing from `calculatePrice()`.
**Why not Checkout Sessions:** Request-based bookings need a stable URL to embed in "Pay Now" emails. Payment Links provide this natively. Using the same approach for session bookings keeps one consistent payment path.
