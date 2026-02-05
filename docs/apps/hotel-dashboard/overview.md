# Hotel Dashboard Overview

> Portal for hotels and hospitality businesses to curate and offer experiences to their guests.

## Purpose

Enable hotels to:
1. Browse available experiences from suppliers
2. Select which experiences to offer to guests
3. Add selected experiences to their booking widget

## User Profile

**Primary user**: Hotel or hospitality owner/manager
**Technical comfort**: Low to medium — must be simple
**Usage frequency**: Monthly or as needed when updating offerings
**Device**: Desktop primary

## Design Principles

- **Simple selection**: Easy browse and select interface
- **No training required**: A hotel owner should understand the dashboard without documentation
- **Immediate visibility**: Selected experiences appear in booking widget right away

## Navigation Structure

```
Hotel Dashboard
└── Experience Selection    # Browse and select experiences to offer
```

## MVP Scope

| Feature | MVP |
|---------|-----|
| View available experiences | ✓ |
| Search/filter experiences | ✓ |
| Select/deselect experiences | ✓ |
| See selected count | ✓ |

## Entry Points

1. **Login** → Experience Selection page
2. **Dashboard navigation** → Experience Selection

## Related Documents

| Topic | Document |
|-------|----------|
| Page specifications | `/apps/hotel-dashboard/pages/` |
| Experience data model | `/docs/data/entities.md` |
| Design patterns | `/docs/design/style-guide.md` |
