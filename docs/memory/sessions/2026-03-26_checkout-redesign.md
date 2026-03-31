# 2026-03-26_checkout-redesign

## Goal
Redesign the checkout page to remove hesitation. Nordic reliability, not vibe-coded. Concierge handing a card, not a street vendor.

## Done
- Structured cancellation terms (3 bullet points replacing paragraph blob)
- Simplified policy checkbox copy (35 words → 13)
- Reordered form: card guarantee before company/invoice fields
- Mobile summary ordering (summary first on mobile, form first on desktop)
- Flow-aware page title ("Reserve Your Spot" / "Complete Your Request" / "Complete Your Booking")
- "Your details" heading replacing "Guest Details"
- Pay-on-site info moved to summary sidebar (right column, next to price)
- Removed duplicate back buttons (header back is enough in full embed mode)
- Removed country-specific placeholders (Finnish phone, generic email)
- Removed em dashes from guest-facing copy (periods + colons)
- Date format changed globally: `27 Mar` instead of `27.03`
- Time display as range: `15:00–17:00` instead of standalone time + duration
- Stripe `colorDanger` matched to warm palette (`#B8866B` terracotta)
- `getCancellationPolicyExperienceIntro` used instead of `getCancellationPolicyText` on checkout (avoids redundant "Full refund if cancelled by provider" sentence)

## Decisions
- **Date format globally changed** from numeric `dd.MM` to `27 Mar` — product-context.md updated
- **No trust badges or security theater** — the hotel is the trust
- **Em dashes banned** from guest-facing copy — cleaner across European languages
- **Payment info belongs with the price** — right sidebar, not the form

## Files Changed
- `apps/widget/src/components/CheckoutForm.tsx`
- `apps/widget/src/components/CardGuaranteeSection.tsx`
- `apps/widget/src/components/BookingSummary.tsx`
- `apps/widget/src/components/TranslatedBookingSummary.tsx`
- `apps/widget/src/components/Header.tsx`
- `apps/widget/src/components/VeyondHeader.tsx`
- `apps/widget/src/app/[hotelSlug]/checkout/page.tsx`
- `apps/widget/src/app/experiences/checkout/page.tsx`
- `apps/widget/src/lib/stripe-client.ts`
- `apps/widget/src/lib/utils.ts` (formatDate, formatTimeRange)
- `apps/widget/src/lib/utils.test.ts`

## Open Items
- [ ] Verify date format change doesn't break other pages that use `formatDate` (confirmation, reservation, receptionist bookings, demo overlay)
- [ ] Consider translating month abbreviations for non-English guests

## Notes
- `formatDate` is used in ~14 files across the widget — all now show `27 Mar` format. No code changes needed in consuming files since the function signature is unchanged.
- `formatTimeRange` is a new utility, currently only used in BookingSummary.
