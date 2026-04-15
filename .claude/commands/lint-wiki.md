---
description: Health check on brain/memory/wiki/ — broken links, orphans, contradictions, stale claims
---

Audit the wiki. Report findings; only write on user approval.

## Checks

1. **Broken `[[links]]`.** Scan every page for `[[link]]` targets. Flag any that don't resolve to an existing page.

2. **Orphans.** Pages with zero inbound links. Either they should be linked from somewhere, or they should be merged into another page or removed.

3. **Contradictions.** Two pages making incompatible claims about the same entity or concept. Flag and propose the resolution.

4. **Stale claims.** A page asserting something that a newer `source` page contradicts. Flag with the source of the contradiction.

5. **Missing pages for recurring concepts.** A term mentioned across many pages with no dedicated page of its own. Suggest creating it.

6. **Data gaps.** Questions the wiki can't answer that a web search or vendor doc lookup could fill. Suggest, don't auto-fetch.

## Workflow

1. Run all six checks silently.
2. Report findings to the user, grouped by check, with suggested fixes.
3. **Wait for user approval** before applying anything.
4. On approval, apply fixes — one group at a time, confirming diffs per-group for non-trivial changes.
5. Append a summary to `brain/memory/wiki/log.md`:

   ```
   ## [YYYY-MM-DD] lint
   - Broken links fixed: <count>
   - Orphans addressed: <count>
   - …
   ```

## Rules

- Never auto-fix without confirmation.
- Don't touch `brain/memory/sources/` — read-only.
- If a check finds nothing, say so plainly — don't invent issues.
