# brain/ — operating rules

Auto-loaded whenever Claude is working inside `brain/`. Governs how the knowledge system behaves.

---

## Directory layout

```
brain/
├── CLAUDE.md                ← This file. Nested rules for everything under brain/.
├── README.md                ← Human-facing one-page map.
├── memory/
│   ├── sources/             ← HUMAN-OWNED. Source of truth. Read-only for AI.
│   │   └── assets/          ← Images and attachments referenced by sources.
│   └── wiki/                ← AI-maintained. Cross-linked. Grows via /ingest or /promote.
│       ├── index.md         ← Content catalog — updated on every ingest.
│       └── log.md           ← Append-only chronological operation log.
├── awareness/
│   ├── current.md           ← Active state, overwritten each session.
│   ├── decisions/           ← Mid-chat captures, triaged into the wiki via /promote.
│   │   └── archive/         ← Promoted or superseded decisions (audit trail).
│   └── sessions/            ← Session handover logs.
└── references/              ← External vendor docs (Stripe, Supabase, Divinea, etc.).
```

---

## Ownership — who writes what

| Area | Owner | Rule |
|---|---|---|
| `memory/sources/` | Human | Read-only for AI. Never modify. Never reorganize. |
| `memory/wiki/` | AI | Grows only via `/ingest` or `/promote`. Never direct chat writes. |
| `awareness/` | AI | Holding pen for in-flight work — captures, sessions, current state. |
| `references/` | Vendor / Human | Raw vendor docs for deep dives. AI reads, rarely writes. |

---

## Wiki page types

Every page under `memory/wiki/` starts with YAML frontmatter.

### Frontmatter template

```yaml
---
type: source | entity | concept | analysis | comparison | overview
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: []          # list of source filenames this page draws from
tags: []
---
```

### Types

| Type | Purpose |
|---|---|
| `source` | Summary of a single source document from `memory/sources/`. |
| `entity` | Page about a person, place, organisation, product, etc. |
| `concept` | Page about an idea, framework, theory, or recurring theme. |
| `analysis` | A synthesised answer, comparison, or investigation filed back from a query. |
| `overview` | High-level summary that ties multiple pages together. |

---

## Naming conventions

- Filenames: lowercase, hyphens for spaces — `some-concept.md`.
- Wiki links use Obsidian-style `[[double brackets]]` — no `.md` extension.
- Source summaries are named after the source: `source-<slug>.md`.

---

## Workflows — user-facing slash commands

All four are implemented as slash commands in `.claude/commands/`. Invoke from chat.

### `/ingest <path>`

Absorb a source document into the wiki.

1. Read the source file fully.
2. Summarise key takeaways and confirm with the user (unless told to batch-ingest silently).
3. Create `memory/wiki/source-<slug>.md`.
4. For each entity / concept mentioned: update an existing page in-place OR create a new one.
5. Add and update `[[cross-links]]` across all touched pages.
6. Update `memory/wiki/index.md` — new pages added, summaries refreshed.
7. Append an entry to `memory/wiki/log.md`.

### `/promote <decision-slug>`

Move an accepted decision from `awareness/decisions/` into the relevant wiki page.

1. Read `awareness/decisions/<slug>.md`. Confirm `status: accepted`.
2. Find the target wiki page via `memory/wiki/index.md`. Show the user the target and proposed diff.
3. Update the wiki page in-place; bump `updated:`; add `[[cross-links]]`.
4. Append to `memory/wiki/log.md`:
   `## [YYYY-MM-DD] promote | decision <slug> → wiki/<page>`
5. `mv awareness/decisions/<slug>.md awareness/decisions/archive/`.

### `/lint-wiki`

Health check — no writes without confirmation.

Checks:
- Broken `[[links]]` (pages referenced but don't exist).
- Orphans (pages with no inbound links).
- Contradictions between pages.
- Stale claims superseded by newer sources.
- Concepts mentioned repeatedly but lacking a dedicated page.
- Data gaps that a web search could fill.

Report to user → on approval, apply fixes → append a summary to `memory/wiki/log.md`.

### `/wrap-up`

End-of-session handover.

1. Write `awareness/sessions/YYYY-MM-DD-slug.md` using the session template.
2. For each non-archived decision in `awareness/decisions/`: confirm status with user → if `accepted` and settled, offer to `/promote`; otherwise leave in place.
3. Overwrite `awareness/current.md` with the new reality.
4. Append one line to `memory/wiki/log.md`:
   `## [YYYY-MM-DD] session | <slug> — <one-line>`

---

## Query workflow (not a slash command — default chat behaviour)

When the user asks a product question:

1. Read `memory/wiki/index.md` to locate relevant pages.
2. Read those pages.
3. Synthesise an answer citing `[[wiki links]]`.
4. If the answer is substantial and worth preserving, offer to file it as an `analysis` page (update index + log).

---

## Principles

- **Sources are immutable.** Never modify anything in `memory/sources/`.
- **The wiki is the AI's artifact.** The human reads; the AI writes — but only via `/ingest` or `/promote`.
- **Every change is logged.** No silent edits. `memory/wiki/log.md` is append-only.
- **Cross-reference aggressively.** Links are the wiki's connective tissue.
- **Prefer updating over creating.** Enrich an existing page rather than forking a new one.
- **Frontmatter is mandatory.** Every wiki page must have it so tooling (Dataview, search) works.
- **When in doubt, ask.** Don't assume intent — ask before large structural changes.

---

## Domain — Traverum

Traverum is a booking platform that connects hotels, experience suppliers, and guests. Hotels embed a white-label widget; suppliers manage availability; guests book and pay; everyone earns a commission share. Veyond is the customer-facing brand for direct bookings.

### Key domain terms

| Term | Meaning |
|---|---|
| Traverum | The company, platform, and technology. |
| Veyond | Customer-facing brand for direct bookings. |
| Hotel channel | White-label widget embedded on hotel sites (`hotel_id` set). |
| Veyond direct | Direct booking under the Veyond brand (`hotel_id` null). |
| Partner | Internal name for a supplier entity in the database. |
| Experience | An activity, tour, or rental offered by a supplier. |
| Session | A specific time slot for a session-based experience. |
| Reservation | A booking request awaiting supplier approval. |
| Booking | A confirmed, paid (or guaranteed) reservation. |
| Distribution | A hotel–experience pairing with commission split. |

### Personas

| Persona | Wiki page | Description |
|---|---|---|
| Guest | `[[guest]]` | Traveller who discovers, books, and attends experiences. |
| Supplier | `[[supplier]]` | Experience provider with dashboard, calendar, bookings. |
| Hotel | `[[hotel]]` | Embeds widget, curates local experiences, earns commission. |
| Receptionist | `[[receptionist]]` | Hotel front-desk staff using the receptionist widget. |
| Platform admin | (folded into `[[overview]]`) | Traverum internal team. |

### Wiki page conventions

- Pages are synthesised from multiple sources — not 1:1 summaries.
- Each page targets a coding agent's lookup pattern: *"What rules apply to X?"*
- The `sources` frontmatter field lists source file paths relative to `memory/sources/`.
- Cross-link aggressively with `[[page-name]]` (Obsidian-style, no `.md` extension).
