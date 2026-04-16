---
type: entity
created: 2026-04-15
updated: 2026-04-15
sources: [product/ai-agents/_overview.md, tech-context.md]
tags: [ai-agents, api, persona, machine-readable, openapi, mcp]
---

# AI Agents

The fifth user type. Autonomous and semi-autonomous software acting on behalf of travelers, hotels, or platforms.

## Who they are

- A guest's AI assistant: "Find me a dinner + wine tour in Amalfi next Tuesday under €80."
- A hotel concierge bot batch-fetching availability across suppliers.
- A third-party aggregator comparing experiences across platforms.
- A booking automation handling repeat guests.

They don't scroll, they don't click. They parse JSON and follow links.

## Where they interact

The widget API (`apps/widget/src/app/api/`) is the agent surface — the same routes that power the widget, dashboard, and admin. No shadow API. Future surfaces: CLI, MCP server, OpenAPI schema.

## Our contract with agents

### We promise

- **Discoverable inventory** — experiences, availability, pricing via structured endpoints
- **Predictable response shapes** — stable envelopes, descriptive field names, no surprise nulls
- **Actionable errors** — typed error codes with `retryable` flag; never prose-only 500s
- **Safe failure** — idempotency keys, rate limits, one-way status transitions; retries never duplicate
- **Honest authorization** — agent acting for a guest sees exactly what the guest sees; supplier PII hidden until payment (same rule as humans)

### We never do

- Rename agent-facing fields silently — existing integrations break overnight
- Ship a booking endpoint without idempotency key support
- Return human-only errors ("Oops! Something went wrong")
- Expose guest PII through an agent endpoint before payment
- Make inventory visible in the widget but not in the API

## The three-question checklist

Ask for every guest-facing or inventory-related change before shipping:

1. **Can an agent discover this data?** Structured JSON, semantic field names, stable keys.
2. **Can an agent act on it?** Clean endpoint, idempotent writes, machine-parseable errors.
3. **Does this break existing agent interfaces?** Response envelope, field names, status codes, auth model.

Internal admin tools and receptionist dashboards are exempt. **Bookable inventory is not.**

## Design principles

| Principle | Example |
|---|---|
| Widget API is single source | Agents hit same routes as dashboard — never a duplicate code path |
| Structured over narrative | `{ "code": "SOLD_OUT", "retryable": false }` not `"Sorry, sold out!"` |
| Semantic field names | `base_price_cents`, `supplier_cutoff_hours` — not `price`, `deadline` |
| OpenAPI is the contract | If not in spec, agent can't rely on it |
| Version breaking changes | Additive = free; renames/removals need migration path |

## Journeys (placeholder — to be built out as surfaces land)

| Journey | Status |
|---|---|
| Discover inventory | Planned |
| Check availability (session + request) | Planned |
| Book programmatically (idempotency, payment, confirmation) | Planned |
| Track reservation status | Planned |
| Handle errors and retries | Planned |

## Scope boundary

- **Needs agent surface:** guest-facing features, inventory, availability, booking, confirmation.
- **No agent surface needed:** receptionist dashboard, admin tools, internal platform ops.

## Related pages

- [[source-ai-agents]] — Source digest
- [[tech-decisions]] — "AI agent interfaces": CLI, MCP, OpenAPI all wrap the same widget API functions
- [[booking]] — Core flow agents must not break
- [[channels]] — Agents are channel-aware (`hotel_id` null = Veyond direct)
- [[guest]] — Agents often act on behalf of guests; same auth boundaries apply
- [[product-rules]] — Platform-wide rules agents must respect (PII, status transitions, etc.)
