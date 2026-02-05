# Inline Experience Editing - Implementation Plan

## Overview
Move all experience editing functionality from the form page to the experience detail page (`/supplier/experiences/:id`). Make all fields editable inline without a separate form page.

## Creating New Experiences

### Option 1: Quick Create + Edit (Recommended)
1. User clicks "Create Experience" from experiences list
2. Creates a minimal experience with:
   - Title: "New Experience" (editable)
   - Status: "draft"
   - Default values for required fields
3. Immediately navigates to `/supplier/experiences/:id` (edit mode)
4. User edits inline to complete the experience

### Option 2: Modal Creation
1. User clicks "Create Experience"
2. Opens modal with minimal required fields (title, description)
3. Creates experience and navigates to detail page
4. User continues editing inline

**Decision: Option 1** - Simpler, faster, consistent with edit flow

## Page Structure

### Experience Detail Page (`/supplier/experiences/:id`)

**Tab 1: Basic Info**
- Title (editable text input)
- Description (editable textarea)
- Tags/Categories (editable tag selector)
- Images (editable image uploader)
- Duration (editable select)
- Meeting Point (editable text input)
- Max Participants (editable number input)
- Min Participants (editable number input)

**Tab 2: Pricing**
- Pricing Type (editable radio group)
- Conditional pricing fields (all editable)
- Price preview (read-only, updates automatically)

**Tab 3: Availability**
- Operating Hours (editable)
- Seasonal Periods (editable)
- Allows Requests (editable toggle)

**Tab 4: Policies**
- Cancellation Policy (editable)
- Force Majeure Refund (editable toggle)

**Tab 5: Advanced** (Edit Mode Only)
- Delete Experience button
- Experience Status (editable select)

## Editing Behavior

### Inline Editing
- Fields are editable by default (no "Edit" button needed)
- Auto-save on blur/change (debounced)
- Visual indicators for unsaved changes
- Save button for manual save (always visible, sticky)

### Auto-save Strategy
- Debounce: 2 seconds after last change
- Save indicator: Show "Saving..." / "Saved" / "Error"
- Optimistic updates: Update UI immediately, sync in background

### Manual Save
- Sticky "Save" button (top-right or bottom-right)
- Validates all fields before saving
- Shows validation errors inline
- Success toast on save

## UI/UX

### Visual Design
- Editable fields look like normal inputs (not disabled)
- Subtle border on hover/focus
- Save indicator near save button
- Tab completion indicators (checkmarks)

### Navigation
- No header needed (sidebar navigation)
- Breadcrumb: Experiences > [Experience Name]
- Back button in sidebar or breadcrumb

### Empty/New Experience State
- Show placeholder text for empty fields
- Guide user: "Start by adding a title..."
- Auto-focus first empty required field

## Implementation Details

### State Management
- Use React state for all form fields
- Load existing data on mount (edit mode)
- Track dirty state (has unsaved changes)
- Track saving state

### Validation
- Real-time validation on blur
- Show errors inline below fields
- Disable save if validation fails
- Highlight invalid tabs

### API Calls
- Auto-save: PATCH `/experiences/:id` (debounced)
- Manual save: Same endpoint, immediate
- Create: POST `/experiences` (minimal data), then navigate

## Benefits
- Single page for viewing and editing
- No navigation between pages
- Faster workflow
- Consistent editing experience
- All fields accessible via tabs
