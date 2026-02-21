# Supplier Home

## Purpose

**Route:** `/supplier/dashboard`

Landing page when a supplier opens the dashboard. They should immediately see: do I need to take action? Is anything happening soon?

No analytics dashboards, no vanity metrics. Just: what needs my attention right now, and quick links to everything else.

## Key decisions

- Time-based greeting ("Good morning/afternoon/evening")
- Stripe onboarding alert when Stripe not connected — supplier can't accept bookings without Stripe
- **Pending requests** (action needed) — horizontal scroll cards (max 6), links to Booking Management requests tab
- **Upcoming sessions** — horizontal scroll cards, links to Booking Management with session ID
- **Active & upcoming rentals** — only shown if there are rental bookings, links to Booking Management upcoming tab
- **Experiences** — horizontal scroll cards (max 6), shows status badge (active/draft/archive), links to experience edit page

## Reference

- Cursor rule: `.cursor/rules/dashboard-ui.mdc`
- Code: `apps/dashboard/src/pages/supplier/Dashboard.tsx`
