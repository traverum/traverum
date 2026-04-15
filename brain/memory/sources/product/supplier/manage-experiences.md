# Manage Experiences

## Goal

**Route:** `/supplier/experiences` (list) and `/supplier/experiences/:id` (edit)

This is where suppliers create and manage their experiences. The form should be powerful enough to configure any experience type but simple enough that a non-technical supplier can fill it out without confusion.

New experiences are created as `draft` status. Suppliers manually save changes — no autosave.

## For whom

Suppliers building their catalog. They need to describe their experience, set pricing, define availability, and publish when ready.

## Key stories

- Supplier creates a new experience → fills in details across collapsible sections → saves as draft → reviews → sets to active → experience appears in hotel widgets
- Supplier wants a promotion → creates a session with a custom price override → price shows in widget
- Supplier stops offering an experience → archives it → hidden from widgets but data preserved

## Design decisions

### Experience statuses

- **Active:** Live, visible in hotel widgets
- **Draft:** In progress, not visible (default for new experiences)
- **Archive:** Hidden but preserved

### Collapsible sections (not tabs)

The form uses collapsible sections, all collapsed by default:

1. **Basic Info:** Title*, category*, description* (min 50 chars), images, duration*, meeting point, available languages
2. **Location:** Address autocomplete with coordinates (required)
3. **Pricing:** Pricing type radio group (`per_person`, `flat_rate`, `base_plus_extra`), fields adapt by type, live price preview
4. **Availability:** Weekday checkboxes, start/end time, optional valid from/until dates
5. **Policies:** Cancellation policy selector (flexible/moderate). Weather/emergency refund is always included (industry standard, not configurable). "Accept booking requests" toggle is in the Availability section.

### Pricing types in form

- **Per person:** Extra person price, min/max participants
- **Flat rate:** Base price, max participants
- **Base + extra:** Base price, included participants, extra person price, min/max participants

Note: `per_day` (rental) pricing is not yet in the experience form. Rental experiences are created directly in the database.

### Session price override

When creating/editing sessions (via calendar), suppliers can set a custom price. The label adapts to pricing type ("per person" / "total" / "per day"). The override replaces the unit price, not the total.

## References

- Pricing logic: `docs/product/system/pricing.md`
- Cursor rule: `.cursor/rules/technical.mdc` (dashboard UI intent; full spec in `docs/design/dashboard-design-principles.md`)
- Code: `apps/dashboard/src/pages/supplier/ExperienceForm.tsx`
