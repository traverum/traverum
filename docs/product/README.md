# Product Documentation

This folder is the single source of truth for **what we're building and for whom**. It describes goals, personas, promises, and product decisions — not implementation details.

## How it's organized

Folders are organized by **persona** — the person using that part of the product:

| Folder | Persona | App | Routes |
|--------|---------|-----|--------|
| `guest/` | Travelers booking experiences | Widget (Next.js) | `/{hotelSlug}/*` |
| `supplier/` | Tour operators, activity providers | Dashboard (Vite SPA) | `/supplier/*` |
| `hotel/` | Hotels embedding the widget | Dashboard (Vite SPA) | `/hotel/*` |
| `receptionist/` | Hotel front desk staff | Dashboard (Vite SPA) | `/receptionist/*` |
| `platform/` | Traverum team (internal) | Admin (Vite SPA) | `/admin/*` |
| `system/` | *(cross-cutting)* | All apps | — |

Each persona folder has:
- **`_overview.md`** — Who is this person? What do we promise them? What does success look like?
- **Journey docs** — The key user flows, in priority order

The `system/` folder covers product rules that span all personas: booking flow, pricing, channels, communication, and the embed system.

## Data model (overview)

Core chain: **partners** → **experiences** → **experience_sessions** → **reservations** → **bookings**.

- **Partners** have `partner_type` `supplier` or `hotel`. Suppliers create experiences; hotels embed the widget and earn commission on linked experiences.
- **Multi-org access:** users link to one or more partners via the **user_partners** junction table; RLS and helpers (e.g. `get_user_partner_ids()`) scope data by those memberships.
- **UUIDs** are used for primary keys across these entities.

For booking states, payment timing, and privacy rules, see `system/booking-flow.md`. For money fields and pricing types, see `system/pricing.md`.

## The AI contract

- **Before editing a page or system**, check for a matching product doc. Read it.
- **Never modify the Goal section** without explicit user approval.
- **Design decisions** can be updated as implementation evolves, but flag changes that contradict the Goal.
- **After significant changes**, ask: *"Should I update the Design Decisions in [doc]?"*
- **Changes that affect north stars** (vision, booking flow, commission logic, channel behavior) trigger a stop-and-ask.

## How to find the right doc

When working on code, match the URL path to the persona folder:
- Editing `/supplier/bookings` → read `supplier/handle-bookings.md`
- Editing `/hotel/experiences` → read `hotel/curate-experiences.md`
- Editing `/{hotelSlug}/checkout` → read `guest/checkout-and-pay.md`
- Editing API routes for reservations → read `system/booking-flow.md`
- Editing email templates → read `system/communication.md`
