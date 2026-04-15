# Wiki Index

> Auto-maintained by the LLM. Lists every wiki page with a one-line summary.
> The LLM reads this first when answering queries to locate relevant pages.

---

## Overview

- [[overview]] — What Traverum is, three parties, two channels, one platform, non-goals, principles.

## Domain (system concepts)

- [[booking]] — Core flow: booking paths (session/request/rental), status machines, timing windows.
- [[payment-modes]] — Stripe (pay upfront) vs Reserve & Pay on Site: money flow, card guarantees, settlement.
- [[commission]] — Three-way vs two-way split, rounding rules, invoice netting, collection by payment mode.
- [[pricing]] — Four models (per person, flat, base+extra, per day), cents storage, overrides, min_participants.
- [[channels]] — Hotel widget vs Veyond direct: branding, `hotel_id` semantics, embed, location matching.
- [[cancellation]] — Policies (flexible/moderate), enforcement per payment mode, no-show verification.
- [[deployment]] — Vercel project boundaries, env/build rules, crons, migration rollout, rollback.

## Personas

- [[guest]] — Traveler journey: discover, book, checkout, track reservation, after experience.
- [[supplier]] — Experience provider: handle bookings, calendar, manage experiences, get paid, host profiles.
- [[hotel]] — Distribution partner: embed widget, curate experiences, earn commission.
- [[receptionist]] — Front-desk concierge: browse & book on behalf, track bookings, contact supplier.

## Reference (rules and constraints)

- [[product-rules]] — Product "Avoid" list, key product decisions. Check before building any feature.
- [[tech-decisions]] — Tech stack, architecture rules, anti-patterns, Supabase/Stripe patterns.
- [[design-system]] — Brand essence, dashboard UI specs, email design, color palette, typography.

## Legal

- [[legal]] — Intermediary role, data handling, GDPR, contact info sharing rules, retention periods.

## Source Summaries

- [[source-deployment]] — Source digest of deployment reference: projects, env vars, crons, migrations, webhooks.
