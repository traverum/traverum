# Email Design

All transactional emails follow the brand essence: effortlessly warm, quietly precise.

---

## Structure

Every email uses a shared `baseTemplate` wrapper. Content sits inside a `.card` on a warm ivory background. Max width 560px, centered.

```
┌─────────────────────────────────┐  ← Warm ivory (#F4EFE6)
│                                 │
│  ┌───────────────────────────┐  │  ← Card: warm white (#FEFCF9)
│  │                           │  │
│  │      Heading (center)     │  │  ← Light weight, walnut color
│  │                           │  │
│  │  Hi Name,                 │  │
│  │  Body text...             │  │
│  │                           │  │
│  │  ┌─────────────────────┐  │  │  ← Info box
│  │  │  LABEL               │  │  │  ← Small, uppercase, muted
│  │  │  Value               │  │  │  ← Medium weight, full color
│  │  │  ─────────────────── │  │  │
│  │  │  LABEL               │  │  │
│  │  │  Value               │  │  │
│  │  └─────────────────────┘  │  │
│  │                           │  │
│  │      [ Button ]           │  │  ← Olive, centered
│  │                           │  │
│  │  Muted footnote text      │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│       Powered by Traverum       │  ← Footer, very muted
│                                 │
└─────────────────────────────────┘
```

---

## Colors

Directly from brand-essence.md. No off-brand colors anywhere in emails.

| Element | Color | Hex |
|---------|-------|-----|
| Email background | Warm ivory | `#F4EFE6` |
| Card background | Warm white | `#FEFCF9` |
| Heading text | Walnut brown | `#5D4631` |
| Body text | Warm gray | `rgb(55, 53, 47)` |
| Muted text | Warm gray 45% | `rgba(55, 53, 47, 0.45)` |
| Labels (in info box) | Warm gray 40% | `rgba(55, 53, 47, 0.4)` |
| Borders | Warm gray 6% | `rgba(55, 53, 47, 0.06)` |
| Card border | Warm gray 9% | `rgba(55, 53, 47, 0.09)` |
| Info box background | Ivory tint | `rgba(244, 239, 230, 0.5)` |
| Primary button | Olive | `#5A6B4E` |
| Success button | Muted sage | `#6B8E6B` |
| Danger button | Muted terracotta | `#B8866B` |
| Secondary button | Warm gray 35% | `rgba(55, 53, 47, 0.35)` |

---

## Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| All text | Finlandica (via Google Fonts) | — | — |
| Headings | Finlandica | 300 (light) | 22px |
| Body paragraphs | Finlandica | 300 (light) | 15px |
| Info labels | Finlandica | 500 (medium) | 11px, uppercase |
| Info values | Finlandica | 500 (medium) | 15px |
| Buttons | Finlandica | 500 (medium) | 14px |
| Muted text | Finlandica | 300 (light) | 13px |
| Footer | Finlandica | — | 12px |

**Font loading:** Loaded via `@import url()` from Google Fonts with weights 300 and 500. Email clients that don't support web fonts fall back to: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif.

---

## Info Row Layout

Labels stack above values, not side by side. This was a deliberate fix — the previous flexbox side-by-side layout didn't render in most email clients, causing labels and values to mash together with no separation.

```
EXPERIENCE                    ← 11px, uppercase, letter-spaced, muted
Test-009_traverum-hotel       ← 15px, medium weight, full color
───────────────────────
START DATE
Saturday, 21 February 2026
───────────────────────
TOTAL TO PAY
120,00 €
```

**Why stacked:** Works reliably across all email clients (no flexbox dependency). Reads well on mobile. Handles long values (experience titles, addresses) without breaking layout.

---

## Buttons

- All button text is white with `style="color: white;"` set inline on the `<a>` tag
- This inline style is required because email clients (Gmail, Outlook) override `<a>` colors to blue, ignoring CSS class rules
- Button corners: 4px radius
- Padding: 12px 28px

**Button types and when to use them:**

| Type | Color | Use case |
|------|-------|----------|
| Primary (olive) | `#5A6B4E` | Main action: pay, try again, view sessions |
| Success (sage) | `#6B8E6B` | Positive confirmation: accept request, confirm experience happened |
| Danger (terracotta) | `#B8866B` | Negative action: decline request, report experience didn't happen |
| Secondary (gray) | `rgba(55, 53, 47, 0.35)` | Low-priority action: cancel booking |

---

## Tone

From brand-essence.md — confident but quiet. Short, warm sentences. No corporate jargon. No emojis.

- "Great news! Your booking request has been approved." — warm, direct
- "Unfortunately, the experience provider was unable to accept your booking request." — honest, not cold
- "We hope to see you again soon!" — human, not formulaic

---

## Email Templates

All templates live in `apps/widget/src/lib/email/templates.ts`. Cron job emails (expire-unpaid, expire-reservations, auto-complete) also use the shared `baseTemplate`.

### Guest emails

| Template | Subject line pattern | When sent |
|----------|---------------------|-----------|
| `guestRequestReceived` | Request received | Guest submits a request-based booking |
| `guestBookingApproved` | Booking approved | Supplier accepts the request |
| `guestRequestDeclined` | Booking unavailable | Supplier declines the request |
| `guestPaymentConfirmed` | Booking confirmed | Guest completes payment |
| `guestInstantBooking` | Complete your booking | Guest books a session (instant, needs payment) |
| `guestPaymentFailed` | Payment failed | Payment attempt fails |
| `guestRefundProcessed` | Refund processed | Refund issued to guest |
| (cron) Request expired | Booking request expired | Supplier didn't respond within 48h |
| (cron) Payment window closed | Payment window closed | Guest didn't pay within deadline |

### Supplier emails

| Template | Subject line pattern | When sent |
|----------|---------------------|-----------|
| `supplierNewBooking` | New booking pending payment | Guest books a session (instant) |
| `supplierNewRequest` | New booking/rental request | Guest submits a request |
| `supplierBookingConfirmed` | Payment received | Guest completes payment |
| `supplierCompletionCheck` | Did the experience happen? | Day after experience date |
| `supplierPayoutSent` | Payment sent | Payout initiated to supplier |
| (cron) Payment not completed | Guest did not complete payment | Guest didn't pay within deadline |
| (cron) Payment transferred | Payment transferred | Auto-completed after 7 days with no response |

### Admin emails

| Template | Subject line pattern | When sent |
|----------|---------------------|-----------|
| `adminAccountStatusChanged` | Stripe account update | Partner Stripe account status changes |

---

## What to Avoid

- Cold white (`#FFFFFF`) backgrounds
- Bright or saturated accent colors
- Default blue link colors on buttons (always inline `style="color: white;"`)
- Flexbox for layout (use block-level stacking)
- Emojis anywhere
- Superlatives or aggressive copy
- Corporate jargon
