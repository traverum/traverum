# Product Context

Product knowledge learned from chats. This is the AI's staging area — the human reviews periodically and promotes relevant items to `docs/product/`.

Entries are reverse chronological. Most recent first.

---

## 2026-03 — Hosts section (guest-facing supplier profiles)

**What it is:** An optional "Hosts" section on listing pages showing the people behind the experiences — circular avatar, display name, city, and a link to a detail page with full bio and their experiences.

**Product rules:**
- **Opt-in.** `profile_visible = false` by default. Suppliers enable it in Settings > Host profile. The section renders nothing until at least one supplier opts in.
- **Always visible when opted in.** No hotel-level toggle — if a partner has `profile_visible = true` and active experiences distributed to a hotel, they appear in that hotel's widget.
- **Profile fields live on `partners`.** One partner = one host face. `display_name` is the human name (distinct from `name` which is the org/business name).
- **Position:** Bottom of the listing page, after all experience rows.

---

## 2026-03 — Veyond experience tags (browse + supplier metadata)

**What changed:** Experiences are no longer a single “category” (one slug in `tags[0]`). Suppliers pick **one or more tags** from a fixed set of seven editorial labels (e.g. Food & Wine, Adventure & Outdoors). Same tags drive **Veyond** `/experiences` as **horizontal rows** (Netflix-style), so an experience can appear in multiple rows.

**Product rule:** Tags are **display and discovery metadata** — they do not change pricing, availability, or booking rules. Old category slugs were **best-effort mapped** in SQL; humans should re-tag where the map was wrong.

**Canonical list:** See `EXPERIENCE_TAGS` in `@traverum/shared` (ids are stable API/storage values; labels are guest-facing copy).

---

## Avoid

High-signal product rules. Check before proposing alternatives.

- **Money display:** symbol after number, comma decimal — `45 €` or `45,00 €`. Never `€45`. Use `Intl.NumberFormat('fi-FI')`.
- **Globally unambiguous dates.** `27 Mar 2026` format — day + abbreviated English month + year. Short form: `27 Mar`. 24-hour time `HH:MM`, Monday-start weeks. No numeric-only dates (`27.03` is ambiguous across cultures). No American `MM/DD` formats.
- **No emojis in UI.** Lucide icons only.
- **No shadows for card distinction.** Use `border border-border` on a unified warm white surface.
- **No gradients.**
- **No different background colors to separate areas.** Unified surface — borders create distinction.
- **No "are you sure?" confirmations for non-destructive actions.**
- **No always-visible helper text.** Use hover tooltips or placeholder text instead.
- **No capitalization beyond the first word of a sentence.**
- **Status transitions are one-way.** `pending` → `approved` → `confirmed` → `completed`. Never backwards.
- **Never use actual place names as test data or placeholders.**

---

## 2026-03 — Checkout page design principles

The checkout page exists to remove the last bit of hesitation. The guest already decided — the page collects the minimum info and confirms. Key rules:

- **No trust badges or security theater.** No shield icons, "100% secure!" banners. The hotel is the trust. The guest is booking through their hotel's website.
- **No em dashes in guest-facing copy.** Use periods and colons. Clearer across European languages.
- **No country-specific placeholders.** No Finnish phone numbers, no "you@example.com". Travelers come from everywhere. Labels are self-explanatory.
- **Say things once.** If the sidebar explains payment, the form doesn't repeat it. If the header has a back button, the page doesn't add another.
- **Payment info lives with the price.** The summary sidebar (right) shows what things cost and how payment works. The form (left) is pure action — name, email, card, done.
- **Time shows as a range.** "15:00–17:00" not "15:00" + "2h". Communicates both when and how long in one line.
- **For pay-on-site, the page title is "Reserve Your Spot"** — because the guest is reserving, not buying. Button says "Reserve" to match.

---

## 2026-03 — AI Agent Readiness: a new distribution channel

Traverum has four user types: hoteliers, receptionists, suppliers, guests. Now there's a fifth: **autonomous AI agents acting on behalf of travelers.** When a traveler asks ChatGPT or Claude "what can I do near Lake Garda?", our customers' experiences should appear in the answer — and be bookable right there.

**Why this matters commercially:** This is a new revenue argument for onboarding. Hotels and suppliers who join Traverum become discoverable by AI travel agents. "AI-visible" inventory is the new SEO — and we handle it for them.

**Three discovery layers (all required):**
1. **Passive** — `llms.txt`, JSON-LD structured data, so AI crawlers include our inventory in their knowledge.
2. **Active** — OpenAPI spec, MCP server, and CLI so agents can search inventory and execute bookings programmatically.
3. **Agent-to-agent** — AgenticBooking.org and similar open standards so agent ecosystems can negotiate bookings with our platform.

**Key product rule:** Suppliers don't do anything extra. They manage inventory through the dashboard as today. The AI layer reads the same data and calls the same booking engine. One source of truth, multiple interfaces (human SPA, agent CLI, agent MCP, agent API).

---

## 2026-03 — Reserve & Pay on Site: contact info reveal after card guarantee

For `pay_on_site` bookings, guest contact info (email, phone) is revealed to the supplier after the card guarantee is set up (Setup Intent confirmed), not after payment. The saved card replaces payment as the trust anchor. This is a deliberate relaxation of the "hide until payment" rule — the guest has committed financial accountability via the cancellation policy agreement.

---

## 2026-03 — Reserve & Pay on Site: commission collection via monthly invoice

For `pay_on_site` bookings, Traverum doesn't handle the experience payment. Commission is collected via monthly invoice (cron on 1st of each month). Cancellation fee credits are netted against commission owed. Supplier pays net amount via bank transfer.

---

## 2026-03 — Guest-facing booking reference format

Bookings display as `TRV-XXXXXX` — first 8 characters of the booking UUID, uppercase (e.g. `TRV-A1B2C3D4`). Short, unique enough for support, avoids exposing full UUID.

---

## 2026-02 — Rental end date is inclusive

`rental_end_date` is the last calendar day of the rental (inclusive). "Start 1 April, 2 days" → end date is 2 April. Computed as `start + (days - 1)`. Duration = `differenceInCalendarDays(end, start) + 1`. Inclusive because our model is "start date + N days" — the stored value matches what the user sees.

---

## 2026-02 — min_participants is a UI booking minimum, not a pricing floor

`min_participants` is enforced at the UI level — the widget's participant selector starts at `min_participants` and guests cannot choose fewer. Not a backend pricing multiplier. Simpler mental model for suppliers: "minimum 2 people" means you can't book for 1.

---

## 2026-02 — Session price override is per-unit, not a flat total

Override replaces the unit price and scales with quantity. For `per_person`: `override × participants`. For `flat_rate`: `override` (constant). For `per_day`: `override × days × quantity`. Consistent behavior across pricing types.

---

## 2026-01 — Per-day rentals have no sessions

Rental experiences (bikes, boats) use `pricing_type: 'per_day'` with `rental_start_date` / `rental_end_date` on the reservation. No session records created. Always request-based flow. A 7-day bike rental doesn't need 7 session records — date ranges match how rental businesses think.

---

## 2026-01 — Embed opens new tab for booking flow

Card click in the embedded widget opens `book.veyond.eu/{hotelSlug}/{experienceSlug}?returnUrl=...` in a new tab. `returnUrl` is set from `window.location.href`. The hotel name button navigates back using `returnUrl` (priority) or `hotel_configs.website_url` (fallback). New tab keeps the embed tiny (~15KB, no React) and the booking flow full-featured.

---

## 2026-01 — Legacy embed pattern auto-converts

Early hotels got `<div id="traverum-widget">` + `<script data-hotel="slug">`. Later switched to `<traverum-widget>` Web Component. `embed.js` detects both patterns and auto-converts. Breaking existing embeds on hotel websites is unacceptable.

---

## 2026-01 — Stripe: pick the surface per flow

We use multiple Stripe primitives where each fits: Payment Links (stable URLs for async "Pay now" emails), Checkout Sessions where hosted redirect checkout is the right UX, Payment Element / Setup Intents for in-widget flows, etc. There is no blanket ban on Checkout Sessions.

---

## 2026-03 — Partners default to pay_on_site

New partners start as `payment_mode = 'pay_on_site'`. Only when a partner completes Stripe Connect onboarding (`stripe_onboarding_complete = true`) does their `payment_mode` flip to `'stripe'`. If they disconnect Stripe, it reverts to `'pay_on_site'`. This makes onboarding frictionless — partners can accept bookings immediately without Stripe setup.
