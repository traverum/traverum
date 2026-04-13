---
last_updated: 2026-04-13
compiled_from: docs/memory/product-context.md
---

# Product Notes

Product knowledge learned during implementation. The AI's staging area — human reviews periodically and promotes relevant items to `docs/product/`.

## Booking & Pricing

### Rental end date is inclusive

`rental_end_date` is the last calendar day (inclusive). "Start 1 April, 2 days" → end date is 2 April. Computed as `start + (days - 1)`. Duration = `differenceInCalendarDays(end, start) + 1`.

### Per-day rentals have no sessions

Rental experiences (`pricing_type: 'per_day'`) use `rental_start_date` / `rental_end_date` on the reservation. No session records created. Always request-based flow.

### min_participants is a UI booking minimum

Enforced at UI level — widget's participant selector starts at `min_participants`. Not a backend pricing multiplier. "Minimum 2 people" means you can't book for 1.

### Session price override is per-unit, not flat total

Override replaces unit price and scales with quantity. `per_person`: override × participants. `flat_rate`: override (constant). `per_day`: override × days × quantity.

### Guest-facing booking reference format

Displayed as `TRV-XXXXXX` — first 8 characters of booking UUID, uppercase. Short, unique enough for support, avoids exposing full UUID.

## Payment

### Partners default to pay_on_site

New partners start as `payment_mode = 'pay_on_site'`. Flips to `'stripe'` when Stripe Connect onboarding completes. Reverts on disconnect. Frictionless onboarding — partners accept bookings immediately without Stripe.

### Pay-on-site: contact info reveal after card guarantee

Guest contact info (email, phone) revealed to supplier after Setup Intent confirmed, not after payment. The saved card replaces payment as the trust anchor.

### Pay-on-site: commission via monthly invoice

Traverum doesn't handle pay-on-site experience payment. Commission collected via monthly invoice (cron, 1st of month). Cancellation fee credits netted against commission owed.

### Pick the Stripe surface per flow

Payment Links for async "Pay now" emails, Checkout Sessions for hosted redirect, Payment Element / Setup Intents for in-widget flows. No blanket ban on any primitive.

## Tags & Discovery

### Experience tags replace categories

Suppliers pick one or more tags from seven editorial labels. Same tags drive Veyond `/experiences` horizontal rows (Netflix-style) — experiences appear in multiple rows. Tags are **display and discovery metadata** only — no effect on pricing, availability, or booking rules.

## Hosts

### Hosts section (guest-facing supplier profiles)

Optional "Hosts" section on listing pages. Opt-in via `profile_visible` (default false). `display_name` is the human name (distinct from `name` = business/org name). Position: bottom of listing page, after all experience rows. No hotel-level toggle — if partner has `profile_visible = true` and active distributed experiences, they appear.

## Checkout & UX

### Checkout page design principles

- No trust badges or security theater — the hotel is the trust.
- No em dashes in guest-facing copy — use periods and colons.
- No country-specific placeholders — travelers come from everywhere.
- Say things once — no redundant info between sidebar and form.
- Payment info lives with the price (summary sidebar).
- Time shows as range: "15:00–17:00" not "15:00" + "2h".
- Pay-on-site title: "Reserve Your Spot", button: "Reserve".

## Embed & Widget

### Embed opens new tab for booking flow

Card click opens `book.veyond.eu/{hotelSlug}/{experienceSlug}?returnUrl=...` in a new tab. Keeps embed tiny (~15KB, no React) and booking flow full-featured.

### Legacy embed auto-converts

Early hotels got `<div id="traverum-widget">` + `<script data-hotel="slug">`. Later switched to `<traverum-widget>` Web Component. `embed.js` detects both and auto-converts. Breaking existing embeds is unacceptable.

## AI Agent Readiness

AI agents are a new distribution channel. Hotels and suppliers who join Traverum become discoverable by AI travel agents. "AI-visible" inventory is the new SEO.

**Three discovery layers:**
1. **Passive** — `llms.txt`, JSON-LD structured data for AI crawlers.
2. **Active** — OpenAPI spec, MCP server, CLI for programmatic search and booking.
3. **Agent-to-agent** — AgenticBooking.org and similar open standards.

**Key rule:** Suppliers don't do anything extra. Same data, same booking engine, multiple interfaces.

## Avoid (Product)

- **Money display:** symbol after number, comma decimal — `45 €` or `45,00 €`. Never `€45`. Use `Intl.NumberFormat('fi-FI')`.
- **Globally unambiguous dates.** `27 Mar 2026`. Short: `27 Mar`. 24-hour `HH:MM`, Monday-start weeks. No numeric-only dates. No American `MM/DD`.
- **No emojis in UI.** Lucide icons only.
- **No shadows for card distinction.** Use `border border-border` on unified warm white surface.
- **No gradients.**
- **No different background colors to separate areas.** Borders create distinction.
- **No "are you sure?" for non-destructive actions.**
- **No always-visible helper text.** Hover tooltips or placeholders.
- **No capitalization beyond the first word.**
- **Status transitions are one-way.** `pending` → `approved` → `confirmed` → `completed`. Never backwards.
- **Never use actual place names as test data or placeholders.**
