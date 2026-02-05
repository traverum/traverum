# Pending Requests - Booking Requests Awaiting Response

## 1. Purpose

Allows suppliers to view and respond to booking requests from guests, approving or declining requests within the 48-hour response window.

## 2. URL/Location

- **Route:** `/supplier/requests`
- **Component:** `apps/dashboard/src/pages/supplier/PendingRequests.tsx`
- **Layout:** Uses custom header (not DashboardLayout)

## 3. User Goals

- See all pending booking requests
- Understand request details (guest, experience, date/time, participants)
- Approve requests (creating approved reservation)
- Decline requests (with optional reason)
- See response deadlines
- Identify urgent requests (approaching deadline)

## 4. Information Displayed

### Header Section
| Field | Type | Description |
|-------|------|-------------|
| Back Button | Action | Navigate to `/supplier/dashboard` |
| Page Title | Text | "Pending Requests" |
| Subtitle | Text | Count of pending requests |
| Refresh Button | Action | Manually refresh requests (Future - MVP: Auto-refresh) |

### Request List

**For each request:**

**Request Card:**
- Card styling: Warm white background `#FEFCF9`, subtle border `1px solid rgba(55, 53, 47, 0.09)`, 16px padding, 4px radius
- **Guest Information:**
  - Guest name
  - Guest email (Future - MVP: Not shown, click to view or hover tooltip)
  - Guest phone (Future - MVP: Not shown, click to view or hover tooltip)
- **Note:** After payment confirmation, supplier and guest contact information is shared with each other to enable direct communication for organizing the experience (meet up location, etc.)
- **Experience Information:**
  - Experience title (link to experience detail)
  - Experience image (thumbnail)
- **Booking Details:**
  - Participants count
  - Total amount (€XX.XX)
  - Request type:
    - **Scheduled Session:** Shows session date/time
    - **Custom Request:** Shows requested date/time
- **Status Indicators:**
  - "Urgent" badge (muted terracotta `#B8866B`, not bright red) (if < 12 hours until deadline)
  - Time remaining: Visual countdown or badge (prefer visual over text)
- **Response Deadline:**
  - Date/time when response is due
  - Countdown timer (Future - MVP: Static time)
- **Actions:**
  - "Approve" button (primary - Traverum teal `#0D9488`, 28px height, 3px radius)
  - "Decline" button (secondary - muted colors, 28px height, 3px radius)

### Empty State
- Message: "No pending requests"
- Sub-text: "When guests request a booking, you'll see it here."
- Illustration/icon

### Urgent Requests Section (Future - MVP: Mixed with all)

**Separate section for urgent requests:**
- Requests with < 12 hours until deadline
- Highlighted with muted terracotta border `#B8866B` or subtle background (not bright red)
- Shown at top of list

## 5. User Actions

| Action | Location | Result |
|--------|----------|--------|
| Click "Back" | Header | Navigate to `/supplier/dashboard` |
| Click "Approve" | Request card | Approve request, show confirmation |
| Click "Decline" | Request card | Open decline modal with reason field |
| Click experience title | Request card | Navigate to `/supplier/experiences/:id` |
| Click "View Details" | Request card | Open request detail modal (Future) |
| Submit decline reason | Decline modal | Decline request with reason |
| Click "Refresh" | Header | Reload requests list |

## 6. States

### Loading State
- Full-screen spinner
- Shown while:
  - Requests are loading
  - Approving/declining request

### Empty State
- Shown when: `requests.length === 0`
- Message: "No pending requests"
- Sub-text: Informational message

### Request Item States

**Normal:**
- Standard card styling
- Time remaining shown

**Urgent:**
- Muted terracotta border `#B8866B` (not bright red) or subtle background highlight
- "Urgent" badge (muted terracotta color)
- More prominent styling (visual indicator)

**Processing:**
- Disable action buttons
- Show spinner on button
- Prevent duplicate clicks

### Success State
- Success toast: "Request approved" or "Request declined"
- Remove request from list (or move to different section)
- Refresh list

### Error State
- Error toast: "Failed to respond. Please try again."
- Keep request in list
- Allow retry

### Decline Modal State
- Modal overlay
- Reason textarea (optional)
- "Decline" and "Cancel" buttons
- Validation: Can submit without reason

## 7. Business Rules

### Request Status
- Only show requests with `status = 'pending'`
- Only show requests where `response_deadline > now()`
- Exclude expired requests (handled separately)

### Response Deadline
- Calculated: `created_at + 48 hours`
- Stored in `response_deadline` field
- Can't be changed after creation

### Urgent Classification
- Urgent if: `response_deadline - now() < 12 hours`
- Shown with "Urgent" badge
- Highlighted visually

### Approval Process
1. Validate request still pending (not already responded)
2. If scheduled session: Check capacity available
3. If custom request: Create session first (if allows_requests = true)
4. Update reservation: `status = 'approved'`
5. Set `payment_deadline = now() + 24 hours`
6. Send email to guest with payment link
7. Show success message

### Decline Process
1. Validate request still pending
2. Update reservation: `status = 'declined'`
3. Store decline reason (if provided)
4. Send email to guest (with reason if provided)
5. Show success message

### Capacity Validation
- Before approval: Check `current_capacity + participants <= max_capacity`
- If insufficient: Show error: "Not enough capacity. Max X participants available."
- Prevent approval

### Custom Request Handling
- If `is_request = true` and `allows_requests = true`:
  - Create session for requested date/time
  - Then approve reservation
- If `allows_requests = false`: Can't approve custom requests
  - Show error: "This experience doesn't accept custom date requests"

### Expired Requests
- Requests where `response_deadline < now()` are excluded
- **Future:** Show in separate "Expired" section
- **MVP:** Hidden from view

### Duplicate Response Prevention
- Check `status = 'pending'` before responding
- If already responded: Show error: "Request already responded to"
- Refresh list to show updated status

## 8. Edge Cases

### Request Expired While Viewing
- **Future:** Real-time update via Supabase subscription
- **MVP:** Manual refresh required
- On refresh: Expired requests disappear

### Insufficient Capacity
- Show error: "Not enough capacity available"
- Show available capacity: "Only X spots available (requested: Y)"
- Option to approve with reduced participants (Future - MVP: Must decline)

### Session Cancelled
- If session cancelled after request created: Show error
- "Session no longer available"
- Auto-decline or allow manual decline

### Experience Deleted
- If experience deleted: Show "Experience no longer available"
- Allow decline only
- Show warning message

### Network Error on Response
- Show error toast
- Keep request in list
- Allow retry
- **Future:** Auto-retry with exponential backoff

### Concurrent Response
- If request responded to in another tab: Show error
- "Request already responded to"
- Refresh list

### Very Long Guest Names
- Truncate with ellipsis
- Show full name on hover/tooltip

### Many Requests
- **Future:** Pagination or infinite scroll
- **MVP:** Show all (may be slow with 50+)
- Sort by urgency (urgent first)

### Request for Past Date
- If requested date in past: Show warning
- "Requested date is in the past"
- Allow decline only (can't approve past dates)

### Invalid Request Data
- If request missing critical data: Show error
- "Request data incomplete"
- Allow decline only
- Report to support (Future)

### Timezone Issues
- Display times in user's local timezone (Future)
- **MVP:** Server timezone (UTC)
- Show timezone indicator

### Payment Deadline Calculation
- `payment_deadline = approval_time + 24 hours`
- Stored in reservation record
- Used for payment link expiration

### Decline Reason Length
- Max 500 characters
- Optional field
- Shown to guest in email (if provided)

### Request Type Mismatch
- If `is_request = true` but experience `allows_requests = false`:
  - Show error: "This experience doesn't accept custom requests"
  - Allow decline only
- Shouldn't happen in normal flow (widget prevents it)

### Guest Email Invalid
- If guest email bounces: Still allow approval
- Log error for support (Future)
- **MVP:** Proceed normally
