# Supplier Dashboard Overview

> Portal for experience suppliers to manage their business on Traverum.

## Purpose

Enable suppliers to:
1. Create and manage their experiences
2. Set availability and pricing
3. View and manage bookings
4. Track earnings and payouts
5. Connect with hotel partners

## User Profile

**Primary user**: Experience supplier (tour operator, activity provider, guide)
**Technical comfort**: Low to medium — must be simple
**Usage frequency**: Weekly check-ins, more during high season
**Device**: Desktop primary, mobile for quick checks

## Design Principles

- **Email-first for MVP**: Critical actions (accept/decline bookings) happen via email. Dashboard is for management, not urgent response.
- **Progressive complexity**: Show simple views first, advanced options available but not prominent
- **No training required**: A supplier should understand the dashboard without documentation

## Navigation Structure

```
Supplier Dashboard
├── Experiences        # List, add, edit experiences
├── Bookings           # Incoming requests and confirmed bookings
├── Availability       # Calendar view of sessions (future)
├── Hotel Partners     # Where experiences are live (future)
├── Performance        # Analytics and performance metrics
├── Earnings           # Revenue and payout history (future)
└── Settings           # Profile, Stripe, notifications
```

## MVP Scope vs Future

| Feature | MVP | Future |
|---------|-----|--------|
| View/edit experiences | ✓ | |
| Add new experience | ✓ | |
| Set availability windows | ✓ | |
| View bookings list | ✓ | |
| Stripe Connect setup | ✓ | |
| Profile settings | ✓ | |
| Calendar view | | Q2 2026 |
| Hotel partner requests | | Q2 2026 |
| Earnings dashboard | | Q2 2026 |
| Performance analytics | ✓ | |
| Team member access | | Long term |

## Entry Points

1. **Invitation email** → First-time setup flow → Dashboard
2. **Login** → Dashboard home (Experiences list)
3. **Email action link** → Specific booking detail (future)

## Key Flows (See /docs/flows/)

- Supplier onboarding: `supplier-onboarding.md`
- Experience creation: `experience-creation.md`
- Booking management: `booking-flow.md`

## Related Documents

| Topic | Document |
|-------|----------|
| Page specifications | `/apps/supplier-dashboard/pages/` |
| Performance Metrics | `/apps/supplier-dashboard/pages/performance-metrics.md` |
| Experience data model | `/docs/data/entities.md` |
| Design patterns | `/docs/design/style-guide.md` |