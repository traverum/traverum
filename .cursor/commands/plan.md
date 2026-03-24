The user wants to plan a new feature or change. Perform a blast radius analysis before any code is written.

## Steps

1. **Read the Memory:**
   - `docs/memory/active-state.md` — what's currently open and broken
   - `docs/testing.md` — what's tested and what's exposed
   - `docs/memory/product-context.md` — product knowledge and rules
   - `docs/memory/tech-context.md` — technical decisions and pitfalls

2. **Find relevant product docs:**
   - Based on the feature described, identify which `docs/product/` docs apply
   - Read each one (especially the Goal and Design Decisions sections)

3. **Output the blast radius:**
   - **Summary:** 1-2 sentences of what we're building
   - **Affected apps:** widget / dashboard / admin — which ones and why
   - **Affected journeys:** which user flows are touched (cite specific product docs)
   - **Affected code:** API routes, shared code, database tables
   - **Constraints:** anything from `product-context.md` or `tech-context.md` that applies
   - **Open items:** anything in `active-state.md` that interacts with this change

4. **Recommended approach:** suggest a sequence of steps to implement the feature

5. **Create session file:**
   - Create `docs/memory/sessions/YYYY-MM-DD_topic.md` using the template from `docs/memory/sessions/_template.md`
   - Fill in the Goal section with what the user described
   - Fill in the Blast Radius section with the analysis above
