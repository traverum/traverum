---
last_updated: 2026-04-13
---

# Knowledge Base Index

AI-maintained reference for the Traverum platform. Each page is self-contained and topic-based. Update pages in-place — never append chronologically.

## Pages

| Page | Description |
|---|---|
| [schema.md](schema.md) | Every database table, column, type, RLS policy, and relationship |
| [api-routes.md](api-routes.md) | All 53 widget API routes + 2 edge functions, grouped by domain |
| [email-flows.md](email-flows.md) | Every email trigger, recipient, template, and subject line |
| [stripe-setup.md](stripe-setup.md) | Our Stripe Connect implementation: accounts, webhooks, payment flows, commission split |
| [decisions.md](decisions.md) | Technical decisions grouped by topic (Types, Stripe, Database, UI, Architecture, Avoid) |
| [product-notes.md](product-notes.md) | Product knowledge by domain (Booking, Payment, Tags, Hosts, Checkout, AI Agents, Avoid) |
| [active-state.md](active-state.md) | Operational state: known issues, open items, latest session |

## Session Logs

Session logs in `sessions/` — one file per working session, chronological. Template: `sessions/_template.md`.

## Maintenance Rules

1. **After any schema change:** Update `schema.md` with the new table/column in-place.
2. **After building a new feature:** Update relevant pages (schema, API routes, email flows, etc.).
3. **After a technical decision:** Update `decisions.md` under the relevant topic heading.
4. **After learning a product insight:** Update `product-notes.md` under the relevant domain.
5. **After wrapping up a session:** Add a session log to `sessions/`. Update `active-state.md`.
6. **Periodically:** Archive done items from `active-state.md`. Keep it under 50 lines.
