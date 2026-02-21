# Sessions Calendar (Supplier Page)

## Purpose

**Route:** `/supplier/sessions`

The calendar page in the supplier dashboard. This is where suppliers see all their sessions across all experiences and manage their availability.

For the calendar system design (views, interactions, visual design), see the cross-cutting calendar doc.

## Key decisions

- Three view modes: Month, Week, Day (see calendar system doc)
- Add session by clicking a time slot in Week or Day view
- Quick-edit popup on session click (no page redirect)
- Pending requests visible on calendar days
- Session pills show time + experience title + booking status

## Reference

- Calendar system: `docs/purpose/calendar.md`
- Code: `apps/dashboard/src/pages/supplier/SupplierSessions.tsx`
- Components: `apps/dashboard/src/components/sessions/`
