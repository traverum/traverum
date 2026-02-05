# Supplier Analytics Capabilities

## Overview

This document outlines all analytics that can be provided to suppliers based on the current database schema. All metrics are calculated from existing tables and relationships without requiring additional data collection.

---

## Available Data Sources

### Core Tables
- **`bookings`** - Payment and booking status, amounts (total, supplier, hotel, platform), timestamps
- **`reservations`** - Guest information, participants, dates, experience/hotel/session relationships
- **`experiences`** - Experience details, pricing, status, metadata
- **`experience_sessions`** - Session details, availability, dates, times, status
- **`distributions`** - Commission structure per experience-hotel pair
- **`partners`** - Hotel/supplier information
- **`media`** - Media associated with experiences

### Key Relationships
- Bookings → Reservations → Experiences → Partners (suppliers)
- Bookings → Sessions → Experiences
- Reservations → Hotels (partners)
- Distributions → Experiences + Hotels

---

## Revenue Analytics

### 1. Total Revenue Metrics
**Data Source:** `bookings.supplier_amount_cents`

- **Total Revenue (All Time)**
  - Sum of `supplier_amount_cents` for all confirmed/completed bookings
  - Filter: `booking_status IN ('confirmed', 'completed')`

- **Revenue by Time Period**
  - This Year / This Month / This Week / Custom Range
  - Filter by `paid_at` or `created_at` timestamp
  - Group by day/week/month for trend analysis

- **Revenue Growth**
  - Period-over-period comparison (MoM, YoY)
  - Percentage change calculations
  - Trend direction (increasing/decreasing)

### 2. Revenue Breakdown
**Data Source:** `bookings` table

- **Revenue by Experience**
  - Group bookings by `session_id → experience_id`
  - Sum `supplier_amount_cents` per experience
  - Rank experiences by revenue

- **Revenue by Hotel**
  - Join bookings → reservations → hotels
  - Sum `supplier_amount_cents` per hotel partner
  - Identify top-performing hotel partnerships

- **Revenue by Commission Structure**
  - Join bookings → distributions
  - Compare revenue across different commission rates
  - Analyze impact of commission on net earnings

### 3. Payment Analytics
**Data Source:** `bookings` table

- **Payment Status Distribution**
  - Count bookings by `booking_status`
  - Track: confirmed, completed, cancelled, pending

- **Payment Timing**
  - Average time from reservation to payment (`paid_at - created_at`)
  - Payment completion rate

- **Stripe Transfer Status**
  - Track `stripe_transfer_id` presence
  - Identify completed vs pending transfers

---

## Booking Analytics

### 1. Booking Volume
**Data Source:** `bookings` + `reservations`

- **Total Bookings**
  - Count of confirmed/completed bookings
  - Filter by time period

- **Bookings by Experience**
  - Count bookings per experience
  - Rank top-performing experiences
  - Identify underperforming experiences

- **Bookings by Hotel**
  - Count bookings per hotel partner
  - Identify which hotels generate most bookings

- **Bookings by Session**
  - Count bookings per session
  - Identify most popular time slots
  - Analyze booking patterns by day/time

### 2. Booking Trends
**Data Source:** `bookings.paid_at` or `reservations.created_at`

- **Bookings Over Time**
  - Daily/weekly/monthly booking counts
  - Trend visualization (line chart)
  - Identify peak booking periods

- **Booking Velocity**
  - Bookings per day/week/month
  - Growth rate calculations
  - Seasonal patterns

### 3. Booking Status Analytics
**Data Source:** `bookings.booking_status`

- **Status Distribution**
  - Count by status: confirmed, completed, cancelled
  - Calculate cancellation rate
  - Track completion rate

- **Cancellation Analysis**
  - Count cancelled bookings (`cancelled_at IS NOT NULL`)
  - Cancellation rate by experience
  - Cancellation rate by hotel
  - Revenue lost to cancellations

- **Completion Tracking**
  - Count completed bookings (`completed_at IS NOT NULL`)
  - Completion rate by experience
  - Average time to completion

---

## Guest Analytics

### 1. Guest Demographics
**Data Source:** `reservations` table

- **Total Participants**
  - Sum of `participants` across all bookings
  - Average group size per booking
  - Maximum group size

- **Group Size Distribution**
  - Count bookings by participant count
  - Identify most common group sizes
  - Analyze pricing efficiency (per-person vs flat-rate)

### 2. Guest Behavior
**Data Source:** `reservations` + `bookings`

- **Booking Patterns**
  - Time from reservation to payment
  - Request vs instant booking ratio (`is_request`)
  - Average booking lead time (days before session)

- **Guest Contact Information**
  - Available after payment confirmation
  - Can track repeat bookings (if email matching implemented)

---

## Experience Performance Analytics

### 1. Experience Metrics
**Data Source:** `experiences` + `bookings` + `experience_sessions`

- **Active Experiences**
  - Count experiences with `experience_status = 'active'`
  - Total experiences (all statuses)

- **Experience Performance Ranking**
  - Rank by booking count
  - Rank by revenue
  - Rank by average booking value

- **Experience Utilization**
  - Bookings per experience
  - Revenue per experience
  - Average booking value per experience

### 2. Session Analytics
**Data Source:** `experience_sessions` + `bookings`

- **Total Sessions**
  - Count all sessions
  - Count by status (active, cancelled, completed)

- **Session Utilization**
  - `spots_total - spots_available` = spots booked
  - Utilization rate: `(spots_booked / spots_total) * 100`
  - Average utilization per experience

- **Session Performance**
  - Most booked sessions (by date/time)
  - Least booked sessions
  - Identify optimal session times

- **Upcoming Sessions**
  - Count sessions in next 7/30 days
  - Sessions with low availability
  - Sessions with no bookings

### 3. Availability Analytics
**Data Source:** `experience_sessions`

- **Availability Trends**
  - Spots available over time
  - Identify capacity constraints
  - Optimal capacity planning

- **Session Status Distribution**
  - Count by `session_status`
  - Track cancelled vs active sessions

---

## Distribution Analytics

### 1. Hotel Partnership Metrics
**Data Source:** `distributions` + `bookings` + `reservations`

- **Active Hotel Partners**
  - Count unique hotels with `is_active = true` distributions
  - List of partner hotels

- **Bookings by Hotel**
  - Count bookings per hotel (via reservations)
  - Revenue per hotel
  - Identify top-performing hotel partnerships

- **Distribution Coverage**
  - Experiences distributed to hotels
  - Average hotels per experience
  - Experiences with no distribution

### 2. Commission Analytics
**Data Source:** `distributions` + `bookings`

- **Commission Structure**
  - View commission rates per hotel-experience pair
  - Compare different commission structures
  - Calculate net revenue after commissions

- **Commission Impact**
  - Revenue before/after commission
  - Total commission paid per hotel
  - Average commission rate

---

## Operational Analytics

### 1. Request Management
**Data Source:** `reservations.is_request`

- **Request Volume**
  - Count of booking requests (`is_request = true`)
  - Request vs instant booking ratio

- **Request Response Time**
  - Time from request to response
  - Response deadline tracking (`response_deadline`)

- **Request Conversion**
  - Requests converted to bookings
  - Request cancellation rate

### 2. Pricing Analytics
**Data Source:** `experiences` + `experience_sessions` + `bookings`

- **Pricing Model Performance**
  - Revenue by pricing type (per_person, flat_rate, base_plus_extra)
  - Average booking value by pricing model
  - Optimal pricing strategy analysis

- **Price Override Usage**
  - Count sessions with `price_override_cents`
  - Impact of price overrides on revenue

- **Participant-Based Pricing**
  - Average revenue per participant
  - Pricing efficiency analysis

### 3. Time-Based Analytics
**Data Source:** `experience_sessions` + `bookings`

- **Peak Booking Times**
  - Most popular session times
  - Day of week patterns
  - Seasonal trends

- **Booking Lead Time**
  - Average days between booking and session
  - Last-minute vs advance bookings

---

## Financial Analytics

### 1. Payout Tracking
**Data Source:** `bookings.stripe_transfer_id`

- **Completed Transfers**
  - Count bookings with `stripe_transfer_id IS NOT NULL`
  - Pending vs completed transfers

- **Transfer Status**
  - Track which bookings have been paid out
  - Identify pending payouts

### 2. Revenue Breakdown
**Data Source:** `bookings` table

- **Amount Distribution**
  - `amount_cents` - Total booking amount
  - `supplier_amount_cents` - Supplier's share
  - `hotel_amount_cents` - Hotel's commission
  - `platform_amount_cents` - Platform fee

- **Net Revenue Analysis**
  - Supplier's net earnings after all fees
  - Average commission rate
  - Total fees paid

---

## Limitations & Missing Data

### What Cannot Be Calculated (Without Additional Data)

1. **Customer Lifetime Value**
   - No customer/user table linking repeat bookings
   - Would need guest email deduplication

2. **Conversion Funnel Metrics**
   - No tracking of widget views or abandoned bookings
   - Would need analytics integration (e.g., Google Analytics)

3. **Guest Satisfaction**
   - No ratings/reviews table
   - Would need to add reviews system

4. **Marketing Attribution**
   - No source tracking for bookings
   - Would need UTM parameters or referral tracking

5. **Geographic Analytics**
   - No location data in current schema
   - Would need PostGIS implementation (see location-system.md)

6. **Real-time Availability**
   - Can calculate from sessions, but no live inventory tracking
   - Current system uses static session availability

7. **Competitive Analysis**
   - No cross-supplier data access
   - Would need aggregated market data

---

## Recommended Analytics Dashboard Structure

### Summary Cards (Top Level)
1. Total Revenue (period filter)
2. Total Bookings (period filter)
3. Active Experiences
4. Active Hotel Partners

### Charts & Visualizations
1. Revenue Over Time (line chart)
2. Bookings Over Time (line chart)
3. Top Experiences (bar chart - by bookings/revenue)
4. Top Hotels (bar chart - by bookings/revenue)
5. Booking Status Distribution (pie chart)
6. Session Utilization (heatmap by day/time)

### Detailed Tables
1. Top Experiences (with booking count, revenue, avg booking value)
2. Top Hotels (with booking count, revenue, commission)
3. Recent Bookings (with guest info, status, amounts)
4. Upcoming Sessions (with availability, bookings)

### Filters Available
- Time Period: All Time / This Year / This Month / This Week / Custom Range
- Experience: All / Specific experience
- Hotel: All / Specific hotel
- Status: All / Confirmed / Completed / Cancelled

---

## Implementation Notes

### Query Performance
- Use database indexes on frequently filtered columns:
  - `bookings.paid_at`
  - `bookings.booking_status`
  - `reservations.created_at`
  - `experience_sessions.session_date`
  - `experiences.partner_id`

### Data Aggregation
- Consider materialized views for complex aggregations
- Cache frequently accessed metrics
- Use database functions for complex calculations

### RLS (Row Level Security)
- Ensure suppliers can only access their own data
- Filter by `partner_id` through experiences relationship
- Current RLS policies already enforce this

### Real-time Updates
- Use Supabase Realtime subscriptions for live updates
- Refresh metrics when bookings change
- Update session availability in real-time

---

## Future Enhancements

### Additional Metrics (Require Schema Changes)
1. **Customer Retention**
   - Add customer/user tracking
   - Track repeat bookings

2. **Guest Reviews**
   - Add reviews/ratings table
   - Average rating per experience

3. **Marketing Analytics**
   - Add source tracking to reservations
   - Track referral sources

4. **Geographic Insights**
   - Implement location system (PostGIS)
   - Analyze bookings by location

5. **Forecasting**
   - Historical trend analysis
   - Revenue/booking predictions

6. **Comparative Analytics**
   - Industry benchmarks (if available)
   - Performance vs similar suppliers
