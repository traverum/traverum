The user is ending this chat or switching to a new one. Save the session state so the next chat can continue seamlessly.

## Steps

1. **Scan for missed knowledge:**
   - Review the conversation history from this session
   - Identify any business rules, product decisions, corrections, or constraints that were stated but not yet captured by the knowledge-capture rule
   - Append any missing ones to the right files (see routing in `knowledge-capture.mdc`)

2. **Update today's session file** in `docs/sessions/`:
   - If a session file exists for today, update it
   - If not, create one from `docs/sessions/_template.md`
   - Fill in: **Done** (what was accomplished), **Decisions** (what was decided), **Open Items** (what's unfinished)

3. **Update `docs/active-state.md`:**
   - Move completed items from Open to Recently Done
   - Add any new open items from this session
   - Update Known Issues if anything new was discovered
   - Update the Latest Session link

4. **Report to the user:**
   - Brief summary of what was done
   - What's open for the next session
   - Any decisions that were logged during the session
