The user is ending this chat or switching to a new one. Save the session state so the next chat can continue seamlessly.

## Steps

1. **Scan for missed knowledge:**
   - Review the conversation history from this session
   - Identify any business rules, product decisions, corrections, or constraints that were stated but not yet captured by the knowledge-capture rule
   - Append any missing ones to the right files (see routing in `knowledge-capture.mdc`)

2. **Update the session file** in `docs/memory/sessions/`:
   - Prefer the file created for this topic by `/plan` (e.g. `YYYY-MM-DD_topic.md`). If none exists, create one from `docs/memory/sessions/_template.md` using a short `topic` slug.
   - Fill in: **Done** (what was accomplished), **Decisions** (what was decided), **Open Items** (what's unfinished)

3. **Update `docs/memory/active-state.md`:**
   - Move completed items from Open to Recently Done
   - Add any new open items from this session
   - Update Known Issues if anything new was discovered
   - Update the Latest Session link

4. **Report to the user:**
   - Brief summary of what was done
   - What's open for the next session
   - Any decisions that were logged during the session
