---
last_updated: 2026-04-13
compiled_from: docs/memory/tech-context.md
---

# Technical Decisions

Decisions made during implementation. Not set in stone — override freely when context changes. Grouped by topic.

## Types

### ExperienceWithMedia: intersection, not interface extends

`ExperienceWithMedia` in `apps/widget/src/lib/hotels.ts` uses `type X = Experience & { ... }` instead of `interface X extends Experience { ... }`. Generated Supabase Row types have nullable fields (e.g. `allows_requests: boolean | null`), and interface `extends` breaks when redeclaring with different optionality. **Rule:** always use `&` intersection for types that extend generated Supabase Row types.

### Convenience type aliases are mandatory after type regeneration

Both `apps/widget/src/lib/supabase/types.ts` and `apps/dashboard/src/integrations/supabase/types.ts` **must** have convenience aliases appended at the bottom after every regeneration: `Experience`, `Booking`, `Partner`, `HotelConfig`, `Media`, `Distribution`, `ExperienceSession`, `Reservation`, `User`, `HotelPayout`, plus status union types. Without them, `next build` fails with 200+ type errors. Both files have a `// Convenience types` comment marking the section.

### Supabase query `never` types: use type assertions

Some Supabase queries return `never` because generated types have empty `Relationships: []` on tables that actually have foreign keys. Runtime queries work correctly. Fix with `as any` on `.from()` plus explicit return type. Used in `generate-invoices`, `sync-divinea`, `receptionist/auth.ts`, and `hotels.ts`.

## Stripe

### Setup Intent + Payment Element for card guarantees

"Reserve & Pay on Site" uses Stripe Setup Intents API with the Payment Element (deferred intent pattern). The deferred pattern renders `PaymentElement` with `mode: 'setup'` and `currency: 'eur'` — no SetupIntent created until form submission. Off-session charges (cancellation fees) use `stripe.paymentIntents.create` with `off_session: true` and the saved PaymentMethod.

### payment_mode denormalized on bookings

`bookings.payment_mode` is denormalized from `partners.payment_mode` at booking creation time. Lets crons and invoice queries filter by payment mode without joining partners.

### Official Stripe AI skill

Official Stripe agent skill at `.agents/skills/stripe-best-practices-official/` copied from [stripe/ai](https://github.com/stripe/ai). Traverum-specific patterns in `.agents/skills/traverum-stripe/`. **To update:** download latest from the repo and copy over.

### Pick the Stripe surface per flow

Payment Links for async "Pay now" emails, Checkout Sessions for hosted redirect, Payment Element / Setup Intents for in-widget flows. No blanket ban on any Stripe primitive.

## Database

### PostGIS for location matching

`geography(POINT, 4326)` columns with `get_experiences_within_radius()` RPC. SQL-level geospatial queries, orders of magnitude faster than fetch-all-and-filter.

### Image storage: single bucket, flat files, media table

Single public bucket `traverum-assets`. Path: `partners/{partner_id}/experiences/{experience_id}/{uuid}.webp`. `media` table tracks each image with `sort_order`. Cover = `sort_order = 0`.

### Client-side image compression

`browser-image-compression` (Web Workers). All images converted to WebP. Cover: 0.90 quality, 1200×900px, 500KB max. Gallery: 0.85 quality, 1920×1080px, 700KB max.

### Math.round for commission splits

`Math.round()` for all three amounts. Rounding remainder assigned to platform. `Math.floor` systematically loses cents over thousands of bookings.

## UI

### lucide-react monorepo version pinning

Two versions caused hydration errors (different SVG primitives between v0.462.0 and v0.562.0). Fix: webpack `resolve.alias` in `next.config.js` pins to widget's resolved copy + `pnpm.overrides`. **Rule:** upgrade all apps together.

### Shadow DOM for widget isolation

`<veyond-widget>` Web Component with Shadow DOM. CSS variables for theming. Better than iframes (auto-height, shared scrolling). Iframes offered as fallback for Wix etc.

### Hosts section (partner profiles)

Five columns on `partners`: `display_name`, `bio`, `avatar_url`, `profile_visible`, `partner_slug`. `ScrollRow` extracted from `NetflixLayout` for reuse. Avatar storage: `partners/{partner_id}/avatar.{ext}` in `traverum-assets`.

### Experience tags (replace categories)

Multi-select from seven canonical tags in `EXPERIENCE_TAGS` (`@traverum/shared`). Stored in existing `experiences.tags` (`text[]`). Data migration remaps old slugs. No DDL change.

## Architecture

### Two domains, one widget deployment

`veyond.app` serves the Veyond direct channel (consumer booking). `book.veyond.eu` serves hotel white-label (`/{hotelSlug}`) and internal tools (dashboard, receptionist, API). Both are served by the same Widget Vercel project. Next.js middleware rewrites `veyond.app/*` → `/experiences/*` internally and 301 redirects `book.veyond.eu/experiences*` → `veyond.app`. File system unchanged — `/experiences` route folder stays, middleware makes URLs clean. Email links and Stripe redirects for direct bookings use `NEXT_PUBLIC_VEYOND_URL`.

### Three separate Vercel projects

One per app (widget, dashboard, admin), each with its own Root Directory and build command. Mixing Root Directories caused production issues.

### Widget is the API layer

All mutations go through `apps/widget/src/app/api/`. Dashboard and Admin use Supabase client for reads only. Business logic lives in API routes.

### pnpm + Turborepo monorepo

pnpm workspaces with Turborepo for task orchestration. `@traverum/shared` for shared code. Strict phantom dependency handling.

### React Context + React Query, not Zustand

`useAuth`, `useActivePartner`, `useActiveHotelConfig`, `SidebarContext` plus React Query for server state. No state library needed for a solo-dev project.

### date-fns, not dayjs or moment

Tree-shakeable, good European locale support. moment is deprecated.

### Resend for transactional email

`Traverum <bookings@veyond.eu>` as sender. HTML string templates with inline CSS via `baseTemplate()`.

### Widget API JSON response shape

`NextResponse.json({ success: true, data: ... })` for success, `NextResponse.json({ error: 'message' }, { status })` for errors.

### Receptionist context: multi-partner resolution

`getReceptionistContext()` loads all memberships with allowed roles, sorts by priority (`receptionist` first, then rows with explicit `hotel_config_id`), returns first that resolves to a `hotel_configs` row.

## AI Agent Interface

CLI-first, then MCP and OpenAPI. All three call the same underlying functions — never duplicate business logic across interfaces.

- **CLI:** Structured JSON to stdout, self-documenting via `--help`, no auth for reads.
- **MCP server:** Wraps CLI logic. Tools (search, availability, reservation) and resources (catalog, destinations).
- **OpenAPI spec:** Single YAML consumed by LangChain, CrewAI, OpenAI GPT Actions. Agent-optimized descriptions with `x-agent-hint`.
- **Auth:** Read-only = unauthenticated. Writes = API keys with rate limiting.
- **Response contract:** `{ data, error, meta }` envelope with machine-readable `code` and `meta.cursor` pagination.

## Avoid

Patterns that caused bugs or are wrong for this project.

- **Never store money as floats.** Always integer cents with `_cents` suffix.
- **Never use `Math.floor()` for commission splits.** Use `Math.round()`. Remainder goes to platform.
- **Never derive a calendar date with `toISOString().split('T')[0]`.** Returns UTC, shifts the day in non-UTC timezones.
- **Never use `new Date("yyyy-mm-dd")`.** Parsed as UTC midnight — wrong day west of UTC. Use `parseLocalDate()`.
- **Dashboard/Admin must never mutate Supabase directly.** They call widget API routes for all mutations.
- **Never mix Vercel projects.** Three separate projects, one per app.
- **Never deploy Admin with `pnpm --filter`.** Use `npx vite build` directly to avoid OOM on Vercel Hobby.
- **Never skip `source_transaction` on Stripe transfers in test mode.**
- **Never use CSS classes in email templates.** Inline styles only.
- **Never use flexbox in email layout.** Stacked layout. Flexbox breaks in email clients.
- **Never forget `escapeHtml()` for user-provided content in emails.** Always sanitize via `@/lib/sanitize`.
- **Never forget `style="color: white"` on email button text.** Gmail/Outlook override `<a>` colors to blue.
- **Always sanitize guest input.** `sanitizeGuestText()`, `sanitizeGuestEmail()` from `@/lib/sanitize`.
- **Never assume generated Supabase types cover all tables.** `users`, `user_partners` may be missing — add explicit type assertions.
- **Never confuse auth UUID with app user ID.** Supabase Auth `user.id` is NOT `users.id`. Resolve via `auth_id` first.
- **Never add Zustand, Redux, or other state libraries.** React Context + React Query is sufficient.
- **Never add dayjs or moment.** date-fns only.
- **Never overwrite `types.ts` with raw Supabase output.** Always re-append convenience aliases after regeneration.
