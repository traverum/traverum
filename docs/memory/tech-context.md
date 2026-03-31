# Tech Context

Technical decisions made by the AI during implementation. These are not set in stone — they reflect choices made with the information available at the time. Override freely.

Entries are reverse chronological. Most recent first.

---

## 2026-03 — Hosts section (partner profile columns + ScrollRow extraction)

**Schema:** Five new columns on `partners`: `display_name text`, `bio text`, `avatar_url text`, `profile_visible boolean NOT NULL DEFAULT false`, `partner_slug text` (partial unique index on non-null values). Migration: `20260328120000_add_partner_profiles.sql`.

**Data fetching:** `getVisibleHosts(hotelConfigId)` and `getHostBySlug(slug, hotelConfigId)` in `apps/widget/src/lib/hotels.ts`. Both scope by channel — `hotelConfigId = null` for Veyond direct (all visible hosts with active experiences), set for hotel widget (only partners distributed to that hotel via `distributions`).

**Component split:** `ScrollRow` extracted from `NetflixLayout` into `apps/widget/src/components/ScrollRow.tsx` (generic children-based scroll row with fade arrows). `HostsSection` is a server component that fetches, `HostsSectionClient` is the client wrapper using `ScrollRow`. Both `NetflixLayout` and `HostsSectionClient` now use the shared `ScrollRow`.

**Avatar storage:** `partners/{partner_id}/avatar.{ext}` in the `traverum-assets` Supabase storage bucket. Dashboard `AvatarUploader` component handles upload with `upsert: true`.

**Routes:** Host detail pages at `experiences/hosts/[hostSlug]` (Veyond direct) and `[hotelSlug]/hosts/[hostSlug]` (hotel widget), mirroring the existing channel routing pattern.

---

## 2026-03 — Experience tags (replace categories; no new column)

**Storage:** `public.experiences.tags` remains `text[] NOT NULL`. There is no separate “tag” column — multiple tags are the array itself.

**Canonical ids** (labels in UI): `unusual`, `classic`, `family`, `adventure_outdoors`, `local_life`, `history`, `food_wine`. Single source: `EXPERIENCE_TAGS` in `packages/shared/src/constants.ts`. Helpers: `getTagLabel`, `getTagLabels`. Deprecated aliases kept for a beat: `EXPERIENCE_CATEGORIES` → same array, `getCategoryLabel` → `getTagLabel`, `getCategoryIcon` → always `''`.

**Data migration:** `apps/dashboard/supabase/migrations/20260327120000_replace_categories_with_tags.sql` — replaces legacy slugs (`food`, `culture`, `nature`, `adventure`, `wellness`, `nightlife`) with new ones and deduplicates the array. **No DDL** — no type regeneration required for this change alone.

**Production deploy order (recommended):** (1) Deploy **dashboard** so suppliers can edit multi-tags. (2) Run the migration on **production** (identical SQL from git; use MCP `apply_migration` or CLI per `docs/deployment/DEPLOYMENT.md`). (3) Deploy **widget**. Worst case during skew: browse UI shows fewer tag rows until migration + widget align; booking flows do not read tags.

**UI:** Veyond `/experiences` uses `NetflixLayout` (horizontal rows). Hotel embed listing uses `ExperienceListClient` with tag filter pills.

---

## 2026-03 — lucide-react monorepo version pinning

Two versions of `lucide-react` (v0.462.0 at root, v0.562.0 in widget) caused hydration errors on every page with Lucide icons. The SVG primitives changed between versions (e.g. `Clock` went from `<circle>` + `<polyline>` to `<path>` + `<circle>`). Next.js server bundler resolved the hoisted root version while the client bundler resolved the app-level version — different SVG elements = hydration mismatch.

**Fix:** webpack `resolve.alias` in `next.config.js` pins `lucide-react` to the widget's own resolved copy using `require.resolve('lucide-react/package.json', { paths: [__dirname] })`. All three apps also aligned to `^0.562.0` and `pnpm.overrides` added to root `package.json` as a safety net. **Rule:** when upgrading `lucide-react` in any app, upgrade all apps to the same version.

---

## 2026-03 — Official Stripe AI skill (copied from github.com/stripe/ai)

Official Stripe agent skill lives at `.agents/skills/stripe-best-practices-official/` — the `SKILL.md` + `references/` folder copied from [stripe/ai](https://github.com/stripe/ai). Also copied: `.agents/skills/upgrade-stripe/` (API version upgrade guide). **To update:** download the latest from the repo and copy `skills/stripe-best-practices/` and `skills/upgrade-stripe/` over the existing folders. Traverum-specific Stripe patterns live in `.agents/skills/traverum-stripe/`.

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
- **Never overwrite `types.ts` with raw Supabase generated output.** The widget types file (`apps/widget/src/lib/supabase/types.ts`) has convenience type aliases at the bottom (`Experience`, `Booking`, `Partner`, etc.) that the entire codebase imports. Regenerating types replaces the file — always re-append the aliases after. Dashboard types (`apps/dashboard/src/integrations/supabase/types.ts`) must be synced manually (separate file, not auto-generated).

---

## 2026-03 — AI Agent Interface: CLI-first, then MCP and OpenAPI

We don't trust any single protocol to win the agent interface war. AI agents connect in three ways, and we build for all of them:

1. **CLI (universal)** — Every agent runtime can shell out. A well-structured CLI (`traverum search --location "Lake Garda" --category wine --date 2026-07-15`) is the lowest-common-denominator interface. Outputs structured JSON to stdout. Self-documenting via `--help`. No auth dance needed for read operations.
2. **MCP server** — Wraps the same logic as the CLI. Claude and the MCP ecosystem connect natively. Exposes tools (search, check availability, create reservation) and resources (experience catalog, destination metadata).
3. **OpenAPI spec** — Single YAML/JSON file describing the public API surface. Consumed by LangChain, CrewAI, OpenAI GPT Actions, AutoGen, and any HTTP-based agent. Agent-optimized descriptions with `x-agent-hint` extensions.

**Architecture rule:** CLI, MCP, and OpenAPI all call the same underlying functions. Never duplicate business logic across interfaces. The widget API routes remain the source of truth — agent interfaces are thin wrappers.

**Auth for agents:** Read-only operations (search, availability) are unauthenticated. Write operations (create reservation, confirm booking) use API keys with rate limiting. Separate from cookie/JWT auth used by human SPAs.

**Response contract for agents:** All agent-facing responses follow `{ data, error, meta }` envelope. Errors include machine-readable `code` field and human-readable `message`. Pagination via `meta.cursor` or `meta.next_page`.

**AI readiness checklist (apply when building new features):**
- Does this feature expose inventory or booking capability that agents should access?
- If yes: is it reachable via the public API with structured JSON responses?
- Are the field names descriptive enough that an agent's LLM can understand them without documentation?
- Are error responses machine-parseable?

---

## 2026-03 — Stripe Setup Intent + Payment Element for card guarantees

"Reserve & Pay on Site" uses Stripe Setup Intents API with the Payment Element (deferred intent pattern) for saving guest cards. The deferred pattern renders `PaymentElement` with `mode: 'setup'` and `currency: 'eur'` — no SetupIntent created until form submission. This avoids needing a client secret before having guest details. Off-session charges (cancellation fees) use `stripe.paymentIntents.create` with `off_session: true` and the saved PaymentMethod. Requires `@stripe/stripe-js` + `@stripe/react-stripe-js` in widget, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` env var.

**Widget UI (Phase 4):** Session checkout uses `StripeSetupProvider` + `CardGuaranteeSection` inside `CheckoutForm` only when supplier `payment_mode` is `pay_on_site` and the flow is not a custom request. Request-based guarantee: `GuaranteeForm` on `/<hotelSlug>/reservation/[id]/guarantee` and `/experiences/reservation/[id]/guarantee`. Reservation status pages mount `SetupIntentConfirmer` (Suspense) to finish `confirm-guarantee` when Stripe returns with `setup_intent` query params after a redirect.

---

## 2026-03 — payment_mode denormalized on bookings

`bookings.payment_mode` is denormalized from `partners.payment_mode` at booking creation time. This lets crons and invoice queries filter by payment mode without joining partners. Values: `'stripe'` (default) or `'pay_on_site'`.

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
