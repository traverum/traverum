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
| **Session** | A specific date and time slot when an experience can be booked. Has capacity limits. Not used for rental experiences. |
| **Reservation** | A booking request before payment. Statuses: `pending`, `approved`, `declined`, `expired`. |
| **Booking** | A confirmed, paid reservation. Statuses: `confirmed`, `completed`, `cancelled`. |
| **Widget** | Embeddable booking interface that hotels place on their websites. |
| **Rental** | An experience with `pricing_type = 'per_day'`. Priced by day and quantity (units). Always request-based, no sessions, no inventory tracking. |

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

## Rental-Specific Terms

| Term | Definition |
|------|------------|
| **Quantity** | Number of units a guest wants to rent (e.g. 2 vespas). Stored in `participants` field. |
| **Max quantity per booking** | Maximum units a guest can request at once. Stored in `max_participants`. Not inventory — just a per-booking limit. |
| **Rental days** | Duration of the rental period. Guest selects from a dropdown (min/max constrained). |
| **Start date** | The day the rental begins. Stored in `requested_date` and `rental_start_date`. |
| **End date** | Computed server-side as start date + days. Stored in `rental_end_date`. |

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
