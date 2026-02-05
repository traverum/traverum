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
- Previous/Next buttons
- Today button
- Month/Year display

**Mobile:** Shows list view instead of calendar

---

## Calendar Views

### Month View

- **Grid:** 7 columns (Mon-Sun), shows full month
- **Days:** Click day to switch to day view
- **Sessions:** Shown as pills on days with session count
- **Empty days:** Click to open quick-add popup
- **Today:** Highlighted with primary color

### Week View

- **Grid:** 7 columns (days), time slots (6am-11pm)
- **Sessions:** Positioned by time, shows experience title and time
- **Time slots:** Click to add session at that time
- **Current time:** Red line indicator

### Day View

- **Timeline:** Single day, time slots (6am-11pm)
- **Sessions:** Listed by time with experience title
- **Time slots:** Click to add session at that time
- **Current time:** Red line indicator

---

## Add Session

**Two ways to add:**
1. **Quick-add popup:** Click empty day/time slot
2. **Full modal:** Click "Add Session" button

### Quick-Add Popup

- **Experience** (dropdown, required)
- **Date** (date picker, required)
- **Time** (time picker, required)
- **Duration** (dropdown, auto-filled from experience)
- **Spots to sell** (number, required)

### Full Add Session Modal

**Single Session:**
- **Experience** (dropdown, required)
- **Date** (date picker, required, min: today, max: 6 months)
- **Time** (time picker, required)
- **Total spots** (number, required, max: experience max_participants)
- **Spots to sell** (number, required, max: total spots)
- **Custom price** (checkbox)
  - If checked: Price per person (EUR), Note (optional)
- **Repeat** (checkbox)
  - If checked: Frequency (Daily/Weekly), Until (date), Skip closed days (checkbox)

**Recurring Sessions:**
- Same fields as single, plus:
- **Frequency:** Daily or Weekly
- **Until:** End date
- **Skip closed days:** Option to skip days outside availability
- **Preview:** Shows session count and skipped days

---

## Session Actions

- **Click session:** Navigate to session detail page
- **Edit:** From session detail page
- **Cancel:** From session detail page

---

## Session Display

**Session pill shows:**
- Experience title (if multiple experiences)
- Time (start time)
- Available spots (if applicable)

**Colors:**
- Available: Primary color
- Full: Muted color
- Past: Grayed out
