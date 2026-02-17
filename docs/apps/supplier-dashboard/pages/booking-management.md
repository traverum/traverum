Reviewed by Elias

---

# Booking Management

**Route:** `/supplier/bookings` (was `/supplier/requests`)

**Purpose:** One place for all guest interactions: pending requests, upcoming and past sessions, refunds, propose new times.

**Tabs:** Pending Requests | Upcoming Sessions | Past Sessions. URL `?session=<id>` opens that session (e.g. from calendar).

---

## Pending Requests Tab

Shows all reservations with `reservation_status = 'pending'`, ordered by response deadline (most urgent first).

### Request Card Design

Each pending request card has a clear information hierarchy:

**Header:** Experience title (prominent, semibold)

**Info rows** (with icons):
- **When** (Clock/Calendar icon):
  - Sessions: "Mon 20 Feb at 14:00"
  - Rentals: "Mon 20 Feb → Wed 22 Feb (3 days)"
- **Who** (User icon): Guest name
- **How many** (Users icon):
  - Sessions: "3 people"
  - Rentals: "2 units"

**Footer** (separated by border):
- Total price (semibold)
- Response deadline: "Respond by 18.2 14:30" (urgent styling when < 12h remaining)
- Accept / Decline buttons

**Decline dialog** adapts for experience type:
- Sessions: "Decline or propose other times?" with placeholder "We have availability on Thursday at 10:00..."
- Rentals: "Decline rental request?" with placeholder "We only have 2 units available for those dates..."

### Rental vs Session Differences

| Aspect | Session Request | Rental Request |
|--------|----------------|----------------|
| When row | Date + time | Start date → end date (X days) |
| When icon | Clock | Calendar |
| How many | "X person/people" | "X unit(s)" |
| Accept requires | Date + time present | Date present (no time) |
| No date message | "No specific time — decline to suggest alternatives" | "No rental dates specified — decline to suggest alternatives" |

---

## Upcoming Sessions Tab

By date; expand to see guest details. Per session: date, time, experience, status (available/booked/cancelled). Per guest: name, participants, language, booking status, amount; email/phone only for paid (confirmed/completed). Actions: Copy all emails (paid only), Cancel session (refunds + confirm).

## Past Sessions Tab

Same guest list; refund/payout status. Refunding here too for cases where experience happened but the guest was not happy at all.

---

**Privacy:** Name, participants, time, amount always visible. Email/phone only after payment. Copy emails only includes paid guests.
