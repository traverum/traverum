# Traverum — Documentation Index

## How this documentation system works

### Three layers

1. **Product docs** (`docs/product/`) — Human-owned. What each part of the product must accomplish, for whom, and the key design decisions behind it. Written in plain English. The AI reads these before editing related code and never modifies the Goal section without asking.

2. **Cursor rules** (`.cursor/rules/*.mdc`) — `project` and `knowledge-capture` are always on (vision + capturing decisions). `conventions` applies to TypeScript/TSX and states **intent** with pointers to product, design, forbidden, and deployment docs — details live in those docs, not duplicated in rules.

3. **Technical docs** (`docs/technical/`) — Full reference specs for deep implementation work. The AI reads these when building complex features. Humans rarely need to read them.

### The AI contract

- Before editing a page or system, the AI checks for a matching product doc and reads it.
- The **Goal** section is human-owned — never modified without explicit approval.
- **Design decisions** can be updated as implementation evolves, but changes that contradict the Goal are flagged.
- Changes that affect the two north stars (vision + booking flow) trigger a stop-and-ask.

---

## Product Docs (`docs/product/`)

Organized by **persona** — the person using that part of the product. See `docs/product/README.md` for full guide.

### North star

| Doc | What it covers |
|-----|----------------|
| `vision.md` | Why Traverum exists. Two channels (hotel widget + Veyond direct). Core promise. |

### Guest (Traveler)

| Doc | Route | What it covers |
|-----|-------|----------------|
| `guest/_overview.md` | — | Persona, promise, success criteria, journey index |
| `guest/discover.md` | `/{hotelSlug}` | Experience list, card grid, category filters |
| `guest/book.md` | `/{hotelSlug}/{experienceSlug}` | Experience detail, booking panel, date picker |
| `guest/checkout-and-pay.md` | `/{hotelSlug}/checkout` | Guest details form, payment submission |
| `guest/track-reservation.md` | `/{hotelSlug}/reservation/{id}` | Request status tracking |
| `guest/after-experience.md` | `/{hotelSlug}/confirmation/{id}` | Booking confirmation page |

### Supplier (Experience Provider)

| Doc | Route | What it covers |
|-----|-------|----------------|
| `supplier/_overview.md` | `/supplier/dashboard` | Persona, promise, success criteria, home page, journey index |
| `supplier/handle-bookings.md` | `/supplier/bookings` | Requests, approvals, guest management (four tabs) |
| `supplier/manage-calendar.md` | `/supplier/sessions` | Sessions calendar, availability, scheduling |
| `supplier/manage-experiences.md` | `/supplier/experiences` | Create, edit, archive experiences |
| `supplier/get-paid.md` | — | Settlement, completion, auto-complete, payouts |

### Hotel (Distribution Partner)

| Doc | Route | What it covers |
|-----|-------|----------------|
| `hotel/_overview.md` | — | Persona, promise, success criteria, journey index |
| `hotel/curate-experiences.md` | `/hotel/experiences` | Toggle nearby experiences on/off for widget |

### Platform (Traverum Admin)

| Doc | Route | What it covers |
|-----|-------|----------------|
| `platform/_overview.md` | `/admin/*` | Persona, promise, responsibilities |

### Receptionist (Hotel Front Desk) — PLANNED

| Doc | Route | What it covers |
|-----|-------|----------------|
| `receptionist/_overview.md` | `/receptionist/*` | Planned feature vision and persona |

### System (Cross-cutting)

| Doc | What it covers |
|-----|----------------|
| `system/booking-flow.md` | The booking lifecycle. Two flows, timing windows, privacy, commission. |
| `system/pricing.md` | Four pricing models. Cents storage. Commission split. |
| `system/channels.md` | Two-channel model: hotel widget vs Veyond direct. |
| `system/communication.md` | Email notification system, tone, action links, design choices. |
| `system/embed.md` | Shadow DOM embed, theming, delivery modes. |

---

## Session & Quality System

| Doc | Purpose |
|-----|---------|
| `active-state.md` | Living handover between sessions — open items, recently done, known issues |
| `testing.md` | Test coverage map — what's tested, what's exposed, gaps by product journey |
| `decisions.md` | Architecture and product decisions (append-only, reverse chronological) |
| `forbidden.md` | Banned patterns — things we never do |
| `sessions/_template.md` | Session log template (Goal, Blast Radius, Done, Decisions, Open Items) |

### Slash commands

| Command | When | What it does |
|---------|------|-------------|
| `/plan` | Session start | Reads memory, maps blast radius, creates session file |
| `/wrap-up` | End of session or switching chats | Logs what was done, scans for missed decisions, updates active-state |
| `/test` | When you want deploy confidence | Runs unit + E2E tests, updates testing.md, gives deploy verdict |

### Always-on rule

`knowledge-capture.mdc` — listens for decisions, corrections, new product context, and constraints during conversation. Routes them to the right file (`decisions.md`, `forbidden.md`, product docs, or cursor rules) and briefly confirms.

---

## Cursor Rules (`.cursor/rules/`)

Auto-injected by the AI based on file patterns. You don't need to reference these manually.

| Rule | Scope | What it covers |
|------|-------|----------------|
| `project` | Always | Vision, north stars, product doc contract, session continuity, repo conventions; deploy/embed pointers |
| `conventions` | `**/*.ts, **/*.tsx` | European-first intent, money/status pointers, dashboard/widget/email/Stripe intent, gotchas, links to product/design/forbidden/deployment docs |
| `knowledge-capture` | Always | Ambient listener — captures decisions, corrections, product context during conversation |

---

## Technical Docs (`docs/technical/`)

| Doc | When to use |
|-----|-------------|
| `integrations/divinea-integration.md` | Divinea Wine Suite (OCTO API): availability sync, holds, booking lifecycle. Phased plan — Phase 1 read-only, Phase 2 hold/confirm/release. |

Most technical specs live in `docs/product/`, `docs/design/`, `docs/decisions.md`, and `docs/forbidden.md`. Cursor rules (`project`, `conventions`, `knowledge-capture`) point to those sources instead of duplicating them.

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
| `docs/deployment/` | [DEPLOYMENT.md](deployment/DEPLOYMENT.md) — env vars, cron schedules, Supabase migrations, Stripe webhooks. Architecture and build commands are in the `project` cursor rule. |
| `docs/planning/` | Planning and implementation docs. **Receptionist:** [receptionist-tool.md](planning/receptionist-tool.md) — purpose, user stories, implementation notes, branch testing. |
| `docs/sessions/` | Session logs — one file per session. Template: `_template.md`. |
| `docs/active-state.md` | [active-state.md](active-state.md) — living handover. Read this first in every new chat. |
| `docs/testing.md` | [testing.md](testing.md) — test coverage map, gaps by product journey. |
