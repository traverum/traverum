---
type: concept
created: 2026-04-15
updated: 2026-04-15
sources:
  - system/booking-flow.md
tags: [payment, stripe, pay-on-site, settlement, card-guarantee]
---

# Payment Modes

Configured per supplier. Determines how money moves — does not affect the [[booking]] path or [[commission]] percentages.

## Stripe (pay upfront) — default

Guest pays the full experience price through Stripe before the experience.

### Money flow

1. Guest pays → money to Traverum's Stripe platform balance
2. Experience happens → supplier confirms completion (or auto-complete after 7 days)
3. Settlement cron transfers `supplier_amount_cents` to supplier's Stripe Connected Account
4. [[Commission]] stays in Traverum's balance (+ hotel share transferred if applicable)

### Privacy rule

Guest contact info (email, phone) hidden from supplier **until payment is confirmed**. Payment is the trust anchor.

### [[Cancellation]] economics

| Scenario | Guest refund | Supplier payment |
|----------|-------------|-----------------|
| Guest cancels within policy window | Full refund | Nothing |
| Guest cancels outside policy window | No refund | Full payment |
| Supplier cancels | Full refund | Nothing |

### Requirements

- Supplier must have an active Stripe Connected Account
- Must complete Stripe Connect onboarding before receiving bookings

## Reserve & Pay on Site

Guest reserves without paying. Pays supplier directly after the experience. Configured via `payment_mode = 'pay_on_site'`.

### Why it exists

Stripe Connect onboarding is friction for small providers. Many prefer cash, card terminal, or bank transfer. Removing Stripe as a prerequisite lowers the barrier. New partners default to `pay_on_site` — only flips to `stripe` after completing Stripe Connect onboarding.

### Happy path

1. Guest browses and selects an experience
2. Guest enters details, provides card via **Stripe Setup Intent** (no charge, no hold), agrees to [[cancellation]] policy
3. Reservation created. Contact info revealed to supplier.
4. Guest attends and pays supplier on site
5. Supplier marks "completed"
6. 1st of each month: Traverum sends supplier a [[commission]] invoice

### Card guarantee

Stripe Setup Intent saves the guest's PaymentMethod to a Stripe Customer. No charge, no hold, no authorization. If Traverum needs to charge a [[cancellation]] fee, it creates an off-session PaymentIntent using the saved PaymentMethod.

Why not a card hold? Authorization holds expire in 5-7 days. Guests book weeks in advance. Setup Intent has no expiry.

### Privacy rule

Guest contact info revealed **after card guarantee is set up**. The saved card replaces payment as the trust anchor — guest has committed financial accountability via the cancellation policy agreement.

### [[Cancellation]] enforcement

| Scenario | What happens |
|----------|-------------|
| Guest cancels within policy window | Card never charged |
| Guest cancels outside policy window | Card charged full price |
| Guest no-shows | Card charged full price |
| Supplier cancels | No charge, no [[commission]] owed |

When a cancellation fee is charged: Traverum charges as a platform charge (no Connect), same [[commission]] split applies, supplier's share credited on monthly invoice.

### Attendance verification

Prevents suppliers from falsely claiming no-shows:
1. Supplier marks no-show
2. System emails guest: "Did you attend?"
3. Guest has 3 days to respond (reminder at day 2)
4. Guest confirms attendance → override → booking `completed` → [[commission]] applies
5. Guest confirms no-show or no response → accept claim → no [[commission]]
6. Repeated overrides flagged for review

### Monthly [[commission]] invoicing

1. Cron runs 1st of each month
2. Aggregates `completed` bookings from previous month where `payment_mode = 'pay_on_site'`
3. Calculates total [[commission]] owed
4. Nets cancellation fee credits (supplier's share subtracted from commission)
5. Sends invoice; supplier pays net amount via bank transfer

### Requirements

- Supplier does NOT need a Stripe Connected Account
- Traverum needs Stripe for Setup Intents and off-session charges
- Supplier must have bank details for invoice payment

## `payment_mode` denormalization

`bookings.payment_mode` is denormalized from `partners.payment_mode` at creation time. Lets crons and invoice queries filter without joining partners.

## Related pages

- [[booking]] — Full booking flow
- [[commission]] — Split logic
- [[cancellation]] — Policies and windows
