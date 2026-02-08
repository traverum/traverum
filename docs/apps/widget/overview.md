Updated by Elias on 07-02-2026

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

See `widget-embed-architecture.md` for technical details on the embed system.

## Page Flow

```
Hotel Experience List → Experience Detail → Checkout → Confirmation / Reservation Status
     /{hotelSlug}        /{hotelSlug}/{slug}    /checkout     /confirmation/{id}
                                                              /reservation/{id}
```

## Key Behaviours

- **Theming** — Every hotel gets custom colors, fonts, spacing. Widget adapts via `hotel_configs` table. See `widget-theming-onboarding.md`.
- **Availability-aware** — Calendar respects experience availability rules (weekdays, operating hours, seasons). Unavailable days are disabled.
- **Two booking paths** — Session-based (instant, pick existing session) and request-based (custom date/time, needs supplier approval).
- **Demo mode** — `hotel-traverum` slug runs in demo mode (no real API calls on checkout).
- **Responsive** — Desktop shows booking panel on the right. Mobile uses bottom sheet + sticky booking bar.
- **Pricing** — Supports per-person, flat-rate, and base+extras pricing. Prices in cents, displayed as EUR (€).

## Tech

- **Framework:** Next.js 14 (App Router, server components + client components)
- **Hosting:** Vercel (`apps/widget` root directory)
- **Domain:** book.traverum.com
- **Database:** Supabase (shared with dashboard)
- **Payments:** Stripe Checkout
- **UI:** Tailwind CSS, Framer Motion animations, shadcn/ui calendar
- **Fonts:** Configurable per hotel (Google Fonts, injected at runtime)
