# Supplier (Experience Provider)

## Where this lives
- **App:** Dashboard (`apps/dashboard`)
- **Routes:** `/supplier/*`
- **Key code:** `apps/dashboard/src/pages/supplier/`

## Who is this person?

Tour operators, activity guides, rental companies, wine estates. Often small businesses — one person running the show. Not necessarily tech-savvy. They check email far more than any dashboard. They care about bookings coming in and getting paid.

## What do we promise them?

Access to hotel guests and Veyond travelers without marketing costs. Manage everything from email if they prefer — accept or decline requests with one click, no login required. Get paid reliably after delivering experiences. The system handles the complexity (payments, refunds, scheduling) so they can focus on the experience.

## Success looks like

- Responds to a booking request in under 60 seconds via email one-click
- Creates their first experience in under 10 minutes
- Never misses a booking because of unclear notifications
- Gets paid within 7 days of delivering an experience
- Can manage their entire business from email without ever logging into the dashboard

## What should never happen

- Sees guest contact info before payment (platform bypass risk)
- Misses a booking because the email was unclear or buried
- Has money stuck — every completed booking must settle
- Needs to log in to the dashboard for basic operations (accept/decline)

## Home page

**Route:** `/supplier/dashboard`

The landing page shows what needs attention right now — no analytics dashboards, no vanity metrics. Pending requests (action needed), upcoming sessions, active rentals, and experience cards. Stripe onboarding alert if not connected.

## Journeys (in priority order)

1. [Handle bookings](handle-bookings.md) — the most critical daily workflow
2. [Manage calendar](manage-calendar.md) — sessions, availability, scheduling
3. [Manage experiences](manage-experiences.md) — create, edit, archive their catalog
4. [Get paid](get-paid.md) — completion, settlement, payouts
