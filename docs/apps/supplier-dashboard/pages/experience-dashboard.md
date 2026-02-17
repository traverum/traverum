Reviewed by Elias on 07-02-2026

# Experience Dashboard

## What & Why

**WHAT:** Edit and manage a single experience. All experience details in one place with tabbed interface.

**WHY:** Suppliers need to quickly edit experience details without navigating to separate pages. Autosave ensures changes are saved automatically.

## Header

- **Status Selector** (dropdown in header, next to tabs)
  - Active
  - Draft
  - Archived

## Tab 1: Basic

- **Title**
- **Category**
- **Description**
- **Images**
- **Duration**
- **Available Languages**
- **Location**
- **Meeting Point** (optional text input)
- **Minimum Guests** (required for going live, number, hidden when pricing type is "Per day (Rental)" — guests cannot select fewer than this in the widget)
- **Max Participants** (required for going live, number)

---

## Tab 2: Pricing

- **Pricing Type** (required, radio group)
  - Per person
  - Flat rate
  - Base + extras
  - Per day (Rental)

**When "Per person" selected:**
- Price per person (EUR, required, min €1.00)

**When "Flat rate" selected:**
- Total price (EUR, required, min €1.00)

**When "Base + extras" selected:**
- Base price (EUR, required, min €1.00)
- Guests included (required, min 1)
- Extra person price (EUR, optional)

**When "Per day (Rental)" selected:**
- Price per day (EUR, required, min €1.00) — stored in `price_per_day_cents`
- Minimum rental period (days, required, min 1) — stored in `min_days`
- Maximum rental period (days, optional) — stored in `max_days`

**Session Price Override** (in session create/edit popups):
- Label is dynamic based on pricing type: "per person" / "total" / "per day"
- Override replaces the unit price and scales with quantity (not a flat total)

---

## Tab 3: Availability

- **Available days** (checkboxes, at least 1 required)
  - Monday through Sunday
- **Start time** (time picker, 30-min increments)
- **End time** (time picker, 30-min increments)
- **Seasonal availability** (optional toggle)
  - Valid from (date picker)
  - Valid until (date picker)

---

## Tab 4: Policies

- **Cancellation Policy** (required, radio group)
  - Flexible (Free cancellation up to 24 hours before)
  - Moderate (Free cancellation up to 7 days before) - Recommended
  - Strict (No refunds after booking is confirmed)
  - Non-refundable (No refunds for guest cancellations)
- **Refund for weather cancellations** (switch)
- **Accept booking requests** (switch)

---

## Tab 5: Settings

- **Delete Experience** (button with confirmation dialog)
