---
type: source
created: 2026-04-15
updated: 2026-04-15
sources: [product/ai-agents/_overview.md]
tags: [ai-agents, api, persona, machine-readable]
---

# Source: AI Agents (Fifth User)

Digest of `product/ai-agents/_overview.md` — establishes AI agents as a first-class user type and defines the contract for building machine-readable surfaces.

## Core claim

AI agents are the fifth user type at Traverum. They're not a future concern — they're the direction every travel interface is moving. If our inventory isn't machine-readable, it's invisible to the next generation of booking.

## What makes an agent different from a human

- They parse JSON, not HTML
- They follow links, not visual affordances
- They retry on failure — so idempotency is not optional
- They break silently when field names change — so stability is a contract

## Our promise to agents

| Promise | What it means |
|---|---|
| Discoverable inventory | Experiences, availability, pricing via clean structured endpoints |
| Predictable shapes | Stable response envelopes, descriptive field names |
| Actionable errors | `{ "code": "EXPERIENCE_SOLD_OUT", "retryable": false }` — never prose-only 500s |
| Safe failure | Idempotency keys, rate limits, clear status transitions |
| Honest auth | An agent acting for a guest sees exactly what that guest sees |

## The three-question checklist

For every guest-facing or inventory-related change:

1. Can an agent discover this data? (structured JSON, semantic field names)
2. Can an agent act on it? (clean API, idempotent writes, parseable errors)
3. Does this break existing agent interfaces? (response envelope, field names, status codes)

Internal admin tools and receptionist dashboards are exempt. **Bookable inventory is not.**

## Design principles

- **Widget API is the single source.** Agents speak the same routes as dashboard and admin. No shadow API.
- **Semantic naming.** `base_price_cents` > `price`. `supplier_cutoff_hours` > `deadline`.
- **OpenAPI is the contract.** If it's not in the spec, an agent can't rely on it.
- **Version breaking changes.** Additive = free. Renames/removals need a migration path.

## Journeys (placeholder — to be filled as surfaces land)

1. Discover inventory
2. Check availability (session + request paths)
3. Book programmatically (idempotency, payment, confirmation)
4. Track reservation status
5. Handle errors and retries

## Related wiki pages

- [[ai-agents]] — Full persona page
- [[tech-decisions]] — "AI agent interfaces" section: CLI, MCP, OpenAPI wrapping same functions
- [[booking]] — The flow agents must not break
- [[channels]] — Agents are channel-aware (`hotel_id` null = Veyond direct)
