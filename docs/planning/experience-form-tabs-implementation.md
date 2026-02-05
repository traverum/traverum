# Experience Form - Tabbed Interface Implementation Plan

## Overview
Convert the experience form from collapsible sections to a tabbed interface, remove the header, and reorganize content for better UX.

## Tab Structure

### Tab 1: Basic Info
**Content:**
- Title (required)
- Description (required)
- Tags/Categories (optional)
- Images (optional, max 10)
- Duration (required)
- Meeting Point (optional)
- Max Participants (required)
- Min Participants (required) - moved from Pricing

**Completion Indicator:** ✓ when title ≥ 3 chars, description ≥ 50 chars, duration selected, max participants set

### Tab 2: Pricing
**Content:**
- Pricing Type selector (Per Person, Flat Rate, Base + Extra, Per Day Rental)
- Conditional fields based on pricing type:
  - **Per Person:** Price per person, Min/Max participants
  - **Flat Rate:** Base price, Max participants
  - **Base + Extra:** Base price, Included participants, Extra person price, Min/Max participants
  - **Per Day Rental:** Price per day, Min days, Max days (optional)
- Price preview/examples

**Completion Indicator:** ✓ when all required pricing fields are valid

### Tab 3: Availability
**Content:**
- Operating Hours:
  - Weekday toggles (Mon-Sun)
  - Start time picker
  - End time picker
- Seasonal Periods (optional):
  - Valid from date
  - Valid until date
- Allows Requests toggle

**Completion Indicator:** ✓ when at least one weekday selected

### Tab 4: Policies
**Content:**
- Cancellation Policy selector (Flexible, Moderate, Strict, Non-refundable)
- Force Majeure Refund toggle
- Policy preview text

**Completion Indicator:** ✓ when policy selected (always valid with defaults)

### Tab 5: Advanced (Edit Mode Only)
**Content:**
- Delete Experience button
  - Confirmation dialog
  - Same functionality as current ExperienceDashboard
- Experience Status selector (if needed)
- Other advanced settings (future)

**Note:** This tab only appears in edit mode (`/supplier/experiences/:id/edit`)

## UI Changes

### Remove Header
- Remove `<header>` section completely
- Back navigation handled by sidebar or browser back button
- Page title can be in tab area or removed entirely

### Tab Navigation
- Horizontal tabs at top of form
- Use shadcn/ui Tabs component
- Tab labels: "Basic Info", "Pricing", "Availability", "Policies", "Advanced"
- Active tab highlighted with primary color
- Completion indicator (checkmark) on completed tabs

### Form Layout
- Full-width container (no max-width constraint or wider)
- Tabs take full width
- Tab content in card with padding
- Save button sticky at bottom or top-right

### Save Button
- Always visible (sticky)
- Position: Bottom-right corner or top-right above tabs
- Text: "Create Experience" (new) or "Save Changes" (edit)
- Loading state: "Saving..."
- Validates all tabs before submission

## Implementation Steps

1. **Remove Header**
   - Delete header JSX
   - Remove header-related styling

2. **Add Tabs Component**
   - Import Tabs from `@/components/ui/tabs`
   - Wrap form content in Tabs
   - Create TabsList with all tab triggers
   - Move section content to TabsContent components

3. **Reorganize Content**
   - Move Min Participants from Pricing to Basic Info
   - Move Delete Experience to Advanced tab
   - Keep all validation logic intact

4. **Add Completion Indicators**
   - Show checkmark on tabs when section is complete
   - Use same completion logic as current FormSection

5. **Update Save Button**
   - Make it sticky
   - Ensure it validates all tabs
   - Keep existing save logic

6. **Handle Delete Experience**
   - Move delete functionality from ExperienceDashboard
   - Add to Advanced tab
   - Include confirmation dialog

## Technical Details

### Tab State Management
- Use Tabs component's built-in state
- Default to first tab (Basic Info)
- Preserve form state when switching tabs (React state)

### Validation
- Validate all tabs on save
- Show errors on relevant tab
- Scroll to first error if validation fails
- Tab indicators can show error state (red dot)

### Form Submission
- Same handleSubmit function
- Validates all fields across all tabs
- Shows toast on success/error
- Redirects appropriately

## Benefits
- Cleaner interface without header clutter
- Better organization with clear tab separation
- Easier navigation between sections
- Delete action safely separated in Advanced tab
- More professional, modern appearance
- All fields from documentation accessible
