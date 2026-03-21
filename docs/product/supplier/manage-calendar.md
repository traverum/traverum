# Manage Calendar

## Goal

**Route:** `/supplier/sessions`

The calendar is how suppliers manage their time. It's the most-used page in the dashboard.

A supplier should be able to open the calendar and immediately see: what's happening this week, where the gaps are, and what needs attention. Creating a session should be as fast as clicking on a time slot. Moving a session should be as easy as dragging it.

Pending booking requests should be visible on the calendar — the supplier shouldn't need to switch to another page to see what guests are asking for.

## For whom

Suppliers managing their daily and weekly availability. This is their primary workspace — they'll use it more than any other page.

## Key stories

- Supplier opens calendar Monday morning → sees the week's sessions at a glance → notices a gap on Wednesday → clicks the time slot → creates a new session in seconds
- Supplier gets a request for a different time → sees the pending request indicator on that day → accepts or declines from the calendar
- Supplier needs to move a session → drags it to a new time → saves automatically
- Supplier wants to offer daily sessions next week → creates a recurring session with "repeat daily" → sees preview of all sessions → confirms

**What should feel fast:**
- Seeing today's schedule
- Creating a new session
- Moving a session to a different time

**What should be obvious:**
- Which sessions have bookings vs. are still available
- Which days have pending requests
- Past sessions should fade — the focus is on what's ahead

## Design decisions

### View modes

- **Month view:** Overview grid, session pills on days (max 3 visible, "+X more" indicator). Click a day to switch to day view.
- **Week view:** Primary working view. Time-based grid (7am-11pm), sessions positioned by time. Drag sessions to reschedule (15-min snap). Click time slot to create session.
- **Day view:** Single day timeline. Same interactions as week view.
- **Mobile:** List view instead of calendar grid.

### Session interactions

- **Click session:** Quick-edit popup at click position (no page redirect). Shows summary, status, booking info, price editing, cancel/delete actions.
- **Drag session:** Saves automatically on drop.
- **Create session:** Click time slot → popup with experience dropdown, date, start/end time, optional repeat (daily/weekly), optional custom price.
- **Recurring sessions:** When repeat enabled — choose frequency + end date, shows preview of total sessions to be created.

### Rental requests on calendar

Rental requests appear on the calendar on their start date as pending request indicators. Since rentals don't create sessions, they only appear as pending — once accepted, they have no calendar presence. Suppliers can Accept/Decline rental requests directly from the calendar popup.

### Session quick-edit popup

Click a session → popup at click position. Shows:
- Date, time, language (read-only)
- Price (editable inline)
- Actions: Cancel session (if booked), Delete session (if no bookings), Duplicate, View booking details

### Visual design

- **Multi-experience mode:** Each experience gets a unique color via `getExperienceColor()`. Booked sessions use solid tint, available sessions use ghost/dashed style.
- **Single-experience mode:** Booked = `bg-primary/10 text-primary`, Available = `bg-primary/5` with dashed left border.
- **Cancelled sessions:** Muted background with strikethrough text.
- Past dates/sessions: dimmed with reduced opacity.
- Current time: red line indicator.
- Session pills show: time (HH:MM), language (if set), experience title (if multi-experience), status badge ("Booked" or "x" for cancelled).

### Calendar weeks

Always start from Monday (European convention). Never Sunday.

## References

- Booking management: `docs/product/supplier/handle-bookings.md`
- Cursor rule: `.cursor/rules/conventions.mdc` (dashboard UI intent; full spec in `docs/design/dashboard-design-principles.md`)
- Code: `apps/dashboard/src/pages/supplier/SupplierSessions.tsx`
- Components: `apps/dashboard/src/components/sessions/`
- Calendar utils: `apps/dashboard/src/components/sessions/calendar-utils.ts`
