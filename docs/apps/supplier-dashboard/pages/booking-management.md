
Updated by Elias on 07-02-2026

# Booking Management

## What & Why

**WHAT:** Unified page for managing all guest interactions: pending requests, upcoming session guests, past session history, refunds, and proposing new times.

**WHY:** Suppliers need one place to handle all guest-related actions. Replaces the old "Pending Requests" page. Session-oriented layout makes it easy to manage guests per session.

**Route:** `/supplier/bookings` (was `/supplier/requests`)

---

## Page Structure

**3 tabs:**

```
[ Pending Requests (3) ] [ Upcoming Sessions ] [ Past Sessions ]
```

**Session filter:** URL param `?session=<id>` auto-selects and expands that session (linked from calendar popup).

---

## Tab 1: Pending Requests

Shows all reservations with status `pending` or `proposed`.

**Each request card shows:**
- Guest name
- Experience title
- Participants count + total price
- Preferred language (flag + name)
- Requested date/time (or session date/time if session-based)
- Response deadline countdown
- Urgency badge if < 12h remaining

**Actions per request:**
- **Accept** button
- **Decline** button
- **Propose New Time** button (opens inline form below the card)

**Propose New Time form (dashboard-only action):**
- Slot 1: date picker + time picker (required)
- "+ Add another option" link (up to 3 slots, each with remove button)
- Submit → dashboard updates Supabase directly (authenticated via Supabase auth), triggers guest email via server function, status → `proposed`
- No email-based propose action. Supplier email for new requests includes a "Propose a different time" link pointing to this page.

**Proposed requests** (status `proposed`) show differently:
- "Awaiting guest response" label
- Listed proposed times (e.g. "16/03 at 10:00, 17/03 at 14:00")
- No action buttons (waiting for guest)

---

## Tab 2: Upcoming Sessions

Sessions where `session_date >= today`, grouped by date. Each session expandable.

**Session header shows:**
- Date, time, experience name
- Status badge (available / full / cancelled)
- Bookings count / total spots

**Expanded session shows guest list:**
- Guest name (always visible)
- Participants + language
- Booking status badge (Paid, Confirmed, Approved, etc.)
- **Email + phone** only visible for paid guests (`booking_status` in `confirmed`, `completed`)
- Booking amount

**Actions per session:**
- **Copy all emails** button (only gathers emails from paid guests)
- **Cancel Session** button (triggers refunds for all confirmed bookings, with confirmation dialog)

---

## Tab 3: Past Sessions

Sessions where `session_date < today`. Same guest list view as Upcoming.

**Additional info per booking:**
- Refund status (refunded / completed / no-show)
- Payout status

**Read-only** -- no cancel/modify actions.

---

## Privacy Rules

| Information | Visible When |
|---|---|
| Guest name | Always |
| Guest email | Only after payment |
| Guest phone | Only after payment |
| Participants | Always |
| Requested date/time | Always |
| Booking amount | Always |
| Refund status | After booking exists |

Pending/approved requests: name + participants + time. No email/phone.
Confirmed (paid): full details including email/phone.
"Copy all emails" only gathers from paid guests.
