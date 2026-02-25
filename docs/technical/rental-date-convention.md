# Rental Date Convention

## Decision

**`rental_end_date` is the last calendar day of the rental (inclusive).**

A guest who selects "start date: 1 April, 2 days" rents on 1 April and 2 April.
The stored `rental_end_date` is **2 April** (not 3 April).

## Rules

| Field | Meaning |
|-------|---------|
| `rental_start_date` | First day of rental |
| `rental_end_date` | Last day of rental (inclusive) |
| Duration (days) | `(end − start) / 1 day + 1` or equivalently `differenceInCalendarDays(end, start) + 1` |

### Computation at creation

```
rental_end_date = rental_start_date + (rentalDays − 1)
```

### Display

- Dashboard: `1.4. → 2.4. (2 days)`
- Calendar bar: covers 1.4. and 2.4. (2 cells)
- Emails: Start date 1.4., End date 2.4., Duration 2 days

### "Is active today" check

```
rental_start_date <= today && rental_end_date >= today
```

### Calendar overlap (week view)

```
rental_start_date <= weekEnd && rental_end_date >= weekStart
```

No "day before" or "day after" adjustments needed anywhere. The stored value is what the user sees.

## Why inclusive

- Our model is "start date + N days", not hotel-style check-in/check-out.
- Inclusive end removes off-by-one bugs: the displayed date range always matches the day count.
- "2 days" means two calendar dates (e.g. 1.4. and 2.4.), which is intuitive for activity/rental products.

## History

Introduced Feb 2026. Previously `rental_end_date` was exclusive (day after last day), causing mismatches between displayed dates and duration across dashboard, emails, and calendar.
