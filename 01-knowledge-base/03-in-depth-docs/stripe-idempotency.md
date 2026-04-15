# Stripe Idempotent Requests

Source: https://docs.stripe.com/api/idempotent_requests

Safely retry Stripe API requests without accidentally performing the same operation twice.

## How it works

- All `POST` requests accept an `Idempotency-Key` header
- Stripe saves the resulting status code and body of the **first** request for any given key
- Subsequent requests with the same key return the same result (including `500` errors)
- Keys expire after **24 hours** — a new request is generated if a key is reused after pruning
- If incoming parameters don't match the original request, Stripe returns an error
- `GET` and `DELETE` requests are idempotent by definition — don't send keys for those

## Key format

Keys are up to 255 characters. Use a deterministic format tied to the business entity:

```typescript
// Pattern: {entity}_{id}_{operation}
const idempotencyKey = `setup_${reservationId}`           // SetupIntent creation
const idempotencyKey = `customer_${reservationId}`        // Customer creation
const idempotencyKey = `charge_${bookingId}_cancellation` // Cancellation charge
const idempotencyKey = `charge_${bookingId}_no_show`      // No-show charge
```

Using entity IDs (not random UUIDs) ensures that retrying the same logical operation uses the same key, even across different code paths or server restarts.

## Usage in Node.js

```typescript
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Customer creation
const customer = await stripe.customers.create(
  { email: guestEmail, name: guestName },
  { idempotencyKey: `customer_${reservationId}` }
)

// SetupIntent creation
const setupIntent = await stripe.setupIntents.create(
  { customer: customer.id, usage: 'off_session', metadata: { reservationId } },
  { idempotencyKey: `setup_${reservationId}` }
)

// Off-session charge
const paymentIntent = await stripe.paymentIntents.create(
  {
    amount: amountCents,
    currency: 'eur',
    customer: customerId,
    payment_method: paymentMethodId,
    off_session: true,
    confirm: true,
    metadata: { bookingId, reason: 'cancellation_fee' },
  },
  { idempotencyKey: `charge_${bookingId}_cancellation` }
)
```

## When retries are safe

Stripe's idempotency layer only saves results after endpoint execution begins. These cases are safe to retry (no idempotent result is cached):

- Incoming parameters fail validation
- Request conflicts with a concurrent request

## When NOT to use the same key

- **Different operations** on the same entity — use different key suffixes
- **Parameter changes** — Stripe will error if you reuse a key with different parameters

## Traverum-specific key conventions

| Operation | Key pattern | Example |
|---|---|---|
| Create customer for reservation | `customer_{reservationId}` | `customer_abc123` |
| Create SetupIntent for reservation | `setup_{reservationId}` | `setup_abc123` |
| Cancellation fee charge | `charge_{bookingId}_cancellation` | `charge_def456_cancellation` |
| No-show charge | `charge_{bookingId}_no_show` | `charge_def456_no_show` |
| Transfer to connected account | `transfer_{bookingId}_{type}` | `transfer_def456_supplier` |
