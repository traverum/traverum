---
type: concept
created: 2026-04-15
updated: 2026-04-15
sources:
  - product-context.md
tags: [rules, product, avoid, conventions, decisions]
---

# Product Rules

Consolidated product decisions and constraints. **Check this page before building any feature.**

## Hard rules (the "Avoid" list)

- **Money display:** symbol after number, comma decimal — `45 €` or `45,00 €`. Never `€45`. Use `Intl.NumberFormat('fi-FI')`.
- **Globally unambiguous dates.** `27 Mar 2026`. Short: `27 Mar`. 24-hour time `HH:MM`, Monday-start weeks. No numeric-only dates (`27.03` is ambiguous). No American `MM/DD`.
- **No emojis in UI.** Lucide icons only.
- **No shadows for card distinction.** Use `border border-border` on unified warm white surface.
- **No gradients.**
- **No different background colors to separate areas.** Unified surface — borders create distinction.
- **No "are you sure?" confirmations for non-destructive actions.**
- **No always-visible helper text.** Use hover tooltips or placeholder text.
- **No capitalization beyond the first word of a sentence.**
- **Status transitions are one-way.** `pending` → `approved` → `confirmed` → `completed`. Never backwards.
- **Never use actual place names as test data or placeholders.**
- **No em dashes in guest-facing copy.** Use periods and colons.
- **No trust badges or security theater.** No shield icons, "100% secure!" banners. The hotel is the trust.
- **No country-specific placeholders.** No Finnish phone numbers, no "you@example.com".
- **Say things once.** If the sidebar explains payment, the form doesn't repeat it.
- **Time shows as a range.** "15:00–17:00" not "15:00" + "2h".
- **For pay-on-site, page title is "Reserve Your Spot"** and button says "Reserve".

## Key product decisions (chronological)

### Partners default to pay_on_site (2026-03)

New partners start as `payment_mode = 'pay_on_site'`. Only flips to `stripe` after Stripe Connect onboarding completes. Disconnecting Stripe reverts to `pay_on_site`. Frictionless onboarding — partners accept bookings immediately.

### Contact info reveal after card guarantee (2026-03)

For `pay_on_site` [[booking|bookings]], guest contact info revealed after Setup Intent confirmation, not after payment. Deliberate relaxation of "hide until payment" rule.

### Commission via monthly invoice for pay-on-site (2026-03)

[[Commission]] collected via monthly invoice (cron on 1st). Cancellation fee credits netted against commission. See [[payment-modes]].

### Booking reference format (2026-03)

`TRV-XXXXXX` — first 8 chars of UUID, uppercase.

### AI agent readiness (2026-03)

Fifth user type: autonomous AI agents. Three discovery layers: passive (llms.txt, JSON-LD), active (OpenAPI, MCP, CLI), agent-to-agent (AgenticBooking.org). Suppliers do nothing extra — same inventory, same [[booking]] engine. See [[tech-decisions]] for implementation.

### Experience tags replace categories (2026-03)

Seven editorial labels (Food & Wine, Adventure & Outdoors, etc.) from `EXPERIENCE_TAGS` in `@traverum/shared`. Multiple tags per experience. Drive Veyond `/experiences` Netflix-style rows and hotel widget filter pills.

### Hosts section — guest-facing supplier profiles (2026-03)

Opt-in (`profile_visible = false` default). Shows avatar, display name, city, bio. Always visible when opted in — no hotel-level toggle. See [[supplier]].

### Checkout design principles (2026-03)

No trust badges, no em dashes, no country-specific placeholders. Payment info lives with the price (sidebar). Time as range. "Reserve Your Spot" for pay-on-site.

### Rental end date is inclusive (2026-02)

`start + (days - 1)`. Duration = `differenceInCalendarDays(end, start) + 1`.

### min_participants is UI-only (2026-02)

Widget participant selector starts at min. Not a backend pricing multiplier.

### Session price override is per-unit (2026-02)

Override replaces unit price and scales with quantity. Not a flat total. See [[pricing]].

### Per-day rentals have no sessions (2026-01)

Rental experiences use `pricing_type: 'per_day'` with date range on reservation. No session records. Always request-based.

### Embed opens new tab (2026-01)

Card click opens booking in new tab. `returnUrl` from `window.location.href`. Keeps embed tiny (~15KB). See [[channels]].

### Legacy embed auto-converts (2026-01)

`<div id="traverum-widget">` auto-detected and converted. Breaking existing embeds is unacceptable.

## Related pages

- [[tech-decisions]] — Technical constraints and anti-patterns
- [[design-system]] — Visual and UI rules
- [[booking]] — Core flow
- [[pricing]] — Price calculation rules
- [[cancellation]] — Policy enforcement
