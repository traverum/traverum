---
description: End-of-session handover — write session log, triage decisions, refresh awareness/current.md
---

Close out the current session. Do this carefully — the point is that a future session can pick up where we left off.

## Checklist

1. **Write a session log.** Create `brain/awareness/sessions/YYYY-MM-DD-<slug>.md` using this template:

   ```markdown
   ---
   date: YYYY-MM-DD
   slug: <short-kebab>
   ---

   ## What we worked on
   ## Decisions made
   ## Files touched
   ## Open threads
   ## Handover
   ```

   Use today's date. Pick a short kebab-case slug that describes the session (e.g. `stripe-off-session`, `widget-calendar-fix`). Keep each section tight — the "Handover" section is what the next session reads first, so make it clear.

2. **Triage every decision in `brain/awareness/decisions/`** (not `archive/`). For each one:
   - Confirm its `status` with the user (proposed / accepted / superseded).
   - If `accepted` and settled: offer to run `/promote <slug>` now.
   - Otherwise leave it in place.

3. **Overwrite `brain/awareness/current.md`** with the new reality:
   - Current focus (one paragraph).
   - In progress (bulleted open threads).
   - Recently completed (last 3–5 sessions, link the session files).
   - Open questions / blockers.
   - Next pick-up (where a fresh session starts).

4. **Append one line to `brain/memory/wiki/log.md`:**

   ```
   ## [YYYY-MM-DD] session | <slug> — <one-line summary>
   ```

## Notes

- Don't invent work that didn't happen. If the session was short, the log is short.
- Never silently promote decisions — always confirm with the user first.
- If nothing was decided this session, the "Decisions made" section can say "None."
