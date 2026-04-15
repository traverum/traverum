---
type: concept
created: 2026-04-15
updated: 2026-04-15
sources:
  - design/brand-essence.md
  - design/dashboard-design.md
  - design/dashboard-planning-framework.md
  - design/email-design.md
  - system/communication.md
tags: [design, brand, ui, dashboard, email, colors, typography]
---

# Design System

Nordic clarity meets Italian elegance. Everything warm, nothing unnecessary.

## Core principles

1. **Nothing unnecessary, everything functional.** Remove what doesn't serve a function. Hide complexity until needed.
2. **Visual over text.** Badges, icons, colors communicate state before text. Text appears only when essential or on hover.
3. **Warmth, never coldness.** Warm ivory, olive accent, natural depth. Mediterranean, not sterile.
4. **Icons only.** Lucide (`lucide-react`) for all icons. No emojis, ever.
5. **Never show the same thing twice.** No badge saying "active" if there's already a green status signal.

## Color palette

Every color is warm and muted. No bright, saturated accents. Olive is the Traverum color.

| Role | Color | Hex |
|------|-------|-----|
| Background (brand) | Warm ivory | `#F4EFE6` |
| Background (app) | Warm white | `#FEFCF9` |
| Primary | Olive green | `#5A6B4E` |
| Depth | Walnut brown | `#5D4631` |
| Neutral | Warm slate | `#6B7280` |
| Success | Muted sage | `#6B8E6B` |
| Warning | Muted gold | `#C9A961` |
| Error | Muted terracotta | `#B8866B` |
| Info | Muted blue-gray | `#7A9CC6` |
| Text | Warm gray | `rgb(55, 53, 47)` |
| Text muted | | `rgba(55, 53, 47, 0.4)` |
| Borders | | `rgba(55, 53, 47, 0.09)` |

## Typography

**Font:** DM Sans — geometric clarity with optical warmth.

| Context | Weight |
|---------|--------|
| Headlines | 300 (light) |
| Body | 300 (light) |
| Labels / emphasis | 500 (medium) |

## Dashboard UI

### Unified surface

Everything on the same background. No color separation — borders handle distinction (Notion-style). Cards, sidebar, header all `bg-background`.

**Exception:** Modals use shadows for elevation.

### 8px grid

All spacing in multiples of 8px. Half-steps (4px) for fine-tuning only. No arbitrary values.

```
gap-2 (8px)    — Small gaps between related items
gap-3 (12px)   — Medium gaps (card grids)
gap-4 (16px)   — Standard gaps (form fields, sections)
p-3 (12px)     — Compact padding
p-4 (16px)     — Standard padding
px-4 py-6      — Container padding
```

### Border system

Notion-style. Subtle, warm, consistent.

| Element | Class |
|---------|-------|
| Cards | `border border-border` |
| Dividers | `border-t border-border` |
| Sidebar | `border-r border-border` |
| Header | `border-b border-border` |

### Border radius scale

| Size | Token | Usage |
|------|-------|-------|
| 3px | `rounded-sm` | Buttons, inputs |
| 4px | `rounded` | Cards, containers |
| 6px | `rounded-md` | Floating elements |
| 8px | `rounded-lg` | Modals |
| Full | `rounded-full` | Status dots, pills |

### Components

**Buttons:** `h-7` default, `h-8` large, `px-3 py-1`, `rounded-sm`, color transition only (no scale), `transition-ui` (20ms ease-in).

**Inputs:** `h-8` standard, `h-9` select, borderless, `bg-[rgba(242,241,238,0.6)]`, `rounded-sm`, focus ring.

**Cards:** `p-3`/`p-4`, `border border-border`, no shadow, `bg-card`, `hover:bg-accent/50`.

**Status dots:** `w-2 h-2 rounded-full` with semantic color.

**Empty states:** Text only, no icons, no subtitles. `p-6 text-center text-sm text-muted-foreground`.

### Transitions

| Context | Duration |
|---------|----------|
| UI feedback (buttons, hovers) | 20ms ease-in |
| State changes (modals, drawers) | 150ms ease |
| Page transitions | 300ms ease-in-out |

### Text rules

- Badge with number over written-out count
- Color coding over status labels
- Hover tooltip over always-visible helper text
- Visual hierarchy over more words

## Pre-design framework

Before building a feature, run through:

1. **JTBD:** "When [situation], I want to [motivation], so I can [outcome]." Stay in problem-space.
2. **Core need:** Functional (relevance, speed, clarity) + psychological (trust, confidence, control).
3. **AI vs traditional UI:** Conversational for exploratory tasks, traditional for structured/repeatable tasks.
4. **RICE score:** (Reach x Impact x Confidence) / Effort. High → build. Low → park or simplify.

## Email design

All transactional emails follow the brand. `baseTemplate` wrapper, content in a `.card` on warm ivory, max 560px centered.

### Email constraints

- **Inline CSS only** — email clients strip `<style>` blocks
- **Button text:** always `style="color: white;"` — Gmail/Outlook override `<a>` to blue
- **Stacked info layout** — labels above values, no flexbox (breaks in email clients)
- **Action links:** HMAC-signed with expiry, idempotent (clicking Accept twice shows "Already accepted")
- **`escapeHtml()`** for all user-provided content
- **No emojis, no gradients, no flexbox**

### Email colors

| Element | Color |
|---------|-------|
| Background | Warm ivory `#F4EFE6` |
| Card | Warm white `#FEFCF9` |
| Heading | Walnut `#5D4631` |
| Body | `rgb(55, 53, 47)` |
| Primary button | Olive `#5A6B4E` |
| Success button | Sage `#6B8E6B` |
| Danger button | Terracotta `#B8866B` |

### Email typography

All DM Sans via Google Fonts import. Headings: 22px light. Body: 15px light. Labels: 11px medium uppercase. Buttons: 14px medium.

### Email tone

Warm, direct, no jargon, no emojis. "Great news! Your booking request has been approved." — warm, direct. "Unfortunately, the experience provider was unable to accept..." — honest, not cold.

### Email templates

All in `apps/widget/src/lib/email/templates.ts`. Cron emails also use `baseTemplate`.

**[[Guest]] emails:** request received, booking approved, request declined, payment confirmed, instant booking, payment failed, refund processed, request expired, payment window closed.

**[[Supplier]] emails:** new booking pending, new request, payment received, completion check, payout sent, payment not completed, payment transferred (auto-complete).

## What to avoid (consolidated)

- Cold white backgrounds
- Bright saturated colors
- Shadows for card distinction (use borders)
- Different background colors for areas (unified surface)
- Gradients
- Emojis (Lucide icons only)
- Always-visible helper text (use hover tooltips)
- Flexbox in emails
- Equal button padding (use 1.5:1 ratio)
- Aggressive copy or superlatives
- Italian cliches (flags, columns, "Ciao!")

## Related pages

- [[overview]] — Brand context
- [[guest]] — Guest-facing widget UI
- [[supplier]] — Dashboard UI for suppliers
- [[receptionist]] — Concierge interface
- [[product-rules]] — Product-level constraints
