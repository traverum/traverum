The user wants to plan a new feature or change. Perform a blast radius analysis before any code is written.

## Steps

1. **Read the Memory:**
   - `docs/active-state.md` — what's currently open and broken
   - `docs/testing.md` — what's tested and what's exposed
   - `docs/decisions.md` — existing constraints and architecture choices
   - `docs/forbidden.md` — banned patterns

2. **Find relevant product docs:**
   - Based on the feature described, identify which `docs/product/` docs apply
   - Read each one (especially the Goal and Design Decisions sections)

3. **Output the blast radius:**
   - **Summary:** 1-2 sentences of what we're building
   - **Affected apps:** widget / dashboard / admin — which ones and why
   - **Affected journeys:** which user flows are touched (cite specific product docs)
   - **Affected code:** API routes, shared code, database tables
   - **Test exposure:** what existing tests cover this area, and what gaps exist (from `testing.md`)
   - **Constraints:** anything from `decisions.md` or `forbidden.md` that applies
   - **Open items:** anything in `active-state.md` that interacts with this change

4. **Recommended approach:** suggest a sequence of steps to implement the feature

5. **Create session file:**
   - Create `docs/sessions/YYYY-MM-DD_topic.md` using the template from `docs/sessions/_template.md`
   - Fill in the Goal section with what the user described
   - Fill in the Blast Radius section with the analysis above
