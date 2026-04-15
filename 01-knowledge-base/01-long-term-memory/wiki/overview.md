---
type: overview
created: 2026-04-15
updated: 2026-04-15
sources:
  - vision.md
  - system/channels.md
  - platform/_overview.md
tags: [traverum, veyond, vision, platform]
---

# Traverum — Overview

Traverum is booking infrastructure that makes local experiences bookable — through hotels (white-label) and directly through Veyond.

## Why it exists

Hotels want to offer local experiences to guests. Suppliers want to reach tourists. Guests want authentic local things to do and trust their hotel to recommend them. No one has solved this well. Traverum is the infrastructure that connects all three parties.

## Three parties

| Party | What they want | What they get |
|-------|---------------|---------------|
| Hotels | Offer experiences without building a program | White-label widget, zero operations, commission revenue |
| Suppliers | Reach tourists through hotels | Distribution channel, booking management, guaranteed payments |
| Guests | Authentic local experiences, easy booking | Curated selection, trusted source (hotel), simple checkout |

See [[guest]], [[supplier]], [[hotel]], [[receptionist]] for detailed persona pages.

## Two channels

| Channel | Brand | `hotel_id` | Commission |
|---------|-------|-----------|------------|
| Hotel widget | Hotel's own (white-label) | Set | Three-way: supplier + hotel + platform |
| Veyond direct | Veyond | `null` | Two-way: supplier + platform |

Same code, same engine. Channel is metadata, not architecture. See [[channels]] for full details.

**Traverum** is the company. **Veyond** is the customer-facing brand guests see when booking directly. Hotels never see the Veyond name.

## One platform

One codebase, one database, one booking engine. Both channels share everything. A supplier manages one calendar, not two. A booking is a booking — channel is a property. See [[booking]] for the core flow.

## Platform admin

The Traverum internal team operates via the Admin app (`apps/admin`). They manage partner onboarding, monitor bookings, handle payouts, resolve disputes, and use "act as partner" to debug issues. Success: onboard a partner in under 5 minutes, resolve a booking issue without touching the database.

## Non-goals

- **Not a marketplace.** No SEO-driven discovery, user reviews, or price comparison.
- **Not a channel manager.** No sync with Viator, GetYourGuide, or other OTAs.
- **Not a hotel PMS.** No room management, check-ins, or housekeeping.
- **Not an activity creator.** Suppliers bring their own experiences.

## Principles

1. **The hotel is invisible infrastructure.** Through the hotel channel, Traverum never surfaces.
2. **The supplier is protected.** Contact info stays hidden until payment/guarantee. Suppliers get paid.
3. **Every flow ends in a [[commission]] split.** This is the business model.
4. **Simple over clever.** Italian nonne and Finnish designers must both understand it.
5. **Two [[channels]], one engine.** Never fork the code or the booking logic.
