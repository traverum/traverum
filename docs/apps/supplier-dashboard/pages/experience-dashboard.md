# Experience Dashboard

## What & Why

**WHAT:** Edit and manage a single experience. All experience details in one place with tabbed interface.

**WHY:** Suppliers need to quickly edit experience details without navigating to separate pages. Autosave ensures changes are saved automatically.

## Page Structure

**5 tabs:**
- Basic
- Pricing
- Availability
- Policies
- Settings

**Autosave indicator:** Top-right corner shows "Saving...", "Saved", or "Error" when changes are being saved.

---

## Tab 1: Basic

- **Title** (required, min 3 chars)
- **Category** (required, dropdown)
  - Food & Drink
  - Culture & History
  - Nature & Outdoors
  - Adventure & Sports
  - Wellness & Relaxation
  - Nightlife & Entertainment
- **Description** (required, min 50 chars, shows character count)
- **Images** (up to 10, drag to reorder, first image is cover)
- **Duration** (required, dropdown: 30min to All day)
- **Meeting Point** (optional text input)
- **Min Participants** (required, number)
- **Max Participants** (required, number)

---

## Tab 2: Pricing

- **Pricing Type** (required, radio group)
  - Per person
  - Flat rate
  - Base + extras

**When "Per person" selected:**
- Price per person (EUR, required, min €1.00)

**When "Flat rate" selected:**
- Total price (EUR, required, min €1.00)

**When "Base + extras" selected:**
- Base price (EUR, required, min €1.00)
- Guests included (required, min 1)
- Extra person price (EUR, optional)

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

- **Status** (dropdown)
  - Active
  - Draft
  - Archive
- **Delete Experience** (button with confirmation dialog)
