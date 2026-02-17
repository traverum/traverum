# Checkout

**Route:** `/{hotelSlug}/checkout?experienceId=...&participants=...&total=...`

**Purpose:** Guest details form + booking summary. Last step before payment or request submission.

**Layout:** Two-column on desktop (form left, summary right), single column on mobile.

## Guest Details Form

- Fields: first name, last name, email, phone (all required). Zod + react-hook-form validation.
- Session booking: "Book Now" → redirects to Stripe Checkout
- Custom request: "Send Request" → redirects to reservation status page

## Booking Summary Card

- Cover image, experience title, duration, date/time, participants, total price
- "Custom Request" badge and notice if request-based
- **Rental summary**: Shows "Start date", "Duration: X days", "Quantity: Y" instead of date/time/participants

## URL Parameters

| Param | Required | Description |
|-------|----------|-------------|
| `experienceId` | Yes | Experience UUID |
| `participants` | Yes | Number of participants (or quantity for rentals) |
| `total` | Yes | Total price in cents |
| `sessionId` | No | Session UUID (session-based) |
| `isRequest` | No | "true" for custom requests and rentals |
| `requestDate` | No | YYYY-MM-DD for custom date or rental start date |
| `requestTime` | No | HH:MM for custom time (not used for rentals) |
| `rentalDays` | No | Number of rental days (rental only) |
| `quantity` | No | Number of units (rental only, maps to participants) |

Missing required params → redirect back to hotel experience list.

**Demo mode:** For `hotel-traverum`, shows success animation without API call.
