---
description: Absorb a source document into brain/memory/wiki/
argument-hint: <path to source file>
---

Ingest the source at: $ARGUMENTS

## Steps

1. **Read the source fully.** Don't skim — you need the whole thing.

2. **Summarize key takeaways** in chat and confirm with the user before writing anything. Unless the user says "batch ingest" or similar, this confirmation step is mandatory.

3. **Create `brain/memory/wiki/source-<slug>.md`** summarising the document. Use this frontmatter:

   ```yaml
   ---
   type: source
   created: YYYY-MM-DD
   updated: YYYY-MM-DD
   sources: [<path relative to brain/memory/sources/>]
   tags: []
   ---
   ```

4. **For each entity / concept mentioned** in the source:
   - If a wiki page already exists → update it in-place with new information. Bump `updated:`.
   - If no page exists → create one with the appropriate `type` (`entity`, `concept`, `analysis`, `overview`).
   - **Prefer updating over creating.** Don't fork a near-duplicate page.

5. **Cross-link aggressively.** Add `[[wiki-links]]` (Obsidian-style, no `.md` extension) across all touched pages. Links are the wiki's connective tissue.

6. **Update `brain/memory/wiki/index.md`** — add new pages, refresh summaries of updated pages.

7. **Append an entry to `brain/memory/wiki/log.md`:**

   ```
   ## [YYYY-MM-DD] ingest | <source-slug>
   - Created: wiki/<new-pages>
   - Updated: wiki/<touched-pages>
   - Notes: <one line>
   ```

## Rules

- Sources are immutable — never modify anything in `brain/memory/sources/`.
- Every wiki page must have frontmatter.
- When in doubt, ask before large structural changes.
