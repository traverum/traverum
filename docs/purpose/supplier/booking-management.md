# Booking Management

## Purpose

**Route:** `/supplier/bookings`

One place for all guest interactions. Suppliers should be able to see what needs action (pending requests), what's waiting on the guest (awaiting payment), what's coming up (upcoming bookings), and what already happened (past bookings for refunds/records).

URL parameter `?session=<id>` opens that session directly — used by calendar links and email links.

## Key decisions

### Four tabs

1. **Requests:** All reservations with `reservation_status = 'pending'`, ordered by response deadline (most urgent first). Shows count badge. Each card shows experience title, when/who/how many, total price, response deadline (urgent styling when < 12h), Accept/Decline buttons.
2. **Awaiting Payment:** Approved reservations where the guest hasn't paid yet. Shows count badge. Guest name visible but no contact info.
3. **Upcoming:** Confirmed bookings with session date >= today, grouped by date. Per guest: name, participants, language, booking status, amount, email, phone (contact info visible because they've paid).
4. **Past:** Bookings with session date < today or non-confirmed status. Same guest info as upcoming. Refund action available for post-experience issues.

### Request card design

Clear information hierarchy with icons:
- **When** (Clock/Calendar): session date+time or rental date range
- **Who** (User): guest name
- **How many** (Users): people count or unit count

### Rental vs session differences

| Aspect | Session request | Rental request |
|--------|----------------|----------------|
| When row | Date + time | Start date → end date (X days) |
| How many | "X person/people" | "X unit(s)" |
| Accept requires | Date + time present | Date present (no time) |

### Decline dialog

Adapts by type. Sessions: "Decline or propose other times?" with suggestion field. Rentals: "Decline rental request?" with alternative suggestion field.

### Privacy rule

Name, participants, time, amount: always visible in all tabs. Email and phone: only shown in Upcoming and Past tabs (paid bookings). Requests and Awaiting Payment tabs show name only.

## Reference

- Booking flow: `docs/purpose/booking-flow.md`
- Cursor rule: `.cursor/rules/dashboard-ui.mdc`
- Code: `apps/dashboard/src/pages/supplier/BookingManagement.tsx`, `apps/dashboard/src/hooks/useBookingManagement.ts`
