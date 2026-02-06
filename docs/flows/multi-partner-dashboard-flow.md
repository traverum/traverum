# Multi-Partner Dashboard Flow

## Overview

Traverum's dashboard (`dashboard.traverum.com`) is a unified platform that adapts to different user types and business scenarios. Following modern SaaS best practices, users start with an empty canvas and progressively build their workspace by adding businesses one at a time.

## Organization Model

**Two Core Scenarios:**

1. **Single Organization with Multiple Capabilities**
   - One organization (partner) can have BOTH hotel properties AND experiences
   - Can add multiple hotel properties (hotel_configs) to the same organization
   - Can add multiple experiences to the same organization
   - All capabilities are additive - start as supplier, add hotel later (or vice versa)
   - Example: "Lake Como Resort" organization has 3 hotel properties + 15 experiences

2. **Multiple Organizations for Separate Businesses**
   - Each organization represents a distinct business entity
   - Separate organizations for different legal entities or business units
   - Example: "Hotel Milano" (hotel-only) + "Tour Company Roma" (experiences-only)
   - Example: Agency managing multiple separate hotels as different organizations

**Key Principles:**
- **Capabilities are additive** - An organization can have supplier capabilities, hotel capabilities, or both
- **Multiple properties per organization** - One organization can have multiple hotel_configs (multiple properties)
- **Organization = Business Entity** - Use one org if it's the same business, multiple orgs if separate businesses
- **Progressive building** - Start with one capability, add more as needed

## Core Principles

**Empty State First, Progressive Disclosure, Context-Aware Interface**

1. **Professional Landing** - Inviting landing page before authentication
2. **Empty Canvas** - Start with blank slate, not assumptions
3. **One at a Time** - Add businesses individually during onboarding
4. **Progressive Building** - Add more businesses and capabilities as needed
5. **Context Switching** - Clear visual indication of active business via account dropdown

> **Note:** For detailed onboarding flow, see [Dashboard Onboarding Flow](./dashboard-onboarding-flow.md)

---

## User Scenarios & Flows

### Scenario 1: Pure Experience Supplier

**Who they are:**
- Tour operators, activity providers, guides
- They create and sell experiences
- They do NOT operate a hotel

**Onboarding Flow:**
1. **Landing Page** → Professional landing page with login/signup
2. **Signup** → Simple email + password (no business questions yet)
3. **Empty Canvas** → "Add Your First Business" CTA
4. **Business Type Selection** → Choose "I create and sell experiences"
5. **Business Details** → Organization name, location, etc.
6. **Supplier Dashboard** → Empty state: "Create your first experience"

**What they see:**
1. **Active Business** → Shown in account dropdown (top-left)
2. **Default View:** Supplier Dashboard (`/supplier/dashboard`)
3. **Navigation:** Only supplier-related sections visible:
   - Dashboard (overview)
   - Experiences (create, edit, manage)
   - Sessions (availability calendar)
   - Bookings (incoming requests)
   - Earnings (revenue from all distributions)
4. **No Hotel Section:** Hotel-related navigation is hidden
5. **Account Dropdown:** Shows current organization, option to "Add Organization"

**User Experience:**
- Clean, focused interface
- No confusion about hotel features they don't need
- Can create experiences, set availability, manage bookings
- See earnings from all hotels that sell their experiences
- Can add hotel capabilities later if needed

---

### Scenario 2: Pure Hotel (Distributor Only)

**Who they are:**
- Hotels, resorts, accommodations
- They want to sell experiences to their guests
- They do NOT create their own experiences

**Onboarding Flow:**
1. **Landing Page** → Professional landing page with login/signup
2. **Signup** → Simple email + password
3. **Empty Canvas** → "Add Your First Business" CTA
4. **Business Type Selection** → Choose "I'm a hotel or accommodation"
5. **Business Details** → Hotel name, location
6. **Hotel Dashboard** → Empty state: "Select experiences to showcase"

**What they see:**
1. **Active Business** → Shown in account dropdown (top-left)
2. **Default View:** Experience Selection (`/hotel/dashboard`)
3. **Navigation:** Only hotel-related sections visible:
   - Experience Selection (browse and select experiences to showcase)
   - Commission Reports (earnings from experience sales)
4. **No Supplier Section:** Experience creation/management is hidden
5. **Account Dropdown:** Shows current organization, option to "Add Organization"

**User Experience:**
- Focused on curation, not creation
- Browse available experiences from suppliers
- Toggle which experiences appear in their widget
- See bookings and commissions from their widget sales
- Can add supplier capabilities later if they want to create experiences

---

### Scenario 3: Single Organization with Both Capabilities (Hybrid)

**Who they are:**
- Hotels that also operate their own tours/activities
- Same company manages both the hotel and experiences
- They want to sell their own experiences AND other suppliers' experiences
- May have multiple hotel properties under one organization

**Onboarding Flow:**
1. **Landing Page** → Professional landing page with login/signup
2. **Signup** → Simple email + password
3. **Empty Canvas** → "Add Your First Business" CTA
4. **Business Type Selection** → Choose "I do both" OR start with one capability and add the other later
5. **Business Details** → Combined form (hotel name, slug, organization details)
6. **Hybrid Setup** → Creates both hotel_config and supplier capabilities (or add second capability later)
7. **Supplier Dashboard** → Default view (content creation prioritized), both sections visible

**What they see:**
1. **Active Business** → Shown in account dropdown (top-left)
2. **Default View:** Supplier Dashboard (`/supplier/dashboard`) - prioritized because they create content
3. **Navigation:** Both sections visible:
   - **Supplier Section:**
     - Dashboard
     - Experiences (their own experiences)
     - Sessions
     - Bookings
     - Earnings
   - **Hotel Section:**
     - Experience Selection (to add other suppliers' experiences)
     - Widget Settings (can manage multiple hotel properties)
     - Commission Reports
4. **Account Dropdown:** Shows current organization, option to "Add Organization" (if they want separate businesses)

**Adding Capabilities Later:**
- **Started as Supplier:** Can add hotel capabilities by creating hotel_config → Hotel section appears
- **Started as Hotel:** Can add supplier capabilities by creating experiences → Supplier section appears
- **Multiple Properties:** Can add multiple hotel_configs to same organization for multiple properties

**User Experience:**
- Full control over their own experiences
- Can also curate other suppliers' experiences for their widget
- Can manage multiple hotel properties under one organization
- Seamless switching between managing their products and curating their widget
- All in one place, no need for separate logins

---

### Scenario 4: Multi-Organization Manager

**Who they are:**
- A person who manages multiple distinct businesses
- Example: Hotel owner who also owns a separate tour company (different legal entities)
- Example: Agency managing multiple separate hotels (each as its own organization)
- These are separate legal entities/companies, but same person manages both

**When to Use Multiple Organizations:**
- **Different legal entities** - Separate companies, separate tax IDs, separate businesses
- **Separate business units** - Want complete separation of data, bookings, revenue
- **Different brands** - Each organization represents a distinct brand/identity

**When to Use Single Organization:**
- **Same business entity** - One company that does both hotels and experiences
- **Multiple properties, same owner** - One organization with multiple hotel_configs
- **Unified management** - Want to see everything together, unified reporting

**How They Get There:**
1. **First Business** → Added during initial onboarding
2. **Additional Businesses** → Added later via account dropdown → "Add Organization"
3. **Same Flow** → Each additional business goes through same type selection and setup

**What they see:**
1. **Account Dropdown** (top-left header):
   - Current organization name with capability badges
   - List of all organizations (if multiple)
   - "Add Organization" button
   - Settings, Logout
2. **Organization Switcher:**
   - Shows all organizations user has access to
   - Quick switch between organizations
   - Each organization shows its capabilities (Hotel, Experiences, or Both)
3. **Context Switching:**
   - Select "Hotel Milano" → See hotel-only view (if hotel-only)
   - Select "Tour Company Roma" → See supplier-only view (if supplier-only)
   - Select "Resort Lake Como" → See both sections (if has both capabilities)
4. **Persistent Selection:** Last selected organization is remembered (localStorage + URL parameter)
5. **Smart Defaults:** Most recently accessed organization, or marked default

**User Experience:**
- Single login for all businesses
- Clear visual indication of which business they're currently managing (in account dropdown)
- Easy switching between businesses via account dropdown
- Each business's dashboard adapts to its capabilities
- Complete data isolation between organizations
- Can add new businesses anytime, not just at signup

---

## Technical Flow: How It Works

### 1. Landing & Authentication

**Step 1:** User visits `dashboard.traverum.com`
- **Unauthenticated:** See professional landing page with login/signup
- **Authenticated:** Redirect to `/dashboard`

**Step 2:** User logs in with email/password
- Simple authentication, no business questions
- Email verification required for new signups

**Step 3:** Post-login check
- System fetches all `user_organizations` records for this user
- If no organizations → Show empty canvas with "Add Your First Business"
- If organizations exist → Show dashboard for active organization

### 2. Organization Discovery & Capabilities

**Step 1:** System fetches all `user_partners` records for this user (via `user_partners` table)
**Step 2:** For each organization (partner), system determines capabilities:
   - **Supplier capability:** Organization has experiences OR `partner_type = 'supplier'`
   - **Hotel capability:** Organization has at least one `hotel_config` OR `partner_type = 'hotel'`
   
**Important Notes:**
- Capabilities are **additive** - an organization can have both supplier AND hotel capabilities
- An organization can have **multiple hotel_configs** (multiple properties)
- Capabilities are determined dynamically based on what exists, not just `partner_type`
- Adding experiences to a hotel-only org → gains supplier capability
- Adding hotel_config to a supplier-only org → gains hotel capability

### 3. Active Organization Selection

**Priority Order:**
1. **URL Parameter:** `?partner=abc-123` (if present) - allows sharing/bookmarking specific context
2. **Local Storage:** Last selected organization ID (`traverum_active_partner_id`)
3. **Default:** Marked as `is_default` in `user_partners` table
4. **Fallback:** First organization in list

**Organization Switcher Behavior:**
- **Single Organization:** Shows organization name with capability badges, no dropdown
- **Multiple Organizations:** Shows dropdown with all organizations, current one highlighted
- **Switching:** Updates localStorage, URL parameter, and triggers capability recalculation
- **Persistence:** Selection persists across page refreshes and browser sessions

### 4. Capability-Based Routing

**On `/dashboard` route:**
- **No organizations:** Show empty canvas with "Add Your First Business"
- **Has organization, `isSupplier = true`:** Redirect to `/supplier/dashboard` (even if also hotel)
- **Has organization, `isHotel = true` AND `isSupplier = false`:** Redirect to `/hotel/dashboard`
- **Has organization, no capabilities yet:** Show appropriate empty state based on organization type

**Routing Priority:**
- Supplier dashboard takes priority for hybrid organizations (content creation is primary activity)
- Hotel-only organizations go to hotel dashboard
- Empty states guide users to add their first capability

### 5. Dynamic Navigation

**Sidebar visibility rules:**
- **Supplier sections** appear only if `capabilities.isSupplier = true`
- **Hotel sections** appear only if `capabilities.isHotel = true`
- **Account dropdown** always visible (top-left header)
- **"Add Organization"** always available in account dropdown

### 6. Data Isolation

**All queries filtered by `activePartnerId` (active organization):**
- Experiences shown belong to active organization
- Bookings shown are for active organization (as supplier or hotel)
- Earnings calculated for active organization
- Experience selection shows experiences NOT owned by active organization (for hotels)
- Hotel properties (hotel_configs) shown belong to active organization
- Complete isolation between organizations - no cross-contamination of data

### 7. Empty Canvas States

**No Organization:**
- Large "Add Your First Business" CTA
- Guidance text
- No sidebar navigation (except account dropdown)

**Organization Selected, No Content:**
- Context-aware empty state
- **Supplier:** "Create your first experience"
- **Hotel:** "Select experiences to showcase"
- **Hybrid:** "Create experiences or select from others"

**Organization Selected, Has Content:**
- Normal dashboard view
- Data, charts, lists, etc.

---

## Key Design Decisions

### Why Empty Canvas First?

**Reason:** Modern SaaS best practice. Don't assume what users want. Let them explicitly choose their business type and build from there. Reduces cognitive load and makes onboarding feel intentional.

### Why Account Dropdown Instead of Sidebar Switcher?

**Reason:** 
- **Always accessible** - Top-left is standard location for account management
- **Less clutter** - Doesn't take up sidebar space
- **Professional** - Matches modern SaaS patterns (Stripe, GitHub, etc.)
- **Scalable** - Works for 1 or 100 organizations

### Why Supplier Dashboard is Default for Hybrid?

**Reason:** Suppliers create content, hotels consume it. When a business does both, content creation is the primary activity, so supplier dashboard is the natural landing point.

### Why Hide Sections Based on Capabilities?

**Reason:** Reduces cognitive load. A pure supplier doesn't need to see hotel features they can't use. A pure hotel doesn't need experience creation tools. This keeps the interface clean and focused.

### Why URL + LocalStorage for Organization Selection?

**Reason:** 
- **URL:** Allows sharing/bookmarking specific business context
- **LocalStorage:** Persists selection across sessions
- **Combined:** Best of both worlds - shareable links and persistent preferences

### Why One Business at a Time During Onboarding?

**Reason:** 
- **Less overwhelming** - Focus on one thing
- **Better completion rates** - Simpler flows convert better
- **Can add more later** - Not locked into initial choice
- **Clearer intent** - User explicitly chooses what they're managing

---

## Edge Cases & Special Behaviors

### New User (No Organizations Yet)
- **Empty Canvas:** Shows "Add Your First Business" CTA
- **No Sidebar:** Only account dropdown visible
- **Guidance:** Clear instructions on what to do next
- **No Assumptions:** System doesn't assume they're a supplier

### Organization with No Capabilities Yet
- **Context-Aware Empty State:** Based on organization type selected during creation
- **Supplier:** "Create your first experience"
- **Hotel:** "Select experiences to showcase"
- **Hybrid:** Shows both options
- **Capabilities Update:** Dynamically as they add experiences or hotel_config
- **Progressive Building:** Can start with one capability, add the other later

### User Removed from Organization
- If active organization becomes inaccessible, system falls back to default organization
- If no organizations remain, user sees empty canvas with "Add Your First Business"
- Notification shown: "You no longer have access to [Organization Name]"

### Hotel Selecting Own Experiences
- Experience Selection page excludes experiences owned by the active partner
- Prevents hotels from selecting their own experiences (they're already in their widget)
- Hybrid businesses can still see other suppliers' experiences to add to their widget
- Own experiences appear in supplier section, not in hotel experience selection

### Multiple Hotel Properties in One Organization
- One organization can have multiple `hotel_configs` (multiple properties)
- Each hotel_config has its own slug, display name, and widget settings
- Widget settings managed per property
- Experience selection applies to all properties (or can be property-specific in future)
- Bookings tracked per property via `reservations.hotel_id` → `hotel_config.partner_id`

---

## User Journey Examples

### Journey 1: New Supplier Onboarding
1. User visits landing page → Sees professional invitation
2. Clicks "Get Started" → Signup form (email, password)
3. Confirms email → Redirected to dashboard
4. Sees empty canvas → Clicks "Add Your First Business"
5. Selects "I create and sell experiences"
6. Fills business details → Redirected to supplier dashboard
7. Sees empty state: "Create your first experience"
8. Creates first experience → System detects supplier capability
9. Dashboard shows supplier sections with data

### Journey 2: Hotel Owner Adding Experiences
1. Hotel owner signs up → Confirms email
2. Sees empty canvas → Clicks "Add Your First Business"
3. Selects "I'm a hotel or accommodation"
4. Fills hotel details (name, slug, etc.) → Redirected to hotel dashboard
5. Sees empty state: "Select experiences to showcase"
6. Clicks to browse → Experience Selection page
7. Toggles experiences to add to widget
8. Widget updates automatically

### Journey 3: Single Organization with Both Capabilities
1. Manager logs in → Sees supplier dashboard (default for hybrid)
2. Creates new experience session
3. Navigates to hotel section (both visible in sidebar)
4. Adds competitor's experience to their widget
5. Checks bookings from both their own and curated experiences
6. Account dropdown shows current organization with "Both" badge
7. Can add second hotel property → Creates new hotel_config under same organization
8. Manages multiple properties, all experiences, all in one organization

### Journey 3b: Adding Capabilities to Existing Organization
1. User has "Tour Company" organization (supplier-only)
2. Decides to add hotel capabilities
3. Creates hotel_config → Organization now has both capabilities
4. Hotel section appears in sidebar
5. Can now select other suppliers' experiences for their widget
6. Still manages their own experiences in supplier section

### Journey 4: Multi-Organization Manager
1. Agency manager logs in → Sees first organization's dashboard
2. Clicks account dropdown (top-left) → Sees organization switcher
3. Sees list of all organizations with capability badges
4. Clicks "Add Organization" → Goes through business type selection
5. Adds "Hotel Milano" (hotel-only) → Auto-switches to hotel view
6. Configures widget settings for Hotel Milano
7. Switches back via account dropdown → Selects "Tour Company Roma" (supplier-only)
8. Sees supplier-only view → Manages tour bookings
9. Switches to "Resort Lake Como" (has both capabilities) → Sees hybrid view
10. Manages both own experiences and curated selection
11. All organizations completely isolated - separate data, separate bookings, separate revenue

---

## Future Considerations

### Role-Based Permissions
- Currently: All users with access to a partner have full access
- Future: Add roles (admin, editor, viewer) per partner

### Partner Invitations
- Currently: Partners must be created manually
- Future: Allow users to invite team members to specific partners

### Cross-Partner Analytics
- Currently: Analytics per partner
- Future: Aggregate view across all partners for multi-business managers

### Partner Templates
- Currently: Manual setup for each partner
- Future: Templates for common business types (hotel, tour operator, etc.)

---

## Summary

The multi-partner dashboard provides a **professional, unified, context-aware experience** that:
- ✅ **Starts simple** - Empty canvas, no assumptions
- ✅ **Progressive onboarding** - Add businesses one at a time
- ✅ **Professional landing** - Inviting page before authentication
- ✅ **Context-aware** - Dashboard adapts to active organization
- ✅ **Supports all business types** - Supplier, hotel, or both in one organization
- ✅ **Flexible organization model** - One org with multiple capabilities OR multiple orgs for separate businesses
- ✅ **Multiple properties** - One organization can have multiple hotel properties
- ✅ **Additive capabilities** - Start with one capability, add more as needed
- ✅ **Scalable management** - Add organizations anytime via account dropdown
- ✅ **Clear visual hierarchy** - Account dropdown for organization management
- ✅ **Empty states** - Context-aware guidance when no content
- ✅ **Complete data isolation** - Each organization context is isolated
- ✅ **Scales seamlessly** - From single-business to enterprise multi-business management

**Key Model Clarifications:**
- **One Organization = One Business Entity** - Can have hotels AND experiences
- **Multiple Organizations = Separate Businesses** - Complete data separation
- **Capabilities are Additive** - Add hotel to supplier org, or supplier to hotel org
- **Multiple Properties** - One org can manage multiple hotel_configs

The system follows modern SaaS best practices: **start simple, build progressively, scale infinitely**.

> **Related Documentation:**
> - [Dashboard Onboarding Flow](./dashboard-onboarding-flow.md) - Detailed onboarding and empty state flows
