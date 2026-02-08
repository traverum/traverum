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

**Mobile:** Shows list view instead of calendar

---

## Calendar Views

### Month View

- **Grid:** 7 columns (Mon-Sun), shows full month
- **Days:** Click day to switch to day view
- **Sessions:** Shown as pills on days (up to 3 visible, then "+X more" indicator)
- **Today:** Highlighted with primary color background
- **Closed days:** Shows "Closed" indicator if outside availability rules

### Week View

- **Grid:** 7 columns (days), time slots (7am-11pm)
- **Sessions:** Positioned by time, shows experience title and time
- **Sessions:** Can be dragged to change time (drag and drop)
- **Time slots:** Click to add session at that time
- **Current time:** Red line indicator (only on today's column)

### Day View

- **Timeline:** Single day, time slots (7am-11pm)
- **Sessions:** Listed by time with experience title
- **Sessions:** Can be dragged to change time (drag and drop)
- **Time slots:** Click to add session at that time
- **Current time:** Red line indicator (only if viewing today)

---

## Add Session

**One way to add:**
- **Session Create Popup:** Click time slot in Week or Day view (opens popup at click position)

### Session Create Popup

**Basic Fields:**
- **Experience** (dropdown, required)
- **Date** (date picker, required)
- **Start time** (time picker, required)
- **End time** (time picker, required, auto-calculated from experience duration)
- **Repeat toggle** (button)
  - If enabled: Frequency (Daily/Weekly), End date, Session count preview

**Advanced Options** (expandable):
- **Spots** (number, default: experience max_participants)
- **Custom price** (EUR per person, optional, shows experience default as placeholder)

**Recurring Sessions:**
- When Repeat is enabled:
  - **Frequency:** Daily or Weekly
  - **End date:** Date picker (min: start date)
  - **Preview:** Shows total session count that will be created

---

## Session Actions

- **Click session:** Opens quick-edit popup (no page redirect)
- **Drag session** (Week/Day view): Drag to change time

### Session Quick-Edit Popup

Opens at click position (same pattern as Session Create Popup). Shows:

- **Summary:** Experience name, date, time, duration
- **Capacity:** Bookings count / spots total (editable)
- **Status badge:** Available / Full / Cancelled
- **Quick actions:**
  - "Cancel Session" button (with confirmation)
  - "Delete Session" button (only if no bookings)
- **"View Full Details"** button → navigates to Booking Management page filtered to that session (`/supplier/bookings?session=<id>`)

---

## Session Display

**Session pill shows:**
- Time (start time, e.g., "09:00")
- Experience title (if showExperienceTitle is enabled, shown as "· Title")
- Bookings count (format: "X/Y" where X = bookings, Y = total spots)
- Price note (if custom price with note exists)

**Colors:**
- Available: Success color (green tint)
- Full: Warning color (yellow/orange tint)
- Cancelled: Muted color with strikethrough
