# Log

> Append-only chronological record of wiki operations.
> Each entry uses the format: `## [YYYY-MM-DD] operation | details`
> Parseable with: `grep "^## \[" log.md | tail -n 5`

---

## [2026-04-15] init | Wiki foundation created

Established directory structure and initial files:
- `raw/` — source documents (immutable, LLM reads only)
- `raw/assets/` — images and attachments
- `wiki/` — LLM-maintained knowledge base
- `wiki/index.md` — content catalog
- `wiki/log.md` — this file
- `.cursorrules` — schema governing LLM behaviour

## [2026-04-15] ingest | Full initial ingestion — 32 source files → 15 wiki pages

Ingested all 32 raw source files in 4 batches. Created 15 synthesized wiki pages optimized for coding agent lookup.

**Batch 1 — Core domain** (4 sources → 7 pages):
- Sources: `vision.md`, `system/booking-flow.md`, `system/channels.md`, `system/pricing.md`
- Created: `overview`, `booking`, `payment-modes`, `commission`, `pricing`, `channels`, `cancellation`

**Batch 2 — Personas** (15 sources → 4 pages):
- Sources: all files in `guest/`, `supplier/`, `hotel/`, `receptionist/`, `platform/`
- Created: `guest`, `supplier`, `hotel`, `receptionist`
- Platform admin folded into `overview`

**Batch 3 — Design + system** (6 sources → 1 page):
- Sources: `design/brand-essence.md`, `design/dashboard-design.md`, `design/dashboard-planning-framework.md`, `design/email-design.md`, `system/communication.md`, `system/embed.md`
- Created: `design-system`

**Batch 4 — Rules, tech, legal** (4 sources → 3 pages):
- Sources: `product-context.md`, `tech-context.md`, `privacy-policy.md`, `terms-and-conditions.md`
- Created: `product-rules`, `tech-decisions`, `legal`

**Cross-reference pass:** All `[[wiki links]]` verified — 15 target pages, zero broken links, zero orphans. Schema updated with Traverum domain conventions. Index rebuilt.

## [2026-04-15] ingest | DEPLOYMENT.md added to wiki knowledge graph

Ingested new source `raw/assets/DEPLOYMENT.md` and integrated deployment operations into existing technical documentation.

- Created `wiki/source-deployment.md` (`type: source`) with source-level operational digest.
- Created `wiki/deployment.md` (`type: concept`) covering Vercel project boundaries, env/build constraints, cron strategy, migration rollout, Stripe webhook wiring, and rollback path.
- Updated `wiki/tech-decisions.md` to include `DEPLOYMENT.md` in sources and cross-link `[[deployment]]`.
- Updated `wiki/index.md` with new entries for `[[deployment]]` and `[[source-deployment]]`.
- Cross-links added between `[[deployment]]`, `[[tech-decisions]]`, `[[booking]]`, `[[payment-modes]]`, and `[[source-deployment]]`.
