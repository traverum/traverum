# Performance Metrics - Supplier Analytics

## Purpose

**WHY this page exists:**
Suppliers need to understand their business performance on the Traverum platform to make informed decisions about their experiences, pricing, and partnerships. Without visibility into revenue, bookings, and distribution performance, suppliers cannot optimize their offerings or identify growth opportunities. This page serves as the central analytics hub where suppliers can evaluate their success and identify areas for improvement.

**WHAT it does:**
Provides comprehensive performance analytics across four key dimensions—revenue, bookings, experience performance, and distribution—enabling suppliers to understand their business health, identify top performers, and make data-driven decisions.

## User Goals

**WHAT suppliers need to accomplish:**
- Understand their financial performance (revenue earned)
- Identify which experiences are most successful and which need attention
- Evaluate hotel partnership effectiveness and distribution reach

## Information Displayed

### Summary Metrics Section

**WHAT is shown:**
- Total revenue earned (supplier's net earnings in EUR)
- Total number of bookings
- Number of active experiences
- Number of hotel partners generating bookings

**WHY this information:**
Suppliers need a quick overview of their business health at a glance. These four metrics provide the essential KPIs that indicate overall success: financial performance (revenue), business volume (bookings), product portfolio size (active experiences), and distribution reach (hotel partners). Seeing these together helps suppliers immediately understand if their business is growing, stable, or declining.

### Time Period Filter

**WHAT is shown:**
- Filter options: All Time / This Year / This Month / This Week / Custom Date Range
- All metrics and visualizations update based on selected period

**WHY this information:**
Suppliers need to analyze performance across different timeframes to understand trends, seasonal patterns, and recent changes. Comparing "This Month" to "This Year" helps identify if current performance is improving or declining. Custom date ranges enable suppliers to analyze specific campaigns, seasons, or periods of interest. Without time-based filtering, suppliers cannot identify when changes occurred or understand temporal patterns.

### Revenue Analytics Section

**WHAT is shown:**
- Total revenue (supplier's net earnings after fees)
- Revenue over time (trend visualization)
- Revenue by experience (breakdown showing which experiences generate most revenue)
- Revenue by hotel (breakdown showing which hotel partnerships generate most revenue)
- Revenue growth metrics (period-over-period comparisons)
- Payment status distribution (confirmed, completed, pending transfers)

**WHY this information:**
Revenue is the primary success metric for suppliers. Understanding total revenue helps suppliers assess financial health. Revenue trends over time reveal growth patterns, seasonal variations, and whether business is improving or declining. Revenue breakdown by experience helps suppliers identify their most profitable offerings and focus resources accordingly. Revenue by hotel shows which partnerships are most valuable, enabling suppliers to prioritize relationship management. Growth metrics provide context for whether current performance is better or worse than previous periods. Payment status helps suppliers understand cash flow and identify any payout issues.

### Booking Analytics Section

**WHAT is shown:**
- Total booking count
- Bookings over time (trend visualization)
- Bookings by experience (which experiences receive most bookings)
- Bookings by hotel (which hotels generate most bookings)
- Bookings by session (which time slots are most popular)
- Booking status distribution (confirmed, completed, cancelled)
- Cancellation rate
- Average group size per booking

**WHY this information:**
Booking volume indicates business activity and demand. Tracking bookings over time helps suppliers understand demand patterns, identify peak periods, and plan capacity. Bookings by experience reveals which offerings are most popular, helping suppliers understand market preferences. Bookings by hotel shows which partnerships drive the most traffic, enabling suppliers to focus on high-performing relationships. Bookings by session helps suppliers optimize scheduling and identify optimal time slots. Booking status and cancellation rates help suppliers understand operational health—high cancellation rates may indicate pricing, quality, or communication issues. Average group size helps suppliers understand their customer base and optimize pricing strategies.

### Experience Performance Analytics Section

**WHAT is shown:**
- Active experiences count
- Experience performance ranking (by bookings and revenue)
- Average booking value per experience
- Session utilization rates (how full sessions are)
- Most and least booked sessions
- Upcoming sessions with availability status
- Experience status distribution (active, draft, archived)

**WHY this information:**
Suppliers manage multiple experiences and need to understand which ones are performing well and which need attention. Experience ranking helps suppliers identify star performers to promote and underperformers to improve or retire. Average booking value per experience helps suppliers understand pricing effectiveness and revenue potential. Session utilization rates reveal whether suppliers are pricing correctly, scheduling optimally, or over/under-capacity. Identifying most and least booked sessions helps suppliers optimize scheduling. Upcoming sessions visibility helps suppliers prepare for upcoming bookings and identify sessions that need promotion. Experience status distribution helps suppliers understand their portfolio composition.

### Distribution Analytics Section

**WHAT is shown:**
- Active hotel partners count
- Bookings per hotel partner
- Revenue per hotel partner
- Distribution coverage (which experiences are distributed to which hotels)
- Commission structure overview (commission rates per hotel-experience pair)
- Hotels with no bookings (partnerships that aren't generating results)

**WHY this information:**
Traverum operates on a distribution model where hotels sell supplier experiences. Suppliers need to understand which hotel partnerships are effective and which are not generating results. Bookings and revenue per hotel help suppliers identify valuable partnerships to nurture and underperforming ones to address. Distribution coverage shows suppliers where their experiences are available, helping them understand market reach. Commission structure visibility helps suppliers understand their net earnings and evaluate partnership profitability. Identifying hotels with no bookings helps suppliers recognize partnerships that may need attention, renegotiation, or termination.

## User Actions

**WHAT suppliers can do:**

| Action | WHY it's needed |
|--------|----------------|
| Select time period | Analyze performance across different timeframes to identify trends and patterns |
| Click experience in rankings | Navigate to experience detail to investigate performance and take management actions |
| Click hotel in rankings | View hotel partnership details to understand distribution relationship |
| Export data | Download metrics for external analysis, reporting, or record-keeping |
| Compare periods | Understand if performance is improving or declining over time |

**WHY these actions matter:**
Suppliers need to drill down from high-level metrics to detailed views to understand root causes and take action. Time period selection enables trend analysis. Navigation to experience or hotel details enables suppliers to investigate and manage specific items. Data export enables suppliers to use analytics tools or share with stakeholders. Period comparison helps suppliers understand performance trajectory.

## Business Rules

**WHAT the system enforces:**

- Only confirmed and completed bookings are counted in metrics (cancelled and pending bookings excluded)
- Revenue represents supplier's net earnings (after platform and hotel commissions)
- Rankings prioritize booking count over revenue (to identify popular experiences)
- All metrics respect the selected time period filter
- Suppliers can only view their own data (no access to other suppliers' metrics)
- Historical data is preserved (past periods remain accurate even if bookings are later cancelled)

**WHY these rules:**
Counting only confirmed/completed bookings provides accurate performance metrics—cancelled bookings don't represent successful business, and pending bookings may never complete. Using net earnings (after fees) shows suppliers their actual income, not gross revenue. Prioritizing booking count in rankings helps identify popular experiences that may have lower prices but higher volume. Time period filtering ensures metrics are relevant to the analysis timeframe. Data isolation ensures suppliers only see their own performance, maintaining privacy. Historical accuracy ensures suppliers can trust past period metrics even if current data changes.

## States

### Empty State

**WHAT happens:**
No bookings exist for the selected time period, or supplier has no experiences yet.

**WHY:**
Suppliers need clear feedback when they have no data to display. This helps them understand whether they need to create experiences, wait for bookings, or adjust their time period filter. Empty states should guide suppliers toward next steps rather than leaving them confused.

### Loading State

**WHAT happens:**
Metrics are being calculated and fetched from the system.

**WHY:**
Suppliers need feedback that the system is working and data is loading. This prevents confusion about missing information and sets expectations for when data will appear.

### Error State

**WHAT happens:**
Data cannot be loaded due to system or network issues.

**WHY:**
Suppliers need to know when something has gone wrong and whether they can retry the operation. Clear error messaging helps suppliers understand if the issue is temporary or requires support.

### No Data Period State

**WHAT happens:**
Selected time period has no bookings, but other periods do.

**WHY:**
Suppliers need to understand that the lack of data is specific to their selected period, not a system issue. This helps them adjust their time filter to see data from other periods.
