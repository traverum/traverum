# Supplier Sessions - All Sessions Across All Experiences

## 1. Purpose

Provides suppliers with a unified view of all sessions across all their experiences, allowing them to see upcoming sessions, manage capacity, and access session details quickly.

## 2. URL/Location

- **Route:** `/supplier/sessions`
- **Component:** `apps/dashboard/src/pages/supplier/SupplierSessions.tsx`
- **Layout:** Uses DashboardLayout

## 3. User Goals

- View all upcoming sessions across all experiences
- See which experiences have sessions
- Filter sessions by experience, date range, or status
- Quickly access session details
- Understand overall session availability
- Manage sessions from a central location

## 4. Information Displayed

### Header Section
| Field | Type | Description |
|-------|------|-------------|
| Page Title | Text | "Sessions" |
| Subtitle | Text | Count of upcoming sessions |
| Filter/Search | Input | Filter by experience name (Future - MVP: No filter) |

### Filters Section (Future - MVP: Not included)

**Filters:**
- Experience selector (dropdown, "All experiences")
- Date range picker
- Status filter (All / Upcoming / Past / Cancelled)
- Capacity filter (Available spots < X)

### Sessions List

**Grouping Options:**
- By date (default)
- By experience (Future - MVP: By date only)

**Date Group Headers:**
- Date (formatted: "Monday, 15 January 2024")
- Count: "X sessions"
- Today indicator

**Session Items:**
For each session:
- Experience name (link to experience detail)
- Time (HH:mm)
- Available spots (current_capacity / max_capacity) - visual, prominent numbers
- Status badge (upcoming/past/cancelled - muted semantic colors)
- Quick actions:
  - View details (navigate to session detail)
  - Edit (navigate to experience sessions page)
  - Cancel (with confirmation)
- Card styling: Warm white background `#FEFCF9`, subtle border `1px solid rgba(55, 53, 47, 0.09)`, 16px padding, 4px radius

**Empty State:**
- Message: "No upcoming sessions"
- Sub-text: "Create sessions for your experiences to make them bookable"
- Action: "View Experiences" button → Navigate to dashboard

### Summary Cards (Future - MVP: Not included)

**Cards showing:**
- Total upcoming sessions (next 7 days)
- Total available spots
- Sessions today
- Most popular experience

## 5. User Actions

| Action | Location | Result |
|--------|----------|--------|
| Click experience name | Session item | Navigate to `/supplier/experiences/:id` |
| Click "View Details" | Session item | Navigate to `/supplier/sessions/:sessionId` |
| Click "Edit" | Session item | Navigate to `/supplier/experiences/:id/sessions` |
| Click "Cancel" | Session item | Cancel session (with confirmation) |
| Select experience filter | Filters | Filter sessions by experience |
| Select date range | Filters | Filter sessions by date range |
| Click "View Experiences" | Empty state | Navigate to `/supplier/dashboard` |

## 6. States

### Loading State
- Full-screen spinner or skeleton loader
- Shown while:
  - Sessions are loading
  - Experiences are loading

### Empty State
- Shown when: `sessions.length === 0`
- Message: "No upcoming sessions"
- Sub-text: Guidance message
- Action: "View Experiences" button

### No Experiences State
- Shown when: User has no experiences
- Message: "No experiences yet"
- Action: "Create Your First Experience" button
- Navigate to `/supplier/experiences/new`

### Filtered Empty State
- Shown when: Filters applied but no results
- Message: "No sessions match your filters"
- Action: "Clear Filters" button

### Error State
- Error toast on load failure
- Message: "Failed to load sessions. Please try again."
- Retry button

## 7. Business Rules

### Session Filtering
- Default: Show upcoming sessions only (`session_date >= today`)
- Include today's sessions if `start_time >= now`
- Order by: `session_date ASC, start_time ASC`

### Session Status
- **Upcoming:** `session_date > today` OR (`session_date = today` AND `start_time > now`)
- **Past:** `session_date < today` OR (`session_date = today` AND `start_time < now`)
- **Cancelled:** `is_cancelled = true` (excluded from default view)

### Capacity Calculation
- Available spots = `max_capacity - current_capacity`
- Current capacity = sum of confirmed bookings for session
- Display: "X / Y spots available" or "Full" if 0 available

### Experience Filtering
- Only show sessions for experiences belonging to active organization
- If experience deleted: Session still shows (with "Experience deleted" label)

### Date Grouping
- Group sessions by `session_date`
- Today's group: "Today"
- Tomorrow's group: "Tomorrow"
- Future dates: "Monday, 15 January 2024"
- Past dates: Excluded from default view

### Pagination (Future - MVP: Show all)
- Show 50 sessions per page
- Load more / infinite scroll
- **MVP:** Show all upcoming sessions (may be slow with 100+)

## 8. Edge Cases

### No Experiences
- Show "No experiences yet" empty state
- Link to create experience

### Experience Deleted
- If experience deleted but session exists: Show "Experience deleted" label
- Session still clickable (navigate to session detail)
- Handle gracefully in session detail page

### Many Sessions
- **Future:** Pagination or virtual scrolling
- **MVP:** Show all (may be slow with 500+)
- Consider date range limit (next 90 days)

### Network Error
- Show error toast
- Retry button
- Keep previous data if available

### Concurrent Cancellation
- If session cancelled in another tab: Show error on cancel
- "Session already cancelled" message
- Refresh list

### Timezone Issues
- Display times in user's local timezone (Future)
- **MVP:** Server timezone (UTC)
- Show timezone indicator (Future)

### Past Sessions Mixed In
- If filter shows past: Clearly mark as "Past"
- Gray out past sessions
- Separate section or badge

### Session with No Capacity
- Show "Full" badge instead of "0 / 10 spots"
- Disable booking (handled in widget)
- Still show in list

### Very Long Experience Names
- Truncate with ellipsis
- Show full name on hover/tooltip
- Max 50 characters in list

### Multiple Sessions Same Time
- Show all (different experiences)
- Group by time if same experience (Future)
- **MVP:** Show as separate items

### Filter Returns No Results
- Show "No sessions match your filters"
- Provide "Clear Filters" action
- Show total count: "0 of X sessions"

### Session Cancelled While Viewing
- **Future:** Real-time update via Supabase subscription
- **MVP:** Manual refresh required
- Show cancelled badge on refresh
