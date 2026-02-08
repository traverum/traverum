Updated by Elias on 07-02-2026

# Checkout Page

## What & Why

**WHAT:** Guest details form + booking summary. Last step before payment or request submission.

**WHY:** We need guest name, email, phone to create the reservation and communicate about the booking.

**Route:** `/{hotelSlug}/checkout?experienceId=...&participants=...&total=...`

---

## Page Layout

Two-column on desktop, single column on mobile:
- **Left (3/5):** Guest details form
- **Right (2/5):** Booking summary card (sticky)

---

## Guest Details Form

**Fields:**
- First name (required)
- Last name (required)
- Email (required, validated)
- Phone number (required, min 6 chars)

**Validation:** Zod schema with react-hook-form. Errors shown inline below fields.

**Submit Button:**
- Session booking: "Book Now"
- Custom request: "Send Request"
- Loading state: "Processing..." / "Sending..."

**After submit:**
- **Session booking:** Redirect to Stripe Checkout (external redirect via `window.location.href`)
- **Custom request:** Redirect to reservation status page (`/reservation/{id}`)

**Legal text below button:**
- Session: "By booking, you agree to our terms... You'll be redirected to complete payment securely."
- Request: "By submitting, you agree to our terms... You won't be charged until the provider accepts."

---

## Booking Summary Card (right column)

- Cover image (16:9)
- Experience title + duration
- Date + time (or "Not selected")
- Participants count
- "Custom Request" badge (if request-based)
- Total price (accent color, bold)
- Notice for custom requests: "This is a custom request. The provider will confirm if this time is available."

---

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

---

## Demo Mode

For `hotel-traverum`: shows success overlay animation without making API call. Simulates 800ms delay for realism.

---

## What's NOT Here

- No account creation / login
- No promo codes or discounts
- No terms of service page (just text reference)
- No payment method selection (handled by Stripe)
