# Traverum — Documentation Index

**Purpose:** This file is the **map of `docs/`** — what lives where, how layers fit together, and where slash commands write. Humans use it to orient; the AI uses it when the task calls for the full index (e.g. you ask how docs are organized, or we need to locate the right area under `docs/`). It is **not** an always-on Cursor rule — the `technical` rule says to read from `docs/` only when needed; routine work usually starts from `docs/memory/active-state.md`, the relevant `docs/product/*` doc, and `docs/memory/*-context.md` instead of this whole index.

## How this documentation system works

### Three layers

1. **Product docs** (`docs/product/`) — Human-owned. What each part of the product must accomplish, for whom, and the key design decisions behind it. Written in plain English. The AI reads these before editing related code and never modifies the Goal section without asking.

2. **Cursor rules** (`.cursor/rules/`) — Always on: `project.mdc` (vision), `technical.mdc` (architecture, workflow, pointers into `docs/`), `knowledge-capture.mdc` (ambient decisions → memory files), `persona.md` (how the AI acts — “the CTO”). Details live in product, design, deployment, and memory docs — not duplicated in rules.

3. **Integrations & reference** (`docs/integrations/`, `docs/context7/`) — Partner integrations (e.g. Divinea) and CLI/API reference material. The AI reads these when the task touches that integration or tool. Most deep specs still live in `docs/product/`, `docs/design/`, and `docs/memory/*-context.md`.

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

### Receptionist (Hotel Front Desk) — in progress

| Doc | Route | What it covers |
|-----|-------|----------------|
| `receptionist/_overview.md` | `/receptionist/login`, `/receptionist/`, `/receptionist/bookings` | Persona, promise, journeys index, implementation status |
| `receptionist/browse-and-book.md` | — | Find experiences, book on behalf of guest |
| `receptionist/track-bookings.md` | — | Status of bookings created by receptionist |
| `receptionist/contact-supplier.md` | — | Reach supplier for logistics; hotel-only notes |

### System (Cross-cutting)

| Doc | What it covers |
|-----|----------------|
| `system/booking-flow.md` | The booking lifecycle. Two flows, timing windows, privacy, commission. |
| `system/pricing.md` | Four pricing models. Cents storage. Commission split. |
| `system/channels.md` | Two-channel model: hotel widget vs Veyond direct. |
| `system/communication.md` | Email notification system, tone, action links, design choices. |
| `system/embed.md` | Shadow DOM embed, theming, delivery modes. |

---

## Knowledge Base (`docs/kb/`)

AI-maintained, topic-based reference. See `docs/kb/INDEX.md` for full catalog.

| Page | Purpose |
|-----|---------|
| `kb/INDEX.md` | Catalog of all KB pages with maintenance rules |
| `kb/schema.md` | Every database table, column, type, RLS policy, and relationship |
| `kb/api-routes.md` | All 53 widget API routes + 2 edge functions |
| `kb/email-flows.md` | Every email trigger, recipient, template, and subject line |
| `kb/stripe-setup.md` | Our Stripe Connect implementation: accounts, webhooks, payment flows |
| `kb/decisions.md` | Technical decisions grouped by topic (replaces `memory/tech-context.md`) |
| `kb/product-notes.md` | Product knowledge by domain (replaces `memory/product-context.md`) |
| `kb/active-state.md` | Operational state: known issues, open items, latest session |
| `kb/sessions/` | Session logs — one file per session. Template: `kb/sessions/_template.md` |
| `testing.md` | Test coverage map (optional; regenerated when `/test` runs) |

### Slash commands

Defined in `.cursor/commands/` (Cursor exposes them as `/plan`, `/wrap-up`, `/test`).

| Command | When | What it does |
|---------|------|-------------|
| `/plan` | Before a significant build | Reads KB, maps blast radius, creates `docs/kb/sessions/YYYY-MM-DD_topic.md` |
| `/wrap-up` | End of session or switching chats | Updates session file + `docs/kb/active-state.md`, scans for missed knowledge capture |
| `/test` | Deploy confidence | Runs unit + E2E tests, updates `docs/testing.md` when present, gives deploy verdict |

### Always-on rule

`knowledge-capture.mdc` — listens for decisions, corrections, new product context, and constraints during conversation. Routes them to `kb/decisions.md`, `kb/product-notes.md`, or cursor rules and briefly confirms.

---

## Cursor Rules (`.cursor/rules/`)

Injected according to each rule’s Cursor config (`alwaysApply` / globs). You don’t need to reference these manually in chat.

| Rule | Scope | What it covers |
|------|-------|----------------|
| `project.mdc` | Always | Vision — what Traverum is and why it exists |
| `technical.mdc` | Always | North stars, product doc contract, session continuity, architecture, pointers into `docs/` |
| `knowledge-capture.mdc` | Always | Ambient listener — captures product knowledge and tech decisions during conversation |
| `persona.md` | Always | AI role (“the CTO”), communication and simplicity preferences |

---

## Integrations & reference (`docs/integrations/`, `docs/context7/`)

| Doc | When to use |
|-----|-------------|
| [`integrations/divinea-integration.md`](integrations/divinea-integration.md) | Divinea Wine Suite (OCTO API): availability sync, holds, booking lifecycle. Phased plan — Phase 1 read-only, Phase 2 hold/confirm/release. |
| [`context7/supabase-cli-reference.md`](context7/supabase-cli-reference.md) | Supabase CLI reference (local dev, migrations, etc.). |

Most day-to-day specs live in `docs/product/`, `docs/design/`, and `docs/kb/`. Cursor rules point to those sources instead of duplicating them.

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
| `docs/deployment/` | [DEPLOYMENT.md](deployment/DEPLOYMENT.md) — env vars, cron schedules, Supabase migrations, Stripe webhooks. Architecture and build commands are in the `technical` cursor rule. |
| `docs/planning/` | Planning and implementation docs. **Receptionist:** [receptionist-tool.md](planning/receptionist-tool.md) — purpose, user stories, implementation notes, branch testing. |
| `docs/kb/sessions/` | Session logs — one file per session. Template: [`_template.md`](kb/sessions/_template.md). |
| `docs/kb/active-state.md` | [active-state.md](kb/active-state.md) — living handover. Read this first in every new chat. |
| `docs/testing.md` | Test coverage map (gaps by product journey). Regenerated when you run the `/test` command; path may be absent until then. |
