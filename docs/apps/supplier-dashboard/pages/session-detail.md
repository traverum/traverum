# Session Detail - Single Session Information

## 1. Purpose

Provides suppliers with detailed information about a specific session, including bookings, capacity, and session management options.

## 2. URL/Location

- **Route:** `/supplier/sessions/:sessionId`
- **Component:** `apps/dashboard/src/pages/supplier/SessionDetail.tsx`
- **Layout:** Uses DashboardLayout

## 3. User Goals

- View complete session details
- See all bookings for this session
- Understand session capacity and availability
- Cancel session if needed
- Edit session details
- Contact guests (Future - MVP: View only)

## 4. Information Displayed

### Header Section
| Field | Type | Description |
|-------|------|-------------|
| Back Button | Action | Navigate to previous page (sessions list or experience) |
| Session Date/Time | Text | "Monday, 15 January 2024 at 14:00" |
| Experience Title | Link | Name of experience (link to experience detail) |
| Status Badge | Badge | Upcoming / Past / Cancelled |
| Actions Menu | Dropdown | Edit, Cancel, Delete (context-dependent) |

### Session Overview Card

- Card styling: Warm white background `#FEFCF9`, subtle border `1px solid rgba(55, 53, 47, 0.09)`, 16px padding, 4px radius

**Session Information:**
- Date (formatted: "Monday, 15 January 2024")
- Time (formatted: "14:00")
- Duration (from experience: "2h 30min")
- Meeting point (from experience)
- Status (upcoming/past/cancelled) - visual badge with muted colors

**Capacity Information:**
- Max capacity (visual number, prominent)
- Current bookings count (visual number, prominent)
- Available spots (visual number, prominent)
- Capacity bar (visual indicator - muted colors)
- Percentage full (visual, not text-heavy)

**Experience Link:**
- Experience title (clickable)
- Link to experience detail page

### Bookings Section

**Header:**
- Title: "Bookings"
- Count: "X bookings" (visual badge, e.g., "5 bookings")
- Status filter (All / Confirmed / Completed / Cancelled) - Future (muted colors for status)

**Bookings List:**
For each booking:
- Booking reference (TRV-XXXXXX)
- Guest name
- Guest email and phone (visible to supplier after payment confirmation)
- Participants count
- Total amount (€XX.XX)
- Booking status badge
- Created date/time
- Payment status (if applicable)
- Completion status (for past sessions):
  - **Confirmed** - Awaiting completion check (if session date was yesterday)
  - **Completed** - Experience happened, supplier paid
  - **Cancelled (Refunded)** - Experience didn't happen, refund processed
  - **Completed (No-show)** - Guest no-show, no refund, supplier paid
- Actions:
  - View details (Future - MVP: Not clickable)
  - Contact guest (email/phone shared after payment confirmation)
  - Cancel booking (Future - MVP: Not available)
  - **Report completion status** (for past sessions with confirmed bookings):
    - "Mark as Completed" button
    - "Did Not Happen - Refund Required" button
    - "Did Not Happen - No Refund" button
- **Note:** After payment confirmation, supplier and guest contact information is shared with each other to enable direct communication for organizing the experience (meet up location, etc.)

**Empty State:**
- Message: "No bookings yet"
- Sub-text: "Bookings will appear here once guests book this session"

### Session Actions

**Edit Session:**
- Button: "Edit Session" (Traverum teal `#0D9488`, 28px height, 3px radius)
- Navigate to experience sessions page with session pre-selected
- Or open edit modal (Future)

**Cancel Session:**
- Button: "Cancel Session" (muted colors, 28px height, 3px radius)
- Opens confirmation modal
- If bookings exist: Show warning (visual indicator, not text-heavy)
- Confirmation required

**Delete Session:**
- Only if no bookings
- Only if session in future
- Confirmation required
- **Future:** Soft delete (mark as cancelled)
- **MVP:** Hard delete

## 5. User Actions

| Action | Location | Result |
|--------|----------|--------|
| Click "Back" | Header | Navigate to previous page |
| Click experience title | Overview card | Navigate to `/supplier/experiences/:id` |
| Click booking item | Bookings list | Navigate to booking detail (Future) |
| Click "Edit Session" | Actions | Navigate to sessions page or open modal |
| Click "Cancel Session" | Actions | Open cancellation confirmation modal |
| Click "Delete Session" | Actions | Delete session (if allowed) |
| Confirm cancellation | Modal | Cancel session, update status |
| Filter bookings | Bookings header | Filter by status (Future) |

## 6. States

### Loading State
- Full-screen spinner or skeleton loader
- Shown while:
  - Session data loading
  - Bookings loading
  - Experience data loading

### Not Found State
- Shown when: Session ID doesn't exist or doesn't belong to user
- Message: "Session not found"
- Action: "Back to Sessions" button

### Empty Bookings State
- Shown when: `bookings.length === 0`
- Message: "No bookings yet"
- Sub-text: Informational message

### Past Session State
- Visual indicator: Grayed out or "Past" badge
- Disable edit/delete actions
- Show "Completed" status if all bookings completed

### Cancelled Session State
- "Cancelled" badge
- Disable most actions
- Show cancellation reason (if available)
- Bookings remain visible (for reference)

### Error State
- Error toast on load failure
- Message: "Failed to load session. Please try again."
- Retry button

### Cancellation Modal State
- Confirmation dialog
- Warning if bookings exist
- Reason field (optional)
- "Cancel Session" and "Keep Session" buttons

## 7. Business Rules

### Session Access
- User can only view sessions for experiences belonging to their active organization
- If session doesn't exist or belongs to different org: Show "not found"

### Capacity Calculation
- Available spots = `max_capacity - current_capacity`
- Current capacity = sum of confirmed bookings
- Display: "X / Y spots available" or "Full"

### Status Determination
- **Upcoming:** `session_date > today` OR (`session_date = today` AND `start_time > now`)
- **Past:** `session_date < today` OR (`session_date = today` AND `start_time < now`)
- **Cancelled:** `is_cancelled = true`

### Cancellation Rules
- Can cancel any session (upcoming or past)
- If bookings exist: Show warning
- **Future:** Auto-refund bookings on cancellation
- **MVP:** Manual refund process
- Cancellation reason stored (optional)

### Deletion Rules
- Can only delete if:
  - No bookings exist
  - Session is in future
  - User has permission
- **Future:** Soft delete (mark as cancelled)
- **MVP:** Hard delete from database

### Edit Rules
- Can edit if:
  - Session is upcoming
  - No confirmed bookings (Future - MVP: Allow edit)
- Can't change date/time if bookings exist (Future)
- **MVP:** Allow all edits

### Booking Status Filtering
- Default: Show all bookings
- Filter by status:
  - Confirmed (paid, upcoming)
  - Completed (experience delivered)
  - Cancelled (refunded)
  - Completed (no-show) - Guest no-show, no refund

### Completion Reporting (Past Sessions)
- For sessions where `session_date` was yesterday or earlier:
  - Show completion action buttons for each "Confirmed" booking
  - Three options available:
    1. **"Mark as Completed"** - Experience happened
       - Updates booking status to `completed`
       - Triggers Stripe transfer to supplier (80%)
       - Records hotel commission (12%)
       - Sends confirmation email to supplier
    2. **"Did Not Happen - Refund Required"** - Supplier cancelled (weather, illness, etc.)
       - Updates booking status to `cancelled`
       - Sets `refund_reason` to indicate supplier cancellation
       - Initiates full refund to guest via Stripe
       - Sends refund confirmation email to guest
       - No payout to supplier, no commission to hotel
       - Releases spots on session (if applicable)
    3. **"Did Not Happen - No Refund"** - Guest no-show or guest fault
       - Updates booking status to `completed` (supplier still gets paid)
       - Sets `refund_reason` to indicate no-show
       - Triggers Stripe transfer to supplier (80%) - same as "Completed"
       - Records hotel commission (12%)
       - Sends notification to supplier
       - Optionally sends no-show notification to guest (can be disabled)
       - **No refund is processed** - Guest does not receive money back
- If supplier does not respond within 7 days:
  - System auto-marks booking as `completed`
  - Proceeds with payout as if "Mark as Completed" was clicked
  - Rationale: Assume experience happened if no complaint from either party

### Booking Display Order
- Order by: `created_at DESC` (newest first)
- Or by: Guest name alphabetically (Future)

## 8. Edge Cases

### Session Not Found
- If session ID invalid: Show "Session not found"
- Redirect to sessions list after 3 seconds

### Session Deleted
- If session deleted while viewing: Show "Session not found"
- Redirect to sessions list

### Experience Deleted
- If experience deleted: Show "Experience no longer available"
- Still show session details
- Disable experience link
- Show warning banner

### No Bookings
- Show empty state
- Clear messaging
- No actions needed

### Session Full
- Show "Full" badge
- Capacity bar at 100%
- Disable booking (handled in widget)
- Still show in detail view

### Past Session with Bookings
- Show all bookings
- Mark as "Past"
- Disable edit/delete
- Show completion status

### Cancelled Session
- Show "Cancelled" badge
- Disable most actions
- Bookings still visible (for reference)
- Show cancellation date/reason

### Concurrent Cancellation
- If session cancelled in another tab: Show error
- "Session already cancelled"
- Refresh to show updated status

### Network Error
- Show error toast
- Retry button
- Keep previous data if available

### Many Bookings
- **Future:** Pagination or virtual scrolling
- **MVP:** Show all (may be slow with 50+)
- Consider limit (last 100)

### Invalid Capacity Data
- If `current_capacity > max_capacity`: Show warning
- "Capacity data inconsistent"
- Still display (may be data issue)

### Booking Status Mismatch
- If booking status doesn't match session: Show warning
- "Some bookings may have incorrect status"
- Log for support (Future)

### Timezone Issues
- Display times in user's local timezone (Future)
- **MVP:** Server timezone (UTC)
- Show timezone indicator

### Session in Past but Not Completed
- Show "Past" status
- Bookings may still be "Confirmed"
- Show completion action buttons for each booking:
  - **"Mark as Completed"** - Experience happened, proceed with payout
  - **"Did Not Happen - Refund Required"** - Supplier cancelled (weather, illness, etc.), refund guest
  - **"Did Not Happen - No Refund"** - Guest no-show, no refund, supplier still paid
- **Future:** Allow manual completion via dashboard
- **MVP:** Completion handled via email links, but dashboard can show status

### Very Long Experience Title
- Truncate with ellipsis
- Show full title on hover/tooltip

### Guest Information Missing
- If guest email/phone missing: Show "N/A"
- Still display booking
- Log for support (Future)
