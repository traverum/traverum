---
type: concept
created: 2026-04-15
updated: 2026-04-15
sources:
  - system/booking-flow.md
  - system/channels.md
  - supplier/get-paid.md
tags: [commission, revenue, split, settlement, invoice]
---

# Commission

Every [[booking]] flow ends in a commission split. This is the business model.

## Channel determines the split

| Channel | Split | Default percentages |
|---------|-------|-------------------|
| Hotel ([[channels\|widget]]) | Three-way | Supplier 80% / Hotel 12% / Platform 8% |
| Veyond ([[channels\|direct]]) | Two-way | Supplier 92% / Platform 8% |

- Hotel channel: configurable per experience-hotel pair via the `distributions` table
- Direct channel: uses `SELF_OWNED_COMMISSION` constant from `@traverum/shared`
- Percentages are identical regardless of [[payment-modes|payment mode]]. Only the collection method differs.

## Rounding rules

- All amounts in integer cents (`_cents` suffix)
- `Math.round()` for all three amounts — never `Math.floor()`
- Rounding remainder always assigned to **platform amount** so the sum equals the total
- `Math.floor` systematically loses cents over thousands of bookings

## Collection by payment mode

### Stripe mode

1. Guest pays → money in Traverum's Stripe platform balance
2. Supplier confirms completion (or auto-complete after 7 days)
3. Settlement cron transfers `supplier_amount_cents` to supplier's Connected Account
4. Hotel share transferred if applicable
5. Platform share stays in balance

### Pay-on-site mode

Traverum never handles the experience payment. Commission collected via monthly invoice:

1. Cron on 1st of each month
2. Aggregates completed bookings from previous month
3. Nets [[cancellation]] fee credits against commission owed
4. Supplier pays net amount via bank transfer

**Invoice netting example:**
```
Completed experiences (guest paid on-site):
  12 bookings, total guest revenue:          4.200,00 €
  Commission owed (platform + hotel):          516,00 €

Cancellation fees collected by Traverum:
  2 late cancellations charged:                380,00 €
  Supplier's share (credited):                -349,60 €

Net amount owed by supplier:                   166,40 €
```

## Related pages

- [[booking]] — Flow that generates commission
- [[payment-modes]] — How money moves
- [[channels]] — Determines two-way vs three-way split
- [[pricing]] — How experience prices are calculated
