# Feature Ideas - Prioritized List

**Last Updated:** 2026-02-10

**Latest Addition:** Product-first website transformation (Feature #16)

This document contains all feature ideas discussed, prioritized by implementation complexity and expected impact.

---

## Priority Ranking System

- **Simple & Effective** ⭐⭐⭐: Easy to implement, high impact
- **Simple & Moderate Impact** ⭐⭐: Easy to implement, medium impact  
- **Complex & Effective** ⭐: Hard to implement, high impact
- **Complex & Low Impact** ⚠️: Hard to implement, low impact

---

## ⭐⭐⭐ Simple & Effective (Do First)

### 1. Self-Owned Experience Commission Fix
**Impact:** Critical bug fix, prevents hotels paying themselves  
**Complexity:** Low  
**Effort:** 2-4 hours

- Auto-detect when `hotel_id == experience.partner_id`
- Set commission: Supplier 92%, Hotel 0%, Platform 8%
- Update `calculateCommissionSplit()` function
- No UI changes needed (automatic)

**Database:** None (logic only)

---

### 2. Supplier Contact Info in Receptionist Mode
**Impact:** High - enables direct communication for receptionists  
**Complexity:** Low  
**Effort:** 1-2 hours

- Show supplier email/phone on experience detail page
- Only visible when `isReceptionistMode === true`
- Read from `partners` table
- Conditional rendering in widget

**Database:** None (read existing data)

---

### 3. Auto-Create Distribution for Receptionist Bookings
**Impact:** High - removes friction for receptionist flow  
**Complexity:** Low  
**Effort:** 2-3 hours

- When receptionist books experience without distribution
- Auto-create with default rates (80/12/8)
- Add notification: "New experience booked via receptionist - review rates"
- Simple check in booking creation logic

**Database:** None (uses existing distributions table)

---

### 4. Hotel Location Settings UI (Move to hotel_configs)
**Impact:** High - enables per-property location  
**Complexity:** Low  
**Effort:** 3-4 hours

- Move location fields from `partners` to `hotel_configs`
- Update existing LocationSettings component
- Add address, location, radius_km fields
- Save to `hotel_configs` instead of `partners`

**Database:**
```sql
ALTER TABLE hotel_configs 
  ADD COLUMN location geography(POINT, 4326),
  ADD COLUMN location_radius_km integer DEFAULT 25,
  ADD COLUMN address text;
```

---

### 5. Track Booking Creator (booked_by_user_id)
**Impact:** Medium - enables receptionist analytics  
**Complexity:** Low  
**Effort:** 1 hour

- Add `booked_by_user_id` to reservations
- Set when booking created
- Track in dashboard analytics

**Database:**
```sql
ALTER TABLE reservations 
  ADD COLUMN booked_by_user_id uuid REFERENCES users(id);
```

---

## ⭐⭐ Simple & Moderate Impact (Do Next)

### 6. Simplified Hotel Invitation System (MVP)
**Impact:** High - growth engine  
**Complexity:** Medium  
**Effort:** 8-12 hours

- Supplier "Invite Hotels" page
- Google Places API integration (find hotels by location)
- Simple list: name + website
- Pre-written email template
- One-click send invitations
- Track sent/joined status

**Database:**
```sql
CREATE TABLE hotel_invitations (
  id uuid PRIMARY KEY,
  supplier_id uuid REFERENCES partners(id),
  experience_id uuid REFERENCES experiences(id),
  hotel_name text,
  hotel_website text,
  place_id text,
  sent_at timestamptz,
  status text, -- sent, clicked, joined
  partner_id uuid REFERENCES partners(id) -- when they join
);
```

**APIs:** Google Places API, Email service (Resend/SendGrid)

---

### 7. Receptionist Booking Route
**Impact:** High - core receptionist feature  
**Complexity:** Medium  
**Effort:** 6-8 hours

- New route: `book.traverum.com/receptionist/{hotelSlug}`
- Reuse widget components
- Modified checkout: guest email field
- Show all experiences in radius (not just selected)
- Use `get_experiences_within_radius()` function

**Database:** Uses existing tables

---

### 8. Basic Role Enforcement (UI Only)
**Impact:** Medium - security and UX  
**Complexity:** Medium  
**Effort:** 4-6 hours

- Permission helper functions
- Hide/show UI elements based on role
- Role checks in components
- No RLS changes yet (Phase 1)

**Database:** None (uses existing user_partners.role)

---

### 9. Supplier "Find Hotels" Page (Internal)
**Impact:** Medium - marketplace feature  
**Complexity:** Medium  
**Effort:** 6-8 hours

- Show hotels within experience radius
- Use existing `get_hotels_near_experience()` function
- Display hotel name, location, existing partnerships
- "Request Onboarding" button
- Simple request system

**Database:**
```sql
CREATE TABLE supplier_hotel_requests (
  id uuid PRIMARY KEY,
  supplier_id uuid REFERENCES partners(id),
  hotel_id uuid REFERENCES partners(id),
  experience_id uuid REFERENCES experiences(id),
  status text, -- pending, accepted, declined
  message text,
  created_at timestamptz
);
```

---

### 10. Hotel "Partnership Requests" Dashboard
**Impact:** Medium - completes marketplace loop  
**Complexity:** Medium  
**Effort:** 4-6 hours

- Show incoming supplier requests
- View supplier profile + experiences
- Accept/Decline buttons
- Auto-create distribution on accept
- Notification badge

**Database:** Uses supplier_hotel_requests table

---

## ⭐ Complex & Effective (Do Later)

### 11. Custom Commission Rate Negotiation
**Impact:** High - enables flexible partnerships  
**Complexity:** High  
**Effort:** 12-16 hours

- Hotels propose custom rates
- Suppliers approve/reject
- Platform rate locked at 8%
- Approval workflow UI
- Email notifications

**Database:**
```sql
ALTER TABLE distributions
  ADD COLUMN commission_status text DEFAULT 'default',
  ADD COLUMN proposed_commission_hotel numeric,
  ADD COLUMN proposed_commission_supplier numeric,
  ADD COLUMN proposed_at timestamptz,
  ADD COLUMN approved_at timestamptz;
```

---

### 12. Full Role-Based Access Control (RLS)
**Impact:** High - security and multi-user support  
**Complexity:** High  
**Effort:** 16-20 hours

- Update RLS policies for all roles
- Role-specific data access
- Permission checks in database
- Comprehensive testing

**Database:** RLS policy updates across all tables

---

### 13. User Invitation System
**Impact:** High - enables team collaboration  
**Complexity:** High  
**Effort:** 12-16 hours

- Invite users via email
- Token-based acceptance
- Role assignment during invite
- Invite management UI
- Resend/revoke invites

**Database:**
```sql
CREATE TABLE user_invitations (
  id uuid PRIMARY KEY,
  partner_id uuid REFERENCES partners(id),
  email text,
  role text,
  invited_by uuid REFERENCES users(id),
  token text UNIQUE,
  expires_at timestamptz,
  accepted_at timestamptz
);
```

---

### 14. Advanced Hotel Discovery (Google Maps Integration)
**Impact:** Medium - enhanced UX  
**Complexity:** High  
**Effort:** 10-12 hours

- Interactive map showing hotels
- Click to select hotels
- Visual radius display
- Bulk selection tools

**APIs:** Google Maps JavaScript API

---

### 15. Email Template Customization
**Impact:** Medium - personalization  
**Complexity:** Medium  
**Effort:** 6-8 hours

- Let suppliers customize email template
- Save templates per supplier
- Preview before sending
- A/B testing support

**Database:**
```sql
CREATE TABLE email_templates (
  id uuid PRIMARY KEY,
  supplier_id uuid REFERENCES partners(id),
  template_name text,
  subject text,
  body_html text,
  is_default boolean
);
```

---

### 16. Product-First Website (traverum.com Transformation)
**Impact:** Very High - major growth engine, viral acquisition  
**Complexity:** High  
**Effort:** 20-30 hours (can be phased)

Transform traverum.com into a lightweight, product-first landing that routes users directly to the product with zero friction. Users can use the product immediately without login, then create account to save progress.

**Core Concept:**
- Role selector landing page: "Hotel owner or supplier or both?"
- Immediate product access (no login required)
- localStorage persistence → account creation conversion
- Built-in viral growth mechanisms

**Phase 1: MVP (⭐⭐ - 8-12 hours)**
- Role selector landing page (`traverum.com/`)
- Hotel receptionist view (`traverum.com/hotel`) - no login
  - Location detection (browser geolocation or manual)
  - Show experiences within radius using `get_experiences_within_radius()`
  - Full booking flow (localStorage)
  - "Save your hotel → Sign up free" CTA
- Empty state for hotels with no experiences
  - "Invite experiences to join" CTA
  - Simple email template system

**Phase 2: Growth Engine (⭐ - 8-10 hours)**
- Google Places API integration
  - Find local businesses (restaurants, tours, activities) near hotel
  - One-click invitation system
  - Pre-filled email templates
- Hotel → Supplier invitation tracking
  - Track invitations sent
  - Auto-create distribution when supplier signs up via hotel link
  - Referral code system
- Supplier → Hotel invitation system
  - "Find Hotels" page showing hotels within experience radius
  - Invitation tracking

**Phase 3: Supplier Preview (⭐ - 4-6 hours)**
- Supplier dashboard preview (`traverum.com/supplier`) - no login
  - Experience creation demo (localStorage)
  - Preview widget view
  - "Go live" requires account
  - "Save your work?" conversion flow after 2-3 actions

**Database:**
```sql
-- Extend existing hotel_invitations table (from feature #6)
ALTER TABLE hotel_invitations
  ADD COLUMN referral_code text,
  ADD COLUMN hotel_email text,
  ADD COLUMN auto_distribute boolean DEFAULT false;

-- Track localStorage → account conversions
CREATE TABLE guest_sessions (
  id uuid PRIMARY KEY,
  session_token text UNIQUE,
  role text, -- 'hotel' or 'supplier'
  location geography(POINT, 4326),
  hotel_name text,
  actions_count integer DEFAULT 0,
  created_at timestamptz,
  converted_to_user_id uuid REFERENCES users(id),
  converted_at timestamptz
);

-- Track business invitations (hotel → supplier)
CREATE TABLE business_invitations (
  id uuid PRIMARY KEY,
  hotel_session_id uuid REFERENCES guest_sessions(id),
  business_name text,
  business_type text, -- 'restaurant', 'tour', 'activity'
  place_id text,
  email text,
  sent_at timestamptz,
  status text, -- 'sent', 'clicked', 'joined'
  supplier_id uuid REFERENCES partners(id) -- when they join
);
```

**APIs:** Google Places API, Geolocation API, Email service

**Key Growth Mechanisms:**
1. **Hotel → Supplier invitations:** Hotels invite local businesses, auto-create partnerships
2. **Supplier → Hotel invitations:** Suppliers discover and invite nearby hotels
3. **Guest → Hotel conversion:** Widget footer CTA for hotel owners
4. **Social proof:** Public map showing "Hotels using Traverum" (anonymized)

**Design Principles:**
- Zero friction: no login until they want to save
- Immediate value: show product in <5 seconds
- Viral by design: every action can invite others
- Progressive disclosure: reveal features as they use it

**Note:** Can be implemented incrementally. Phase 1 provides immediate value and can be ⭐⭐ priority. Phases 2-3 add growth mechanisms.

---

## ⚠️ Complex & Low Impact (Consider Carefully)

### 17. Travel Organizations (Parent-Child Structure)
**Impact:** Low - niche use case  
**Complexity:** Very High  
**Effort:** 40+ hours

- Parent organization managing multiple hotels
- Centralized billing
- Cross-hotel analytics
- Bulk operations
- Complex permission system

**Database:**
```sql
ALTER TABLE partners 
  ADD COLUMN parent_org_id uuid REFERENCES partners(id);
```

**Note:** Only implement if clear customer demand

---

### 18. Guest Role for In-Room Tablets
**Impact:** Low - already solved with widget  
**Complexity:** Medium  
**Effort:** 8-10 hours

- Guest login system
- Read-only access
- Special guest dashboard

**Decision:** ❌ Not needed - use existing widget without login

---

### 19. Advanced Analytics Dashboard
**Impact:** Medium - nice to have  
**Complexity:** High  
**Effort:** 20+ hours

- Network growth metrics
- Conversion funnels
- Revenue analytics
- Cross-org reporting

**Note:** Implement incrementally, not all at once

---

## Feature Categories Summary

### Commission Management
1. Self-owned experience fix ⭐⭐⭐
2. Custom commission negotiation ⭐

### Receptionist Features
3. Receptionist booking route ⭐⭐
4. Supplier contact info ⭐⭐⭐
5. Auto-create distribution ⭐⭐⭐
6. Track booking creator ⭐⭐⭐

### Growth & Marketplace
7. Hotel invitation system (MVP) ⭐⭐
8. Supplier "Find Hotels" ⭐⭐
9. Hotel "Partnership Requests" ⭐⭐
10. Advanced hotel discovery ⭐
16. Product-first website (traverum.com) ⭐ (Phase 1: ⭐⭐)

### Multi-User & Roles
11. Basic role enforcement ⭐⭐
12. Full RLS implementation ⭐
13. User invitation system ⭐

### Infrastructure
14. Hotel location to hotel_configs ⭐⭐⭐
15. Email template customization ⭐

### Future/Maybe
17. Travel organizations ⚠️
18. Guest role ⚠️ (rejected)
19. Advanced analytics ⚠️

---

## Recommended Implementation Order

### Sprint 1 (Critical Fixes)
1. Self-owned experience commission fix
2. Track booking creator
3. Hotel location to hotel_configs

### Sprint 2 (Receptionist MVP)
4. Receptionist booking route
5. Supplier contact info in receptionist mode
6. Auto-create distribution

### Sprint 3 (Growth Engine)
7. Hotel invitation system (MVP)
8. Supplier "Find Hotels" page
9. Hotel "Partnership Requests"
16. Product-first website - Phase 1 (MVP) ⭐⭐

### Sprint 4 (Multi-User)
10. Basic role enforcement
11. User invitation system

### Sprint 5 (Advanced)
12. Custom commission negotiation
13. Full RLS implementation
16. Product-first website - Phase 2 (Growth Engine) ⭐
16. Product-first website - Phase 3 (Supplier Preview) ⭐

---

## Notes

- **Self-owned commission fix** should be done immediately (bug fix)
- **Receptionist features** are high priority for hotel adoption
- **Growth features** can be built incrementally (start with MVP)
- **Product-first website (Phase 1)** is high priority for growth - enables viral acquisition
- **Multi-user features** can wait until there's demand
- **Travel organizations** only if clear customer need

---

## Quick Reference: Database Changes Needed

```sql
-- Priority 1: Receptionist & Location
ALTER TABLE hotel_configs 
  ADD COLUMN location geography(POINT, 4326),
  ADD COLUMN location_radius_km integer DEFAULT 25,
  ADD COLUMN address text;

ALTER TABLE reservations 
  ADD COLUMN booked_by_user_id uuid REFERENCES users(id);

-- Priority 2: Growth Features
CREATE TABLE hotel_invitations (...);
CREATE TABLE supplier_hotel_requests (...);
CREATE TABLE guest_sessions (...);
CREATE TABLE business_invitations (...);

-- Priority 3: Commission Negotiation
ALTER TABLE distributions
  ADD COLUMN commission_status text,
  ADD COLUMN proposed_commission_hotel numeric,
  ADD COLUMN proposed_commission_supplier numeric;

-- Priority 4: User Invitations
CREATE TABLE user_invitations (...);
```
