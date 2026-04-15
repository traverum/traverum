# Vision

> Human-owned. This is the north star. AI reads but never modifies without explicit approval.

## Why Traverum exists

Hotels want to offer local experiences to guests. Suppliers want to reach tourists. Guests want authentic local things to do and trust their hotel to recommend them.

No one has solved this well. Hotel experience programs are expensive to build and operate. Supplier marketing doesn't reach travelers at the right time. Generic booking platforms don't have hotel trust.

Traverum is the infrastructure that connects all three parties. Hotels embed a branded widget. Suppliers manage availability. Guests book and pay. Everyone earns their share.

## What we're building

**Booking infrastructure that makes local experiences bookable — through hotels (white-label) and directly through Veyond.**

- **Traverum** is the company. The technology, the platform, the operations.
- **Veyond** is the customer-facing brand. Guests see Veyond when booking directly. Hotels never see the Veyond name — to them, it's their own experience program.

### Three parties

| Party | What they want | What they get from us |
|---|---|---|
| Hotels | Offer experiences without building a program | White-label widget, zero operations, commission revenue |
| Suppliers | Reach tourists through hotels | Distribution channel, booking management, guaranteed payments |
| Guests | Authentic local experiences, easy booking | Curated selection, trusted source (hotel), simple checkout |

### Two channels

| Channel | Brand | Who sees it | How it works |
|---|---|---|---|
| Hotel widget | Hotel's own brand (white-label) | Hotel guests | Embedded on hotel website, emails, QR codes. Guest never knows Traverum exists. |
| Veyond direct | Veyond | Anyone | Direct discovery and booking under the Veyond brand. |

Same code, same engine. `hotel_id = null` means Veyond direct.

### One platform

One codebase, one database, one booking engine. Both channels share everything. A supplier manages one calendar, not two. A booking is a booking — channel is metadata, not architecture.

## The end state

<!-- HUMAN: Define what "done" looks like for Traverum. Some prompts: -->
<!-- - How many hotels / suppliers / bookings per month means we've won? -->
<!-- - Geographic scope: Lake Maggiore first, then Italy, then Europe? -->
<!-- - Revenue model: commission split is the business — what's the target? -->
<!-- - Product completeness: what features are table stakes vs. nice-to-have? -->
<!-- - When does Veyond direct become a primary channel vs. hotel-first? -->

*This section is intentionally left for human input. The AI can draft options but the founder defines the vision.*

## Non-goals

Things we are explicitly NOT building:

- **Not a marketplace.** We don't do SEO-driven discovery, user reviews, or price comparison. Hotels curate; Veyond editorializes.
- **Not a channel manager.** We don't sync with Viator, GetYourGuide, or other OTAs. We are a channel, not a meta-channel.
- **Not a hotel PMS.** We don't manage rooms, check-ins, or housekeeping. We plug into the hotel's existing workflow.
- **Not an activity creator.** We don't design experiences. Suppliers bring their own.

## Success metrics

<!-- HUMAN: Define your key metrics. Some suggestions: -->
<!-- - Monthly booking volume -->
<!-- - Hotel activation rate (hotels with >1 booking/month) -->
<!-- - Supplier retention (% active after 3 months) -->
<!-- - Commission revenue (platform take rate) -->
<!-- - Guest satisfaction (completion rate, repeat bookings) -->

*This section is intentionally left for human input.*

## Principles that don't change

1. **The hotel is invisible infrastructure.** Through the hotel channel, Traverum never surfaces. The hotel looks competent. The guest trusts the hotel.
2. **The supplier is protected.** Guest contact info stays hidden until payment. Deadlines create urgency. Suppliers get paid.
3. **Every flow ends in a commission split.** This is the business model. Hotel gets a share, supplier gets the majority, platform takes a cut.
4. **Simple over clever.** We serve Italian nonne and Finnish designers. If it's confusing, it's wrong.
5. **Two channels, one engine.** Never fork the code, never fork the booking logic. Channel is a property, not an architecture boundary.
