# brain/

Traverum's knowledge system. Cognitive metaphor: memory stores what we know, awareness tracks what we're doing now, references hold external deep-dives.

## Layout

```
brain/
├── CLAUDE.md        ← Operating rules. Auto-loaded by Claude when working in brain/.
├── memory/
│   ├── sources/     ← Human-owned source of truth. Read-only for AI.
│   └── wiki/        ← AI-synthesized, cross-linked pages.
├── awareness/
│   ├── current.md   ← What we're working on right now.
│   ├── decisions/   ← Mid-chat captures, pending triage.
│   └── sessions/    ← Session handover logs.
└── references/      ← Vendor docs (Stripe, Supabase, Divinea, …).
```

## Where do I look?

| I need… | Go to |
|---|---|
| An authoritative product answer | `memory/sources/` |
| A synthesized answer across multiple sources | `memory/wiki/index.md`, follow `[[links]]` |
| What we decided last session | `awareness/sessions/` (most recent) |
| What to pick up next | `awareness/current.md` |
| How a vendor API works | `references/` |

## Where do I write?

Humans write to `memory/sources/`. AI only writes via slash commands:

- `/ingest <path>` — absorb a new source into the wiki.
- `/promote <decision>` — move an accepted decision into the wiki.
- `/lint-wiki` — health check.
- `/wrap-up` — end-of-session handover.

The `capture-decision` skill auto-fires mid-chat and drops a file into `awareness/decisions/`. Everything else is explicit.

## Obsidian

`brain/` is an Obsidian vault root (`brain/.obsidian/`). Open it in Obsidian to browse the wiki graph.
