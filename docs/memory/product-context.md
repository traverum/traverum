# Product Context

Product knowledge learned from chats. This is the AI's staging area — the human reviews periodically and promotes relevant items to `docs/product/`.

Entries are reverse chronological. Most recent first.

---

## Avoid

High-signal product rules. Check before proposing alternatives.

- **Money display:** symbol after number, comma decimal — `45 €` or `45,00 €`. Never `€45`. Use `Intl.NumberFormat('fi-FI')`.
- **European dates only.** `dd.MM.yyyy`, 24-hour `HH:MM`, Monday-start weeks. No American formats, no English day/month names in UI (except calendar headers). Numeric dates like `21.02.2026`.
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

## 2026-01 — Stripe Payment Links, not Checkout Sessions

Both booking flows (session-based and request-based) use Stripe Payment Links. Request-based bookings need a stable URL to embed in "Pay Now" emails sent hours later. Using the same approach for session bookings keeps one consistent payment path.
