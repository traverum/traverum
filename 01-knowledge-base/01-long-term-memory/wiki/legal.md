---
type: concept
created: 2026-04-15
updated: 2026-04-15
sources:
  - terms-and-conditions.md
  - privacy-policy.md
tags: [legal, terms, privacy, gdpr, intermediary]
---

# Legal

Key points from T&Cs and privacy policy that affect product behavior. Not a full legal summary — just what a coding agent needs.

## Corporate identity

**Traverum Oy** — Finnish company, data controller under GDPR. Operates the **Veyond** brand. Contact: support@traverum.com, privacy@traverum.com.

## Traverum is an intermediary

Traverum is **not** the provider of experiences. The contract for the experience is between [[guest]] and [[supplier|Experience Provider]]. Traverum facilitates discovery, [[booking]], and payment processing. This intermediary status is legally critical and must be communicated clearly.

### Checkout acceptance text

Passive acceptance (no checkbox) near submit button. Must include:
- Links to Terms and Privacy Policy (open in new tab)
- **Experience Provider's name** (EU Consumer Rights Directive requires trader identity disclosure before contract)
- Different wording for session-based ("Book Now") vs request-based ("Send Request")

### Distribution Partner (hotel) role

[[Hotel|Hotels]] are distribution channels only. Not party to the experience contract. Don't vet or endorse experiences. Guest contact details (name, email, phone) are **not shared** with hotels — only booking notification with experience name, date, and value for [[commission]] tracking.

## Data handling rules

### What we collect from guests

Name, email, phone (at checkout), booking details, IP (temporary, for rate limiting). **We do NOT collect:** passport data, DOB, social media profiles, device location, special category data.

### Contact info sharing

- **Stripe mode:** guest contact info shared with [[supplier]] only **after payment confirmed**
- **Pay-on-site mode:** shared **after card guarantee** (Setup Intent confirmed)
- **Never shared with [[hotel|hotels]]**

### Data processors

| Service | Role | Data |
|---------|------|------|
| Stripe | Independent controller | Payment card data |
| Resend | Processor | Email address, content |
| Supabase | Processor (EU) | All platform data |
| Vercel | Processor | Server logs, IP |
| Upstash (Vercel KV) | Processor | Hashed IPs (temporary) |

### Retention

| Data | Period |
|------|--------|
| Booking records | 3 years after experience date |
| Financial records | 7 years (Finnish accounting law) |
| Expired/declined reservations | 6 months |
| Rate limiting data | Seconds to minutes |
| Partner accounts | Relationship duration + 3 years |

### Cookies

Only **strictly necessary** cookies (`sb-*` for Supabase Auth, dashboard users only). No analytics, no tracking, no advertising. No consent banner required. The widget in Shadow DOM sets no cookies on the hotel's site.

## [[Cancellation]] policies in T&Cs

| Policy | Window |
|--------|--------|
| Flexible | 24h before |
| Moderate | 7 days before |
| Strict | No refund after confirmation |
| Non-refundable | No refunds ever |

Note: product currently implements Flexible and Moderate only. Strict and Non-refundable are in the T&Cs but not yet in the product.

Supplier cancellations always = full refund (industry standard, not configurable).

## Implementation notes

- Terms page at `/terms`, Privacy at `/privacy` — public, no auth, clean layout, last-updated date
- Log Terms version + `terms_accepted_at` on reservations for audit trail
- Provider name must be visible on checkout page before acceptance
- Email footer should reference Terms: "This booking is subject to Traverum's Terms & Conditions. The experience is provided by {Provider Name}."
- Minimum age: 18 to make a booking
- All transactions in EUR
- Governing law: Finland, Helsinki courts

## Related pages

- [[booking]] — Flow that generates the contract
- [[payment-modes]] — When contact info is shared
- [[cancellation]] — Policy enforcement
- [[channels]] — Hotel widget vs direct (affects data sharing)
- [[guest]] — Checkout journey where acceptance happens
