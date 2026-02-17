# Calendar

## What & Why

**WHAT:** Visual calendar showing all sessions across all experiences. Create and manage sessions directly from calendar view.

**WHY:** Suppliers need to see when sessions are scheduled, spot gaps in availability, and quickly add sessions without navigating to separate pages.

## Page Structure

**3 view modes:**
- Month (grid calendar)
- Week (time-based grid)
- Day (single day timeline)

**Navigation:**
- View mode tabs (Month/Week/Day)
- Previous/Next buttons
- Today button
- Month/Year display

**Mobile:** Shows list view instead of calendar grid

---

## Calendar Views

### Month View

- **Grid:** 7 columns (Mon-Sun), shows full month
- **Days:** Click day to switch to day view
- **Sessions:** Shown as pills on days (up to 3 visible, then "+X more" indicator)
- **Today:** Highlighted with primary color background
- **Past dates and sessions:** Dimmed with reduced opacity

### Week View

- **Grid:** 7 columns (days), time slots (7am-11pm)
- **Sessions:** Positioned by time, shows experience title and time
- **Sessions:** Can be dragged to change time (snaps to 15-minute intervals)
- **Time slots:** Click hour slot to add session at that time
- **Current time:** Red line indicator (only on today's column)

### Day View

- **Timeline:** Single day, time slots
- **Sessions:** Positioned by time with experience title
- **Sessions:** Can be dragged to change time (snaps to 15-minute intervals)
- **Time slots:** Click hour slot to add session at that time
- **Current time:** Red line indicator (only if viewing today)

---

## Add Session

**How to add:**
- Click time slot in Week or Day view → opens Session Create Popup at click position

### Session Create Popup

**Basic Fields:**
- **Experience** (dropdown, required)
- **Date** (date picker, required, prevents past dates)
- **Start time** (time picker, required)
- **End time** (time picker, required, auto-calculated from experience duration)
- **Repeat toggle** (button)
  - If enabled: Frequency (Daily/Weekly), End date, Session count preview

**Advanced Options** (expandable):
- **Custom price** (EUR per person, optional, shows experience default as placeholder)

**Validation:**
- Prevents creating sessions in the past (date and time checked)

**Recurring Sessions:**
- When Repeat is enabled:
  - **Frequency:** Daily or Weekly
  - **End date:** Date picker (min: start date)
  - **Preview:** Shows total session count that will be created

---

## Session Actions

- **Click session:** Opens quick-edit popup (no page redirect)
- **Drag session** (Week/Day view): Drag to change time (saves automatically)

### Session Quick-Edit Popup

Opens at click position. Shows:

- **Summary:** Experience name, date, time
- **Status badge:** Available / Booked / Cancelled
- **Booking info:** If booked — guest name, participants count
- **Price:** Current price per person (editable inline, only if available)
- **Quick actions:**
  - "View Full Details" button → navigates to Booking Management page filtered to that session
  - "Cancel Session" button (with confirmation, triggers refund if has booking)
  - "Delete Session" button (with confirmation, only if no bookings)

---

## Session Display

**Session pill shows:**
- Time (start time, e.g., "09:00")
- Experience title (if enabled, shown as "· Title")
- Status indicator: Available (no booking) or Booked (has booking)

**Colors:**
- Available: Success color (green tint)
- Booked: Primary color (blue tint)
- Cancelled: Muted color with strikethrough

---

## Pending Requests on Calendar

Pending booking requests (including rental requests) appear on the calendar as indicators on their requested dates.

- **Click a day with pending requests** → opens a popup showing request cards
- Request cards use the same design as the Booking Management page (see [booking-management.md](./booking-management.md))
- Suppliers can Accept or Decline requests directly from the calendar popup
- **Rental requests** show on their `requested_date` (start date) and display rental-specific info (date range, duration, quantity/units)
- **Session requests** show date and time with people count

### Rental Requests on Calendar

Rental requests appear on the calendar on their start date. Since rentals don't create sessions, they only appear as pending request indicators — once accepted, they do not show as calendar events (there is no session to display).
