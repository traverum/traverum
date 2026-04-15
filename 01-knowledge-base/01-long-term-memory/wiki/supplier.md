---
type: entity
created: 2026-04-15
updated: 2026-04-15
sources:
  - supplier/_overview.md
  - supplier/handle-bookings.md
  - supplier/manage-calendar.md
  - supplier/manage-experiences.md
  - supplier/get-paid.md
tags: [persona, supplier, partner, dashboard, calendar, experiences]
---

# Supplier

Tour operators, activity guides, rental companies, wine estates. Often small businesses — one person running the show. Not necessarily tech-savvy. They check email far more than any dashboard. They care about bookings coming in and getting paid.

**App:** Dashboard (`apps/dashboard`)
**Routes:** `/supplier/*`
**Database entity:** `partners` table (supplier = partner in code)

## Promise

Access to hotel guests and Veyond travelers without marketing costs. Manage everything from email — accept or decline requests with one click, no login required. Get paid reliably. The system handles payments, refunds, and scheduling.

## Success

- Responds to a [[booking]] request in under 60 seconds via email one-click
- Creates first experience in under 10 minutes
- Never misses a booking because of unclear notifications
- Gets paid within 7 days of delivering an experience
- Can manage entire business from email without logging into dashboard

## Never

- Sees [[guest]] contact info before payment/guarantee (platform bypass risk)
- Misses a [[booking]] because email was unclear
- Has money stuck — every completed booking must settle
- Needs to log in for basic operations (accept/decline)

## Home — `/supplier/dashboard`

Shows what needs attention right now. Pending requests (action needed), upcoming sessions, active rentals, experience cards. Stripe onboarding alert if not connected.

## Journey 1: Handle bookings — `/supplier/bookings`

One place for all [[guest]] interactions. URL parameter `?session=<id>` opens that session directly (from calendar or email links).

### Four tabs

1. **Requests:** Reservations with `reservation_status = 'pending'`, ordered by response deadline (most urgent first). Count badge. Card: experience title, when/who/how many, total price, deadline (urgent styling < 12h), Accept/Decline buttons.
2. **Awaiting Payment:** Approved reservations, guest hasn't paid. Count badge. Guest name visible but no contact info.
3. **Upcoming:** Confirmed bookings, session date >= today, grouped by date. Guest: name, participants, language, status, amount, email, phone (visible because paid).
4. **Past:** Session date < today or non-confirmed. Same guest info. Refund action available.

### Rental vs session request cards

| Aspect | Session request | Rental request |
|--------|----------------|----------------|
| When row | Date + time | Start date → end date (X days) |
| How many | "X person/people" | "X unit(s)" |
| Accept requires | Date + time present | Date present (no time) |

### Privacy rule

Name, participants, time, amount: always visible. Email and phone: only in Upcoming and Past (paid bookings).

## Journey 2: Manage calendar — `/supplier/sessions`

Most-used page. Supplier manages their time here.

### Views

- **Month:** Overview grid, session pills (max 3 visible, "+X more"). Click day → day view.
- **Week:** Primary. Time grid 7am-11pm, drag to reschedule (15-min snap), click slot to create.
- **Day:** Single day timeline, same interactions as week.
- **Mobile:** List view.

### Session interactions

- **Click session:** Quick-edit popup at click position (no redirect). Summary, status, booking info, price editing, cancel/delete.
- **Drag session:** Auto-saves on drop.
- **Create:** Click time slot → popup with experience dropdown, date, start/end time, optional repeat (daily/weekly), optional custom price.
- **Recurring:** Frequency + end date, preview of total sessions.

### Rental requests on calendar

Appear on start date as pending request indicators. Once accepted, no calendar presence. Accept/Decline from calendar popup.

### Visual rules

- Multi-experience: unique color per experience. Booked = solid tint, available = ghost/dashed.
- Single-experience: Booked = `bg-primary/10 text-primary`, Available = `bg-primary/5` dashed left border.
- Cancelled: muted + strikethrough. Past: dimmed. Current time: red line.
- Weeks start Monday (European convention).

## Journey 3: Manage experiences — `/supplier/experiences`

Create, edit, archive the catalog. New experiences start as `draft`. Manual save — no autosave.

### Statuses

- **Active:** Live, visible in hotel widgets
- **Draft:** In progress, not visible (default)
- **Archive:** Hidden, data preserved

### Collapsible form sections

1. **Basic Info:** Title, tags, description (min 50 chars), images, duration, meeting point, languages
2. **Location:** Address autocomplete with coordinates (required)
3. **[[Pricing]]:** Type radio group, fields adapt by type, live preview
4. **Availability:** Weekday checkboxes, start/end time, optional valid from/until
5. **Policies:** [[Cancellation]] policy selector (flexible/moderate). "Accept booking requests" toggle in Availability.

**Note:** `per_day` (rental) [[pricing]] is not yet in the form. Rental experiences created directly in the database.

## Journey 4: Get paid

Suppliers get paid after delivering experiences. System handles settlement — no manual invoicing.

### Stripe mode flow

1. Experience happens
2. Supplier confirms completion (email one-click or dashboard)
3. If no confirm within 7 days → auto-complete cron sets `completed`
4. Settlement cron reads `supplier_amount_cents`, creates Stripe Transfer
5. [[Commission]] split pre-calculated at booking creation time

### Pay-on-site mode

Monthly invoice. See [[payment-modes]] and [[commission]] for full details.

### Auto-complete protects the supplier

7-day window ensures payment even if supplier never logs in. Critical because many manage everything from email.

## Host profiles (opt-in)

Suppliers can enable a guest-facing profile: `profile_visible = true` in Settings > Host profile. Shows circular avatar, `display_name` (human name, distinct from `name` which is business name), city, and a link to detail page with bio and their experiences. Stored on `partners` table: `display_name`, `bio`, `avatar_url`, `profile_visible`, `partner_slug`.

## Related pages

- [[booking]] — Core flow
- [[pricing]] — How prices work
- [[commission]] — Revenue split
- [[payment-modes]] — Stripe vs pay-on-site settlement
- [[cancellation]] — Policies and enforcement
- [[channels]] — Hotel vs Veyond distribution
