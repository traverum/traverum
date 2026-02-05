# Experience Selection - Choose Experiences to Offer

## 1. Purpose

As a hotel or hospitality owner, I want to see the full list of experiences I can offer near my hotels, choose which ones to add, and add them to my platform.

## 2. URL/Location

- **Route:** `/hotel/selection`
- **Component:** `apps/dashboard/src/pages/hotel/ExperienceSelection.tsx`
- **Layout:** Uses DashboardLayout

## 3. Information Displayed

### Header Section
- Page title: "Experience Selection"
- Description: "Select experiences to display in your booking widget. Guests will be able to book these directly."

### Search and Stats
- Search input: Filter experiences by title, supplier name, or tags
- Selected count badge: Shows number of currently selected experiences

### Experience List
For each experience:
- Checkbox: Toggle selection on/off
- Cover image (or placeholder)
- Experience title
- Supplier name and city
- Price (formatted in EUR)
- Description (truncated)
- Duration (e.g., "2h 30min" or "All day")
- Max participants
- Meeting point (if available)
- Tags (up to 3 shown, with "+X more" if more exist)
- Card styling: Selected experiences have ring border and highlighted background

### Empty States
- No experiences available: "No experiences available yet."
- No search results: "No experiences match your search."

## 4. User Actions

| Action | Location | Result |
|--------|----------|--------|
| Click checkbox | Experience card | Toggle selection (add/remove from widget) |
| Click card | Experience card | Toggle selection |
| Type in search | Search input | Filter experiences list |
| Select experience | Checkbox | Experience added to widget (distribution created) |
| Deselect experience | Checkbox | Experience removed from widget (distribution deactivated) |

## 5. Business Rules

- Only active experiences (`experience_status = 'active'`) are shown
- Excludes experiences owned by the hotel itself
- Selecting an experience creates a distribution record with default commissions (80% supplier, 12% hotel, 8% platform)
- Deselecting sets `is_active = false` on existing distribution (doesn't delete)
- Re-selecting reactivates existing distribution
- Selected experiences immediately appear in the hotel's booking widget

## 6. States

### Loading State
- Spinner while experiences load

### Empty State
- Message: "No experiences available yet."
- Shown when no active experiences exist

### Search Empty State
- Message: "No experiences match your search."
- Shown when search returns no results

### Success State
- Toast notification on successful selection/deselection
- List updates immediately

### Error State
- Error toast if selection fails
- Previous state maintained
