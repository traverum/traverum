# AI Agents (Fifth User)

## Where this lives

- **App:** Widget (`apps/widget`) — the API layer is the agent surface.
- **Routes:** Public API under `apps/widget/src/app/api/` (discoverable endpoints for inventory, availability, booking).
- **Future surfaces:** CLI, MCP server, OpenAPI schema. See `brain/memory/sources/tech-context.md` → "AI Agent Interface".

## Who is this user?

Autonomous and semi-autonomous software agents acting on behalf of travelers, hotels, or platforms. A guest's personal assistant searching "dinner + wine tour in Amalfi next Tuesday". A hotel concierge bot batch-fetching availability. A third-party aggregator comparing experiences. They don't scroll, they don't click — they parse JSON and follow links.

Not a hypothetical. This is the direction every travel interface is moving. If we're not machine-readable, we're invisible to the next generation of booking.

## What do we promise them?

- **Discoverable inventory.** Experiences, availability, and pricing exposed through clean, structured endpoints.
- **Predictable shapes.** Descriptive field names, stable response envelopes, documented schema.
- **Actionable errors.** Machine-parseable error codes and messages — no prose-only 500s.
- **Safe failure.** Rate limits, idempotency, and clear status transitions. An agent retrying a booking must never create duplicates.
- **Honest authorization.** Clear auth boundaries. An agent acting for a guest sees what that guest sees — nothing more.

## Success looks like

- An agent can discover, filter, and book an experience end-to-end without ever rendering HTML.
- The same API that powers our widget powers the agent — no second code path to drift.
- Response shapes and field names stay stable across releases; breaking changes are versioned.
- Errors tell the agent *exactly* what to do next (`retry`, `re-auth`, `conflict`, `bad input`).

## What should never happen

- Agent-facing field renamed silently in a schema change. Existing integrations break overnight.
- Booking endpoint without an idempotency key — a retry creates a duplicate reservation.
- Error responses that only make sense to humans ("Oops! Something went wrong").
- Guest PII exposed through an agent endpoint before payment (supplier-protection rule applies to agents too).
- Inventory visible through the widget but not through the API — agents get a second-class view.

## Three questions for every guest-facing or inventory-related change

Ask these before shipping:

1. **Can an agent discover this data?** Structured JSON, descriptive field names, stable keys.
2. **Can an agent act on it?** Clean API, idempotent where it matters, machine-parseable errors.
3. **Does this break existing agent interfaces?** Response envelope, field names, status codes, auth model.

Internal admin tools and receptionist dashboards don't need agent surfaces. **Bookable inventory does.**

## Design principles

- **Widget API is the single source.** Dashboard, Admin, and agents all speak the same routes. No shadow API.
- **Structured over narrative.** Prefer `{ "error": { "code": "EXPERIENCE_SOLD_OUT", "retryable": false } }` over `"Sorry, this experience is sold out."`
- **Semantic field names.** `base_price_cents` beats `price`. `supplier_cutoff_hours` beats `deadline`.
- **Document the surface.** OpenAPI spec is the contract. If it's not in the spec, an agent can't rely on it.
- **Version breaking changes.** Additive changes are free. Renames and removals need a migration path — just like we do for humans.

## Journeys

*(Placeholder — to be filled as agent surfaces land.)*

1. Discover inventory — browse experiences by location, date, category.
2. Check availability — session-based and request-based paths.
3. Book programmatically — with idempotency, payment, and confirmation flow.
4. Track reservation status — poll or webhook.
5. Handle errors and retries — idempotency keys, typed errors, backoff hints.

## Related

- [[system/booking-flow]] — the flow agents must not break.
- [[system/channels]] — agents are channel-aware (hotel vs. Veyond).
- `brain/memory/sources/tech-context.md` — technical approach (CLI, MCP, OpenAPI).
