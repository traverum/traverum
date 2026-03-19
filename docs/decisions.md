# Decisions

Architecture decisions, reverse chronological. Most recent first.
When proposing a change that touches one of these, read the decision first.

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
