I want a production-readiness checklist for our software. Do this:

1. **Explore the codebase** – Read docs (especially flows, specs, architecture), API routes, pages, and integrations. Map out what the system does end-to-end.

2. **Identify all user types** – Who uses the system? (e.g. guest, supplier, hotel, admin). List every role that interacts with the product.

3. **List every scenario per user** – For each user type, list every scenario the system must support: signup, onboarding, core actions, edge cases, integrations (Stripe, email, cron), etc.

4. **Group by user** – Organize the list by user type (one section per role).

5. **Sort by priority** within each section:
   - P0 (Blocking): Core money/booking flow; if broken, the product can’t operate.
   - P1 (Critical): Users expect it; broken = serious friction and support load.
   - P2 (Important): Needed for smooth operation; workarounds exist but are painful.
   - P3 (Nice-to-have): Improves experience; not strictly required for launch.

6. **Include system/integration scenarios** – Cron jobs, webhooks, background jobs, third-party integrations. Treat these as their own category if useful.

7. **For each scenario** – Briefly describe the flow and what “must work” (the concrete success criteria).

8. **Add edge cases** – Double-submits, expired links, missing data, idempotency, partial failures.

9. **Add a verification order** – Recommended order to validate flows (e.g. core booking first, then money, then edge cases).

10. **Call out gaps** – Anything that looks unimplemented, inconsistent, or risky based on the codebase.

Output as a structured markdown document that can be saved as `docs/production-readiness-checklist.md` and used as a QA/production checklist.