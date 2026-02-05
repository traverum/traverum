# Experience Form - Tabbed Interface Plan

## Current State
- Form uses collapsible sections (Basic Info, Pricing, Availability, Policies)
- Header with back button and title
- Delete experience is in ExperienceDashboard (not in form)

## Proposed Changes

### 1. Remove Header
- Remove the sticky header with back button and title
- Keep back navigation accessible via sidebar or breadcrumbs (if implemented)
- Form starts directly with content

### 2. Tab Structure

**Tab 1: Basic Info**
- Title
- Description
- Tags/Categories
- Images
- Duration
- Meeting Point
- Max Participants
- Min Participants (moved from Pricing)

**Tab 2: Pricing**
- Pricing Type (Per Person, Flat Rate, Base + Extra, Per Day Rental)
- All pricing-related fields based on type
- Price preview/examples
- Min/Max participants (if relevant to pricing type)

**Tab 3: Availability**
- Operating Hours (weekdays, start/end time)
- Seasonal Periods (valid from/until)
- Allows Requests toggle

**Tab 4: Policies**
- Cancellation Policy
- Force Majeure Refund toggle

**Tab 5: Advanced** (or "Settings")
- Delete Experience button (only in edit mode)
- Experience Status (Active/Draft/Archive) - if needed
- Other advanced settings

### 3. Tab Navigation
- Horizontal tabs at top of form
- Active tab highlighted
- Tab indicators show completion status (checkmark when complete)
- Save button always visible (sticky footer or top-right)
- Form validation works across all tabs

### 4. User Experience
- Tabs allow quick navigation between sections
- No need to expand/collapse sections
- All content visible when tab is active
- Save button saves all tabs
- Validation shows errors on relevant tab

## Implementation Details

### Tab Component
- Use shadcn/ui Tabs component
- Each tab contains the form fields from current sections
- Maintain all existing validation logic
- Preserve form state when switching tabs

### Save Button
- Sticky at bottom or top-right corner
- Validates all tabs before saving
- Shows loading state during save
- Success toast and redirect after save

### Delete Experience
- Only shown in edit mode
- Moved to "Advanced" tab
- Confirmation dialog before deletion
- Same functionality as current implementation

## Benefits
- Cleaner interface without header
- Better organization with tabs
- Easier navigation between sections
- Delete action separated from main content
- More professional appearance
