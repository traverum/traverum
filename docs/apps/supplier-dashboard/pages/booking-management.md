Reviewed by Elias

---

# Booking Management

**Route:** `/supplier/bookings` (was `/supplier/requests`)

**Purpose:** One place for all guest interactions: pending requests, upcoming and past sessions, refunds, propose new times.

**Tabs:** Pending Requests | Upcoming Sessions | Past Sessions. URL `?session=<id>` opens that session (e.g. from calendar).

- **Pending Requests:** Reservations `pending`.
- **Upcoming Sessions:** By date; expand to see guests. Per session: date, time, experience, status (available/full/cancelled), bookings/spots. Per guest: name, participants, language, booking status, amount; email/phone only for paid (confirmed/completed). Actions: Copy all emails (paid only), Cancel session (refunds + confirm).
- **Past Sessions:** Same guest list; refund/payout status. Refunding here too for cases where experiecne happened but the guest was not happy at all.

**Privacy:** Name, participants, time, amount always visible. Email/phone only after payment. Copy emails only includes paid guests.
