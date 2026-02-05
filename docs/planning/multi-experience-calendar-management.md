# Multi-Experience Calendar Management Plan

## Current State

- `/supplier/experiences` - List of experiences (has header, no calendar currently)
- `/supplier/experiences/:id` - Experience detail (has calendar and upcoming sessions)
- `/supplier/experiences/:id/sessions` - Single experience calendar view
- `/supplier/sessions` - All sessions across all experiences (basic calendar, no add functionality)

## Desired Flow

1. **Experiences List** (`/supplier/experiences`):
   - Simple list of experiences
   - No header clutter
   - No calendar
   - CTA: "Manage Sessions" button → goes to `/supplier/sessions`

2. **Experience Detail** (`/supplier/experiences/:id`):
   - Experience information and settings
   - No calendar
   - No upcoming sessions section
   - CTA: "Manage Sessions" button → goes to `/supplier/sessions?experience=:id`

3. **Sessions Calendar** (`/supplier/sessions`):
   - **Primary calendar management page**
   - Shows all sessions across all experiences
   - Experience filter dropdown (All / Experience 1 / Experience 2 / ...)
   - When adding session: Select experience first (if not filtered)
   - Monthly and weekly views
   - Full session management (add, edit, clone, cancel)

## Implementation Approach

### SupplierSessions Page Enhancements

1. **Experience Filter**
   - Dropdown in calendar header
   - Options: "All Experiences" + list of experiences
   - When filtered: Only show sessions for that experience
   - When "All": Show all sessions with experience name on each session

2. **Add Session Functionality**
   - When clicking empty day or "Add Session" button:
     - If experience filter is set: Open modal for that experience
     - If "All Experiences": Show experience selector first, then session modal
   - Modal should allow selecting experience if not pre-selected

3. **Session Display**
   - Show experience name on each session (already has `showExperienceTitle` prop)
   - Color code or badge by experience (optional)
   - Click session → navigate to session detail

4. **Navigation**
   - From experience detail: `/supplier/sessions?experience=:id`
   - Pre-select experience in filter when coming from experience detail
   - Back button → return to experience detail or experiences list

## User Experience Flow

1. Supplier creates/modifies experience → `/supplier/experiences` or `/supplier/experiences/:id`
2. Supplier clicks "Manage Sessions" → `/supplier/sessions`
3. Calendar shows all sessions (or filtered by experience)
4. Supplier can:
   - Filter by experience
   - Add sessions (select experience if needed)
   - Edit/clone/cancel sessions
   - View session details
5. All session management happens in one place

## Benefits

- **Single source of truth** for session management
- **Easier to see** all sessions across experiences
- **Simpler navigation** - one calendar page instead of per-experience calendars
- **Better overview** of scheduling across all experiences
- **Consistent UX** - all session actions in one place
