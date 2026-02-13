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

## URL Parameters

| Param | Required | Description |
|-------|----------|-------------|
| `experienceId` | Yes | Experience UUID |
| `participants` | Yes | Number of participants |
| `total` | Yes | Total price in cents |
| `sessionId` | No | Session UUID (session-based) |
| `isRequest` | No | "true" for custom requests |
| `requestDate` | No | YYYY-MM-DD for custom date |
| `requestTime` | No | HH:MM for custom time |

Missing required params → redirect back to hotel experience list.

**Demo mode:** For `hotel-traverum`, shows success animation without API call.
