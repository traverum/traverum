# Experience Form - Create/Edit Experience

## 1. Purpose

Allows suppliers to create new experiences or edit existing ones, collecting all necessary information including basic details, pricing, availability, and policies.

## 2. URL/Location

- **Create Route:** `/supplier/experiences/new`
- **Edit Route:** `/supplier/experiences/:id/edit`
- **Component:** `apps/dashboard/src/pages/supplier/ExperienceForm.tsx`
- **Layout:** Uses DashboardLayout

## 3. User Goals

- Create a new experience with all required information
- Edit an existing experience
- Set pricing structure (per person, fixed rate, base + extra, per day rental)
- Configure availability rules (operating hours, seasonal periods)
- Set cancellation policies
- Upload and manage experience images
- Save draft or publish experience

## 4. Information Displayed

### Form Sections

- Section styling: Warm white background `#FEFCF9`, subtle borders for distinction
- Inputs: Borderless with inset focus shadow, 32px height, 3px radius, background `rgba(242, 241, 238, 0.6)`
- Buttons: Primary actions use Traverum teal `#0D9488`, 28px height, 3px radius, `4px 12px` padding

**Section 1: Basic Information**
- **Title** (required)
  - Type: Text input (borderless, 32px height, 3px radius)
  - Validation: Min 3 characters, max 100 characters
  - Auto-generates slug on blur
  - Helper text: Use "?" icon with hover tooltip (not always-visible)
- **Description** (required)
  - Type: Textarea (rich text support)
  - Validation: Min 50 characters, max 5000 characters
  - Character count indicator (visual, subtle)
- **Tags** (optional)
  - Type: Tag selector (multi-select)
  - Predefined tags + custom tags
  - Max 10 tags
- **Duration** (required)
  - Type: Select dropdown
  - Options: 30min, 45min, 1h, 1h 30min, 2h, 2h 30min, 3h, 4h, 5h, 6h, 7h, All day
  - Stored as minutes (480 for "All day")
- **Meeting Point** (optional)
  - Type: Text input
  - Max 200 characters
- **Max Participants** (required)
  - Type: Number input
  - Validation: Min 1, max 100
  - Default: 10
  - **Note:** For rental experiences (Per Day pricing), this field represents maximum quantity available (e.g., "5 Vespas")
- **Images** (optional but recommended)
  - Type: Image uploader
  - Max 10 images
  - First image is cover image
  - Drag to reorder
  - Delete individual images

**Section 2: Pricing**
- **Pricing Type** (required)
  - Type: Radio group
  - Options:
    - **Per Person:** Each participant pays the same price (e.g., wine tastings, tours)
    - **Fixed Price:** Total price regardless of participants (e.g., private charters)
    - **Base + Extra:** Base price for X people, additional cost per extra person (e.g., safari jeeps)
    - **Per Day (Rental):** Time-based pricing for rentals (e.g., Vespa, car rentals)
- **Base Price** (required for Fixed Price and Base + Extra)
  - Type: Number input (cents)
  - Display: Shows as €XX.XX
  - Validation: Min €1.00 (100 cents)
  - **Shown when:** Fixed Price or Base + Extra selected
- **Price Per Person** (required for Per Person)
  - Type: Number input (cents)
  - Display: Shows as €XX.XX
  - Validation: Min €1.00 (100 cents)
  - **Shown when:** Per Person selected
  - Label: "Price per person"
- **Price Per Day** (required for Per Day Rental)
  - Type: Number input (cents)
  - Display: Shows as €XX.XX
  - Validation: Min €1.00 (100 cents)
  - **Shown when:** Per Day (Rental) selected
  - Label: "Price per day"
- **Included Participants** (required if Base + Extra)
  - Type: Number input
  - Validation: Min 1, max max_participants
  - **Shown when:** Base + Extra selected
  - Label: "Number of people included in base price"
- **Extra Person Price** (required if Base + Extra)
  - Type: Number input (cents)
  - Display: Shows as €XX.XX
  - Validation: Min €1.00 (100 cents)
  - **Shown when:** Base + Extra selected
  - Label: "Price per additional person"
- **Min Participants** (required)
  - Type: Number input
  - Validation: Min 1, max max_participants
  - Default: 1
  - **Note:** For Per Day rentals, this represents minimum quantity (typically 1)
  - Label: "Minimum participants" (or "Minimum quantity" for rentals)
- **Min Days** (required if Per Day Rental)
  - Type: Number input
  - Validation: Min 1, max 365
  - Default: 1
  - **Shown when:** Per Day (Rental) selected
  - Label: "Minimum rental period (days)"
- **Max Days** (optional if Per Day Rental)
  - Type: Number input
  - Validation: Min min_days, max 365
  - **Shown when:** Per Day (Rental) selected
  - Label: "Maximum rental period (days)"
  - Helper text: "Leave empty for no maximum limit"
- **Price Examples** (display only)
  - Shows example calculations based on selected pricing type
  - Updates dynamically as user changes values
  - **For Per Day:** Shows examples like "€50/day × 3 days × 2 units = €300"

**Section 3: Availability**
- **Operating Hours**
  - Weekday toggles (Mon-Sun)
  - Start time picker (HH:mm format)
  - End time picker (HH:mm format)
  - Default: Mon-Fri, 09:00-18:00
- **Seasonal Periods** (optional)
  - Valid from date picker (DD/MM/YYYY)
  - Valid until date picker (DD/MM/YYYY)
  - Can add multiple periods (Future - MVP: Single period)
- **Allows Requests** (toggle)
  - Default: Enabled
  - If enabled: Guests can request custom dates/times
  - If disabled: Only pre-created sessions are bookable

**Section 4: Policies**
- **Cancellation Policy** (required)
  - Type: Radio group
  - Options:
    - Flexible: Full refund up to 24h before
    - Moderate: Full refund up to 7 days before
    - Strict: Full refund up to 14 days before
    - Non-refundable: No refunds
  - Live preview of policy text
- **Force Majeure Refund** (toggle)
  - Default: Enabled
  - If enabled: Full refund if supplier cancels due to weather/emergency
  - Works with any cancellation policy
  - Shows combined policy text in preview

### Form Actions
- **Save** button (primary - Traverum teal `#0D9488`, 28px height, 3px radius, `4px 12px` padding)
  - Validates all required fields
  - Creates new experience or updates existing
  - Shows success toast
  - Redirects to experience detail page
- **Cancel** button (secondary - muted colors, 28px height, 3px radius)
  - Discards changes
  - Navigates back (with confirmation if changes made)

## 5. User Actions

| Action | Location | Result |
|--------|----------|--------|
| Enter title | Basic Info section | Auto-generates slug |
| Select pricing type | Pricing section | Shows/hides relevant fields, updates examples, changes field labels (e.g., "participants" vs "quantity") |
| Toggle weekday | Availability section | Adds/removes day from operating schedule |
| Change time range | Availability section | Updates operating hours |
| Select cancellation policy | Policies section | Updates policy preview text |
| Toggle force majeure | Policies section | Updates combined policy preview |
| Upload image | Images area | Adds image to list, uploads to storage |
| Reorder images | Images area | Updates sort order |
| Delete image | Images area | Removes image from list and storage |
| Expand/collapse section | Section header | Toggles section visibility |
| Click "Save" | Form footer | Validates and saves experience |
| Click "Cancel" | Form footer | Discards changes and navigates back |

## 6. States

### Loading State
- Shown while:
  - Loading existing experience data (edit mode)
  - Saving experience
  - Uploading images
- Spinner overlay on form or button

### Create Mode
- All fields empty (except defaults)
- Title: "Create Experience"
- Save button: "Create Experience"

### Edit Mode
- All fields pre-filled with existing data
- Title: "Edit Experience"
- Save button: "Save Changes"
- Images loaded from media table

### Validation State
- Real-time validation on blur/change
- Error messages below invalid fields
- Save button disabled if validation fails
- Summary of errors at top (Future - MVP: Field-level only)

### Success State
- Success toast: "Experience created successfully" or "Experience updated successfully"
- Redirect to experience detail page after 1 second

### Error State
- Error toast with specific message
- Network errors: "Failed to save. Please try again."
- Validation errors: Show field-level messages
- Image upload errors: "Failed to upload image. Please try again."

### Unsaved Changes State
- **Future:** Warn before navigation if changes made
- **MVP:** No warning (user responsibility)

## 7. Business Rules

### Slug Generation
- Auto-generated from title on blur
- Format: lowercase, replace spaces with hyphens, remove special chars
- Must be unique within organization
- If duplicate: Append `-2`, `-3`, etc.

### Pricing Validation
- **Per Person:** Price per person required
- **Fixed Price:** Base price required
- **Base + Extra:** Base price + included participants + extra person price required
- **Per Day (Rental):** Price per day + min days required (max days optional)
- All prices in cents (integer)
- Min price: €1.00 (100 cents)
- **For Per Day rentals:**
  - Min days must be ≥ 1
  - Max days must be ≥ min days (if set)
  - Max days can be null (no limit)

### Availability Rules
- At least one weekday must be selected
- Start time must be before end time
- If seasonal period set: Valid from must be before valid until
- Seasonal periods must be in future or current (can't be all past)

### Image Rules
- Max 10 images per experience
- Supported formats: JPG, PNG, WebP
- Max file size: 5MB per image
- First image becomes cover image
- Images stored in Supabase Storage: `partners/{partner_id}/experiences/{experience_id}/`

### Experience Status
- New experiences: `experience_status = 'draft'` (Future - MVP: 'active')
- Can be set to 'active' or 'inactive' after creation
- Inactive experiences don't appear in hotel selection

### Required Fields
- Title
- Description
- Duration
- Max participants (or max quantity for rentals)
- Min participants (or min quantity for rentals)
- Pricing type
- Pricing fields (varies by type):
  - **Per Person:** Price per person
  - **Fixed Price:** Base price
  - **Base + Extra:** Base price, included participants, extra person price
  - **Per Day:** Price per day, min days
- Cancellation policy

### Optional Fields
- Tags
- Meeting point
- Images
- Seasonal periods
- Force majeure setting (defaults to enabled)
- Max days (for Per Day rentals - optional)

### Auto-save (Future - MVP: Manual save only)
- Save draft every 30 seconds
- Restore draft on page load if unsaved

## 8. Edge Cases

### Duplicate Slug
- Check uniqueness on save
- If duplicate: Auto-append number
- Show warning: "Slug already exists, using '{slug}-2'"

### Image Upload Failure
- Show error message
- Allow retry
- Don't block form submission (images optional)

### Network Error on Save
- Show error toast
- Keep form data
- Allow retry
- **Future:** Auto-retry with exponential backoff

### Very Long Title
- Truncate in display (if needed)
- Validation prevents > 100 chars
- Show character count

### Invalid Date Range
- Seasonal period: Valid from > Valid until
- Show error: "Valid from must be before valid until"
- Disable save until fixed

### No Weekdays Selected
- Show error: "Select at least one operating day"
- Disable save until fixed

### Time Range Invalid
- Start time >= End time
- Show error: "Start time must be before end time"
- Disable save until fixed

### Max Participants < Min Participants
- Show error: "Max participants must be greater than or equal to min participants"
- Disable save until fixed

### Invalid Rental Period (Per Day Pricing)
- Min days > Max days (if max days is set)
- Show error: "Minimum days must be less than or equal to maximum days"
- Disable save until fixed
- Max days < Min days
- Show error: "Maximum days must be greater than or equal to minimum days"
- Disable save until fixed

### Missing Required Pricing Fields
- **Per Person:** Missing price per person
- Show error: "Price per person is required"
- **Fixed Price:** Missing base price
- Show error: "Base price is required"
- **Base + Extra:** Missing base price, included participants, or extra person price
- Show error: "Base price, included participants, and extra person price are all required"
- **Per Day:** Missing price per day or min days
- Show error: "Price per day and minimum days are required"

### Experience Deleted While Editing
- If experience deleted: Show "Experience not found"
- Redirect to dashboard

### Concurrent Edits
- **Future:** Show warning if experience edited elsewhere
- **MVP:** Last save wins

### Large Image Files
- Client-side validation: Reject > 5MB
- Show error: "Image too large. Maximum size is 5MB"
- Suggest compression

### Many Images
- Limit to 10 images
- Disable upload button when limit reached
- Show message: "Maximum 10 images allowed"

### Browser Back Button
- **Future:** Warn if unsaved changes
- **MVP:** No warning, changes lost

### Session Validation
- If experience has sessions: Can't change duration significantly (Future)
- If experience has bookings: Can't change pricing (Future)
- **MVP:** Allow all changes
