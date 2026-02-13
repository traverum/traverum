# Booking Widget Overview

## Why This Exists

Hotel guests need a way to browse and book local experiences. The widget is the customer-facing booking interface that lives on hotel websites (embedded) or as a standalone page (book.traverum.com).

## What Guests Do Here

- **Browse** — See all experiences offered through a hotel, filter by category
- **View Details** — Read description, see photos, check pricing and availability
- **Pick a Date/Time** — Select from existing sessions or request a custom time
- **Book & Pay** — Enter details, pay via Stripe, receive confirmation

## How It's Delivered

Two delivery modes, same app:

| Mode | URL | Use Case |
|------|-----|----------|
| **Full-page** | `book.traverum.com/{hotelSlug}` | QR codes, email links, direct traffic |
| **Section embed** | Shadow DOM widget on hotel site | Embedded on hotel website pages |

See `widget-embed-architecture.md` for the embed system.

## Page Flow

`Experience List → Experience Detail → Checkout → Confirmation / Reservation Status`

## Key Behaviours

- **Theming** — Custom colors, fonts, spacing per hotel via `hotel_configs`. See `widget-theming-onboarding.md`.
- **Two booking paths** — Session-based (instant, pick existing session, one group per session) and request-based (custom date/time, needs supplier approval).
- **Availability-aware** — Calendar respects weekdays, operating hours, seasonal rules. Unavailable days disabled.
- **Pricing** — Per-person, flat-rate, base+extras. Prices in cents, displayed as EUR (€).
- **Demo mode** — `hotel-traverum` slug skips real API calls on checkout.
- **Responsive** — Desktop: booking panel on right. Mobile: bottom sheet + sticky bar.

## Tech

- **Framework:** Next.js 14 (App Router)
- **Hosting:** Vercel (`apps/widget`)
- **Domain:** book.traverum.com
- **Database:** Supabase (shared with dashboard)
- **Payments:** Stripe Checkout
- **UI:** Tailwind CSS, Framer Motion, shadcn/ui
- **Fonts:** Configurable per hotel (Google Fonts, runtime injection)
