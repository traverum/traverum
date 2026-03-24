# Track Bookings

## Goal

**Route:** `/receptionist/bookings`

Shows all bookings created by this receptionist. Lets them check status, find payment links for guests who need them again, and review booking history. This is the receptionist's "my bookings" ledger.

## For whom

Receptionists who need to follow up on bookings they created. Did the guest pay? Was the request accepted by the supplier? What's the payment link again? A guest comes back to the desk the next morning — the receptionist needs to find their booking fast.

## Key stories

- Receptionist booked for a guest yesterday, guest comes back asking about status — receptionist opens bookings, searches guest name, sees "Waiting for payment"
- Guest lost the payment email — receptionist finds the booking, copies the Stripe payment link, hands it to the guest
- Receptionist wants to see only active bookings — uses filter tabs to narrow down
- Hotel manager reviews what the front desk booked this week — opens bookings page, scans the list
- Shift handover — incoming receptionist checks bookings page to see what the previous shift booked and what needs follow-up

## Design decisions

### Filter tabs

- **All:** everything this receptionist booked
- **Active:** confirmed, awaiting payment, or request pending — things that still need attention
- **Completed:** fully completed bookings
- **Past:** expired, declined, or cancelled — no longer actionable

### Booking cards

- **Collapsed view (default):** guest name, status badge, experience title, session date and time, price, participant count
- **Expanded view (on click):** guest email (mailto link), guest phone (tel link), booking creation date
- **Payment link actions** (only for awaiting-payment bookings): "Copy Link" and "Open" buttons to retrieve the Stripe payment link

### Status mapping

Reservation and booking status are combined into a single display status:

| Condition | Display status |
|-----------|---------------|
| Booking exists, completed | Completed |
| Booking exists, cancelled | Cancelled |
| Booking exists (other) | Confirmed |
| Reservation approved, no booking yet | Waiting for payment |
| Reservation pending | Request pending |
| Reservation declined | Declined |
| Reservation expired | Expired |

### Data source

- Server-side query: `reservations` where `booked_by_user_id` matches the current authenticated user
- Joined with `experiences` (title, image) and `sessions` (date, time)
- Cross-referenced with `bookings` table for payment and completion status
- Limited to 100 most recent bookings

## References

- Page: `apps/widget/src/app/receptionist/(protected)/bookings/page.tsx`
- Booking flow: `docs/product/system/booking-flow.md`
