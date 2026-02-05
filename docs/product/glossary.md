# Glossary

> Consistent terminology for Traverum. Use these exact terms in code, UI, and documentation.

## Actors

| Term | Definition | Also Known As |
|------|------------|---------------|
| **Supplier** | Business that creates and delivers experiences. Receives 80% of booking revenue. | Experience provider, operator, vendor |
| **Hotel** | Business that embeds the widget and sells supplier experiences. Earns 12% commission. | Distributor, partner, property |
| **Guest** | End traveler who books an experience through a hotel's widget. | Customer, traveler, booker |

## Core Entities

| Term | Definition |
|------|------------|
| **Experience** | A bookable activity with title, description, pricing, and availability. Owned by one supplier, sold through many hotels. |
| **Session** | A specific date and time slot when an experience can be booked. Has capacity limits. |
| **Reservation** | A booking request before payment. Statuses: `pending`, `approved`, `declined`, `expired`. |
| **Booking** | A confirmed, paid reservation. Statuses: `confirmed`, `completed`, `cancelled`. |
| **Widget** | Embeddable booking interface that hotels place on their websites. |

## Booking States

| Term | Definition |
|------|------------|
| **Pending** | Guest submitted request, waiting for supplier response (48h window). |
| **Approved** | Supplier accepted, waiting for guest payment (24h window). |
| **Declined** | Supplier rejected the request. Terminal state. |
| **Expired** | Timeout occurred (no supplier response or no payment). Terminal state. |
| **Confirmed** | Guest paid, experience upcoming. |
| **Completed** | Experience delivered, funds transferred to supplier. Terminal state. |
| **Cancelled** | Booking cancelled by guest or supplier, refund issued. Terminal state. |

## Money Terms

| Term | Definition |
|------|------------|
| **Total amount** | Full price guest pays. Stored in cents. |
| **Supplier amount** | Transferred after completion. |
| **Hotel commission** | Paid monthly in batch. |
| **Platform fee** | Retained by Traverum. |

## Time Windows

| Term | Duration | Purpose |
|------|----------|---------|
| **Response deadline** | Supplier must accept or decline |
| **Payment deadline** | Guest must pay after approval |
| **Cancellation window** | Guest can cancel for full refund |
| **Auto-complete window** | Booking auto-completes if no response |
