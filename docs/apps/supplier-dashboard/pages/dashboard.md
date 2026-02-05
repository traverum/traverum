# Supplier Dashboard - Overview Page

## 1. Purpose

The supplier dashboard serves as the central command center where suppliers land after logging in. Its primary purpose is to immediately surface what requires their attention and what is happening soon, enabling suppliers to quickly understand their operational status and take necessary actions.

**Why it exists:** Suppliers need a single place to assess their business at a glance. Without this, they would need to navigate multiple pages to understand if they have pending work, upcoming sessions, or incomplete setup tasks. This creates friction and delays in their workflow.

## 2. User Goals

### Primary Goals (Must be visible immediately)

**See if action is required**
- **What:** Suppliers must immediately see if there are pending requests that need their response
- **Why:** Pending requests represent potential revenue and customer satisfaction. If suppliers don't see these quickly, they may miss deadlines, lose bookings, or disappoint customers. Time-sensitive decisions require immediate visibility.

**See what's happening soon**
- **What:** Suppliers must immediately see if they have upcoming sessions in the near future
- **Why:** Suppliers need to prepare for sessions (materials, staff, locations). Missing this information could lead to unprepared sessions, poor customer experiences, or operational failures. Early visibility enables proper planning.

### Secondary Goals (Can be accessed via navigation)

**Understand business relationships**
- **What:** See which hotels are selling their experiences
- **Why:** Suppliers need to understand their distribution network and identify opportunities to expand partnerships. This visibility helps them make strategic decisions about which hotels to prioritize or pursue.

**Complete setup requirements**
- **What:** Complete any required onboarding steps (creating experiences, connecting payment accounts)
- **Why:** Incomplete setup prevents suppliers from receiving bookings and payments. Clear visibility of incomplete steps ensures suppliers can become operational quickly.

**Navigate to detailed information**
- **What:** Access detailed views for experiences, sessions, and requests
- **Why:** While the dashboard provides overview, suppliers need deeper information to make decisions and manage their business effectively.

## 3. Information Displayed

### Most Important Information (Always Visible)

**Upcoming Sessions**
- **What:** Shows sessions that are scheduled in the near future
- **Why:** Suppliers need to know what's coming up so they can prepare appropriately. This prevents last-minute scrambling and ensures quality service delivery. The information should indicate both the session timing and whether people have booked (bookings indicate confirmed revenue and required preparation).

**Pending Requests**
- **What:** Shows requests from customers that require a response
- **Why:** These represent potential bookings and revenue. Suppliers must respond within deadlines to convert requests into confirmed bookings. If this information is buried or hard to find, suppliers may miss opportunities or fail to respond in time, damaging their reputation and revenue.

### Secondary Information (Accessible but not primary focus)

**Payment Setup Status**
- **What:** Indicates whether payment processing is configured
- **Why:** Without payment setup, suppliers cannot receive payments for bookings. This is a critical blocker that must be resolved before suppliers can operate. The dashboard should make this clear when incomplete, but not distract when complete.

**Hotel Partnerships**
- **What:** Shows which hotels are displaying and selling the supplier's experiences
- **Why:** Suppliers need visibility into their distribution network to understand reach, identify successful partnerships, and spot opportunities for expansion. This information helps suppliers make strategic decisions about which hotels to prioritize.

**Experience Overview**
- **What:** Shows the supplier's available experiences with their status
- **Why:** Suppliers need to understand what they're offering and whether their experiences are active and bookable. This helps them manage their product catalog and identify which experiences need attention.

**Performance Indicators**
- **What:** Shows analytics, revenue, and performance metrics
- **Why:** Suppliers need to understand their business performance to make informed decisions about pricing, marketing, and product development. However, this is less urgent than action items, so it can be secondary.

## 4. User Actions

### Critical Actions (Directly accessible from dashboard)

**Respond to Pending Requests**
- **What:** Navigate to view and respond to pending customer requests
- **Why:** Time-sensitive responses are critical for converting requests into bookings. Making this easily accessible ensures suppliers don't miss opportunities.

**View Upcoming Sessions**
- **What:** Navigate to see detailed information about upcoming sessions
- **Why:** Suppliers need detailed session information to prepare properly. Quick access prevents them from having to dig through multiple pages.

**Complete Payment Setup**
- **What:** Navigate to connect payment processing account
- **Why:** This is a required step before suppliers can receive payments. Making it easily accessible when incomplete ensures suppliers can become operational quickly.

### Secondary Actions (Accessible via navigation)

**Create or Manage Experiences**
- **What:** Navigate to create new experiences or edit existing ones
- **Why:** Suppliers need to manage their product catalog, but this is not an urgent daily task. It can be accessed when needed without cluttering the primary dashboard view.

**View Hotel Partners**
- **What:** Navigate to see detailed information about hotel partnerships
- **Why:** Understanding partnerships is important for strategic decisions, but not urgent. Suppliers can access this when planning or evaluating their distribution strategy.

**View Analytics**
- **What:** Navigate to see detailed performance metrics
- **Why:** Performance analysis is important for business growth, but not urgent. Suppliers typically review this periodically rather than daily.

## 5. Page States

### Empty State (No Experiences)
- **What:** Shows when supplier has not created any experiences yet
- **Why:** Suppliers need clear guidance on what to do next when starting. An empty state should encourage action without overwhelming them with options. It should make the next step obvious.

### Onboarding State (Setup Incomplete)
- **What:** Shows when supplier has not completed required setup steps
- **Why:** Suppliers need to understand what's blocking them from operating. Clear visibility of incomplete steps with easy access to complete them ensures suppliers can become operational quickly. This prevents confusion about why they're not receiving bookings.

### Operational State (Setup Complete)
- **What:** Shows when supplier has completed setup and is actively operating
- **Why:** Once operational, suppliers need to focus on daily operations (requests, sessions) rather than setup tasks. The dashboard should prioritize actionable information over setup guidance.

### Loading State
- **What:** Shows while necessary data is being fetched
- **Why:** Suppliers need feedback that the system is working. Without this, they may think the page is broken or try to interact before data is ready, causing errors or confusion.

## 6. Business Rules

### Readiness Determination
- **What:** The system determines whether a supplier is "ready" to operate
- **Why:** Suppliers need to complete essential setup before they can receive bookings and payments. The dashboard should clearly indicate readiness status so suppliers understand what's required and what they can do.

**Readiness requires:**
- At least one experience created (suppliers need products to sell)
- Payment processing connected (suppliers need to receive payments)

### Upcoming Sessions Definition
- **What:** Sessions are considered "upcoming" when they fall within a near-term window
- **Why:** Suppliers need to focus on sessions that require immediate or near-term preparation. Sessions too far in the future don't require immediate attention, while very recent sessions may have already passed. The window should balance urgency with planning time.

### Pending Requests Definition
- **What:** Requests are considered "pending" when they require a response and the deadline has not passed
- **Why:** Suppliers need to focus on actionable requests. Requests that have passed their deadline are no longer actionable, and requests that don't require response don't need attention. This ensures suppliers see only what they can act on.

### Experience Status
- **What:** Experiences have status indicators (active/inactive)
- **Why:** Suppliers need to understand which experiences are bookable and which need attention. Active experiences generate revenue, while inactive ones may need updates or fixes before they can be sold.

## 7. Edge Cases

### No Active Organization
- **What:** Supplier has not set up any business organization
- **Why:** Suppliers must have an organization to operate. The system should guide them to create one rather than showing a broken or empty state.

### Payment Account Connected but Incomplete
- **What:** Payment account exists but onboarding process is not finished
- **Why:** Suppliers may think they're ready when they're not. The system must clearly indicate that setup is incomplete so suppliers can finish the process and start receiving payments.

### No Hotel Partnerships
- **What:** Supplier's experiences are not distributed to any hotels
- **Why:** Without distribution, suppliers won't receive bookings. The system should make this clear so suppliers understand they need to establish partnerships, but this is less urgent than pending requests or upcoming sessions.

### No Data Available
- **What:** System cannot fetch required data
- **Why:** Suppliers need to understand when something is wrong versus when they simply have no data. Clear error states prevent confusion and help suppliers take appropriate action (retry, contact support, etc.).

### Multiple Organizations
- **What:** Supplier manages multiple business organizations
- **Why:** Suppliers may operate multiple businesses or switch between different business contexts. The system should allow them to see the correct information for their active organization without confusion.
