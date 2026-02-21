# Traverum — Documentation Index

## How this documentation system works

### Three layers

1. **Purpose docs** (`docs/purpose/`) — Human-owned. What each part of the product must accomplish and the key decisions behind it. Written in plain English. The AI reads these before editing related code and never modifies the Purpose section without asking.

2. **Cursor rules** (`.cursor/rules/*.mdc`) — Auto-injected by the AI based on file patterns. Technical patterns, formatting rules, code conventions. These implement the purpose docs.

3. **Technical docs** (`docs/technical/`) — Full reference specs for deep implementation work. The AI reads these when building complex features. Humans rarely need to read them.

### The AI contract

- Before editing a page or system, the AI checks for a matching purpose doc and reads it.
- The **Purpose** section is human-owned — never modified without explicit approval.
- **Key decisions** can be updated as implementation evolves, but changes that contradict the Purpose are flagged.
- Changes that affect the two north stars (vision + booking flow) trigger a stop-and-ask.

---

## Purpose Docs (`docs/purpose/`)

### North stars — the things that matter most

| Doc | What it covers |
|-----|----------------|
| `vision.md` | Why Traverum exists. Three-party ecosystem. Core promise. |
| `booking-flow.md` | The booking lifecycle. Two flows, timing windows, privacy, commission. |
| `pricing.md` | Four pricing models. Cents storage. Commission split. |

### Cross-cutting systems

| Doc | What it covers |
|-----|----------------|
| `calendar.md` | Sessions calendar design, views, interactions, visual design |
| `embed-widget.md` | Shadow DOM embed, theming, delivery modes |
| `emails.md` | Notification system, tone, action links, email design choices |

### Guest pages

| Doc | Route |
|-----|-------|
| `guest/browse.md` | `/{hotelSlug}` — experience list |
| `guest/experience-detail.md` | `/{hotelSlug}/{experienceSlug}` — booking panel, date picker |
| `guest/checkout.md` | `/{hotelSlug}/checkout` — guest details, payment |
| `guest/confirmation.md` | `/{hotelSlug}/confirmation/{id}` — success page |
| `guest/reservation-status.md` | `/{hotelSlug}/reservation/{id}` — request tracking |

### Supplier pages

| Doc | Route |
|-----|-------|
| `supplier/home.md` | `/supplier/dashboard` — landing page |
| `supplier/experiences.md` | `/supplier/experiences` — create & edit experiences |
| `supplier/sessions-calendar.md` | `/supplier/sessions` — calendar management |
| `supplier/booking-management.md` | `/supplier/bookings` — requests & guest management |

### Hotel pages

| Doc | Route |
|-----|-------|
| `hotel/experience-selection.md` | `/hotel/experiences` — curate experiences for widget |

---

## Cursor Rules (`.cursor/rules/`)

Auto-injected by the AI based on file patterns. You don't need to reference these manually.

| Rule | Scope | What it covers |
|------|-------|----------------|
| `product-vision` | Always | Vision, north star change detection, purpose doc contract |
| `project-architecture` | Always | Monorepo structure, tech stack, Vercel deployment |
| `booking-data-model` | `**/*.ts, **/*.tsx` | Entity relationships, status flows, timing windows |
| `timezone-global` | `**/*.ts, **/*.tsx` | Calendar dates vs timestamps, timezone-safe parsing |
| `currency-pricing` | `**/*.ts, **/*.tsx` | Cents storage, pricing models, formatting |
| `supabase-type-safety` | API routes, dashboard | Type assertions, auth ID vs app user ID |
| `dashboard-ui` | `apps/dashboard/**` | Notion-style UI, shadcn patterns, spacing, colors |
| `widget-conventions` | `apps/widget/**` | API route auth, response format, display helpers |
| `email-templates` | `**/email/**` | Resend, baseTemplate, brand colors, escaping |
| `stripe-payments` | `**/*stripe*` | Payment Links, webhooks, transfers, refunds |

---

## Technical Docs (`docs/technical/`)

Full reference specs. `@mention` these when doing deep implementation work.

### Core specs

| Doc | When to use |
|-----|-------------|
| `booking-flow-specs.md` | Full 512-line booking lifecycle with edge cases, email templates, cron jobs |
| `pricing-calculations.md` | All four pricing formulas, code examples, database schema |
| `glossary.md` | Terminology definitions (reservation vs booking, etc.) |
| `account-scenarios.md` | All multi-org account types and scenarios |

### System specs

| Doc | When to use |
|-----|-------------|
| `embed-architecture.md` | Shadow DOM Web Component implementation details |
| `widget-theming-onboarding.md` | Hotel widget theming CSS variables and setup checklist |
| `systems/location-system.md` | PostGIS, geocoding, radius-based matching |
| `systems/image-optimization.md` | Image compression settings, WebP conversion |
| `systems/SUPABASE_SETUP.md` | Database setup and configuration |
| `systems/supabase-storage-specs.md` | Storage bucket structure, media table |
| `systems/stripe/STRIPE_SETUP.md` | Stripe account configuration |
| `systems/stripe/PRICING.md` | Stripe-specific pricing details |
| `rls-multi-org-verification.md` | Row-level security verification |
| `production-readiness-checklist.md` | Pre-launch verification of all scenarios |

---

## Design Docs (`docs/design/`)

| Doc | When to use |
|-----|-------------|
| `brand-essence.md` | Brand identity, color palette, typography, tone of voice |
| `dashboard-design-principles.md` | Full dashboard UI spec (308 lines of component details) |
| `email-design.md` | Email template structure, button types, spacing, colors |

---

## Other

| Folder | What it contains |
|--------|-----------------|
| `docs/deployment/` | Vercel deployment guides, cron job scheduling |
| `docs/planning/` | Future features not yet implemented |
