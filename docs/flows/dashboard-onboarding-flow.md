# Dashboard Onboarding & Management Flow

## Overview

Traverum's dashboard follows modern SaaS best practices with a clean, progressive onboarding experience. Users start with an empty canvas and build their workspace incrementally, adding businesses one at a time as needed.

## Core Principles

1. **Empty State First** - Start with a blank canvas, not assumptions
2. **Progressive Disclosure** - Show only what's needed, when it's needed
3. **One Thing at a Time** - Add businesses individually, not all at once
4. **Context Switching** - Clear visual indication of what you're managing
5. **Professional Landing** - Inviting, modern landing page before login

---

## User Journey

### Phase 1: Landing & Authentication

#### 1.1 Landing Page (`dashboard.traverum.com`)

**Unauthenticated State:**
- Modern, professional landing page
- Clear value proposition
- "Get Started" / "Log In" CTA buttons (Traverum teal `#0D9488`, 28px height, 3px radius, `4px 12px` padding)
- No overwhelming information - just invitation to explore

**Design Elements:**
- Clean, minimal design
- Warm white/beige background `#FEFCF9` (almost pure white, slightly warmer)
- Traverum branding
- Clear call-to-action (visual, prominent)
- Muted "old money" color palette (no bright colors)

#### 1.2 Authentication

**Login/Signup:**
- Simple email + password
- Login with email, sends magic link for easy log in
- Google login
- Forgot password link
- Sign up link for new users
- Google signup
- Input styling: Borderless inputs, 32px height, 3px radius, background `rgba(242, 241, 238, 0.6)`, inset focus shadow
- Primary buttons: Traverum teal `#0D9488`, 28px height, 3px radius
- Background: Warm white/beige `#FEFCF9`

**Signup Flow:**
- Email, password
- Terms acceptance
- Email verification required
- No business type questions yet - keep it simple
- Google signup

---

### Phase 2: First-Time User Experience

#### 2.1 Empty Canvas (Post-Login)

**What Users See:**
- Clean, empty dashboard
- Centered call-to-action: **"Add Your First Business"** button/plus icon
- Subtle guidance text: "Start by adding your business to get started" (or use "?" icon with hover tooltip)
- No overwhelming navigation or options

**Design:**
- Large, prominent plus button or card (Traverum teal `#0D9488`, 28px height, 3px radius)
- Card styling: Warm white background `#FEFCF9`, subtle border `1px solid rgba(55, 53, 47, 0.09)`, 16px padding, 4px radius
- Minimal sidebar (just account dropdown) - warm white background, right border for distinction
- Empty state illustration or icon (visual, not text-heavy)
- Welcoming, not intimidating
- Background: Warm white/beige `#FEFCF9` (unified everywhere)

#### 2.2 Add Business Flow

**Step 1: Business Type Selection**
When user clicks "Add Your First Business", show modal/page with:

- Modal styling: Warm white background `#FEFCF9`, subtle border `1px solid rgba(55, 53, 47, 0.09)`, 8px radius, layered shadow for elevation (not distinction)
- Radio buttons: Visual selection, muted colors
- Helper text: Use "?" icon with hover tooltip (not always-visible text)
- Continue button: Traverum teal `#0D9488`, 28px height, 3px radius
- Cancel button: Muted colors, 28px height, 3px radius

```
What type of business are you?

○ I create and sell experiences (Supplier)
  [?] Tour operators, activity providers, guides (hover tooltip)

○ I'm a hotel or accommodation (Hotel)
  [?] Hotels, resorts, B&Bs that want to sell experiences (hover tooltip)

○ I do both (Hybrid)
  [?] Hotels that also create their own experiences (hover tooltip)

[Continue] [Cancel]
```

**Step 2: Business Details**
Based on selection, collect:

- Form styling: Warm white background `#FEFCF9`, cards with subtle borders
- Inputs: Borderless, 32px height, 3px radius, background `rgba(242, 241, 238, 0.6)`, inset focus shadow
- Labels: Minimal text, use "?" icon with hover tooltip for explanations
- Required fields: Asterisk (*) indicator, not always-visible text

**For All Types:**
- Business/Organization Name (required - visual indicator)
- Email (pre-filled from account)
- City, Country (optional but recommended - subtle label)

**For Suppliers:**
- Business type (Individual, Company, etc.)
- Tax ID (optional, can add later)

**For Hotels:**
- Hotel Name
- Hotel Slug (for widget URL)
- Display Name (how it appears in widget)

**For Hybrid:**
- All of the above (combined form)

**Step 3: Initial Setup**

**For Suppliers:**
- Redirect to supplier dashboard
- Show empty state: "Create your first experience" (visual icon, minimal text)
- Optional: Prompt to connect Stripe (can skip, required before first booking)
  - Warning indicator: Muted gold `#C9A961` (not bright yellow)
  - Action button: Traverum teal `#0D9488`, 28px height, 3px radius

**For Hotels:**
- Redirect to hotel dashboard
- Show empty state: "Select experiences to showcase" (visual icon, minimal text)
- Widget setup wizard (optional, can do later)
  - Primary action: Traverum teal `#0D9488`, 28px height, 3px radius

**For Hybrid:**
- Redirect to supplier dashboard (content creation first)
- Show both sections in sidebar (warm white background, right border for distinction)
- Can add hotel widget later or do it now

---

### Phase 3: Dashboard Structure

#### 3.1 Header Layout

**Left Side:**
- **Account Dropdown** (always visible, dropdown is named after the company name they are currently managing. like in notion or stripe)
  - User email/name
  - "Manage Organizations" (if multiple)
  - "Add Organization" (always available)
  - Logout
  - Dropdown styling: Warm white background `#FEFCF9`, subtle border, 4px radius

**Center:**
- **Empty Canvas** (if no business or empty state) - warm white background

**Right Side:**
- Help/Support link

**Header Styling:**
- Background: Warm white `#FEFCF9` (same as page)
- Border: Bottom border `1px solid rgba(55, 53, 47, 0.09)` (subtle separation)
- Height: 45px (compact)

#### 3.2 Empty Canvas States

**No Business Selected:**
- CTA for adding your company

**Business Selected, No Content:**
- Context-aware empty state
- **Supplier:** "Create your first experience" (visual icon, minimal text)
- **Hotel:** "Select experiences to showcase" (visual icon, minimal text)
- **Hybrid:** "Create experiences or select from others" (visual icon, minimal text)
- Primary action button: Traverum teal `#0D9488`, 28px height, 3px radius

**Business Selected, Has Content:**
- Normal dashboard view
- Cards: Warm white background `#FEFCF9`, subtle borders for distinction, 16px padding, 4px radius

#### 3.3 Sidebar Navigation

**Dynamic based on active business capabilities:**
- Only shows relevant sections
- Supplier sections (if `isSupplier`)
- Hotel sections (if `isHotel`)
- Both if hybrid

**Sidebar Styling:**
- Background: Warm white `#FEFCF9` (same as page)
- Border: Right border `1px solid rgba(55, 53, 47, 0.09)` (subtle separation)
- Width: 224px (compact)
- Item height: 28px
- Item padding: `4px 10px`
- Item radius: 8px (hover)
- Icon size: 22px

---

### Phase 4: Multi-Business Management

#### 4.1 Account Dropdown Structure

- Dropdown styling: Warm white background `#FEFCF9`, subtle border `1px solid rgba(55, 53, 47, 0.09)`, 4px radius
- Items: 28px height, `4px 10px` padding, 8px radius on hover

#### 4.2 Manage Organizations Modal/Page

**Shows:**
- List of all organizations user manages
- Page styling: Warm white background `#FEFCF9`, cards with subtle borders `1px solid rgba(55, 53, 47, 0.09)`, 16px padding, 4px radius
- For each:
  - Organization name (visual, prominent)
  - Type badge (Supplier, Hotel, Hybrid) - muted colors, visual indicator
  - "Switch to" button (Traverum teal `#0D9488`, 28px height, 3px radius)
  - "Edit" button (muted colors, 28px height, 3px radius)
  - "Remove" button (muted terracotta `#B8866B`, 28px height, 3px radius) (if not only one)

**Actions:**
- Switch active organization
- Edit organization details
- Add new organization
- Remove organization (with confirmation)

#### 4.3 Add Organization Flow

**Same as initial "Add Business" flow:**
1. Business type selection
2. Business details
3. Initial setup
4. Auto-switch to new organization

**Key Difference:**
- Can be done anytime from account dropdown
- No limit on number of organizations
- Each organization is independent

---

## Technical Implementation

### State Management

**Active Organization:**
- Stored in context (`ActivePartnerProvider`)
- Persisted in localStorage
- URL parameter: `?org=abc-123` (optional, for sharing)
- Default: First organization or most recently used

**Empty State Detection:**
```typescript
const isEmpty = 
  !activeOrganization || 
  (isSupplier && experienceCount === 0) ||
  (isHotel && selectedExperiencesCount === 0);
```

### Routing Structure

```
/dashboard (landing/empty state)
  ├── /dashboard?org=abc-123 (specific org)
  ├── /supplier/dashboard (supplier view)
  ├── /hotel/dashboard (hotel view)
  └── /onboarding/add-business (add business flow)
```

### Database Changes Needed

**New Fields:**
- `organizations.created_at` (already exists)
- `organizations.is_default` (mark default org)
- `user_organizations.last_accessed_at` (for smart defaults)

**Migration:**
- Update trigger to NOT auto-create organization
- Create organization only when user explicitly adds one
- Update `user_organizations` to support multiple

---

## UI/UX Guidelines

### Empty States

**Design Principles:**
- Clear, action-oriented copy (minimal text, visual indicators)
- Card styling: Warm white background `#FEFCF9`, subtle border `1px solid rgba(55, 53, 47, 0.09)`, 16px padding, 4px radius
- Background: Unified warm white/beige `#FEFCF9`

### Account Dropdown

**Always Accessible:**
- Top-left corner
- Current company name
- Clear visual hierarchy
- Keyboard accessible

**Styling:**
- Background: Warm white `#FEFCF9`
- Border: Subtle border `1px solid rgba(55, 53, 47, 0.09)`
- Items: 28px height, `4px 10px` padding
- Hover: `rgba(55, 53, 47, 0.08)` background

### Context Switching

**Visual Indicators:**
- Active organization name in header (dropdown button) (visual, prominent)
- Subtle animation on switch (20ms transition, feels instant)
- URL updates for bookmarking

---

## Edge Cases

### New User (No Organizations)
- Show empty canvas with "Add Your First Business" (Traverum teal button, visual icon)
- No sidebar navigation (except account dropdown)
- Welcome message (minimal text, visual icon)
- Background: Warm white `#FEFCF9`
- Card: Subtle border for distinction, 16px padding, 4px radius

### User with One Organization
- No organization switcher needed
- Account dropdown shows current org
- "Add Organization" always available

### User with Multiple Organizations
- Organization switcher in account dropdown
- "Manage Organizations" link
- Quick switch between recent (last 3-4)

### Organization with No Capabilities Yet
- Show appropriate empty state
- Guide user to add capabilities
- "Add Hotel Widget" or "Create Experience" prompts

### Removed from Organization
- Graceful fallback to default organization
- Notification: Visual banner (muted terracotta `#B8866B`, not bright red) with minimal text
- Auto-switch to accessible organization
- Banner styling: Warm white background, subtle border, muted terracotta accent

---

## Migration Path

### For Existing Users

**Phase 1: Backward Compatibility**
- Existing users with organizations → Auto-select first organization
- Show "Add Organization" in account dropdown
- No breaking changes

**Phase 2: Onboarding Update**
- New signups → Empty canvas flow
- Existing users → Can add more organizations anytime

**Phase 3: Cleanup**
- Remove old hardcoded supplier creation
- Update all flows to use new pattern

---

## Benefits of This Approach

### User Experience
✅ **Less Overwhelming** - Start simple, add complexity as needed
✅ **Clear Intent** - User explicitly chooses what they're managing
✅ **Professional** - Matches modern SaaS expectations
✅ **Flexible** - Can add businesses anytime, not just at signup

### Technical
✅ **Cleaner Code** - No hardcoded assumptions
✅ **Better Testing** - Clear states to test
✅ **Scalable** - Easy to add new business types
✅ **Maintainable** - Clear separation of concerns

### Business
✅ **Lower Friction** - Simple signup, progressive onboarding
✅ **Better Conversion** - Less overwhelming = more completions
✅ **Clearer Value** - Users see value immediately after adding business
✅ **Upsell Opportunities** - Easy to add second business type

---

## Future Enhancements

### Onboarding Wizard
- Multi-step guided setup
- Progress indicator
- Skip options at each step
- Contextual help

### Templates
- Pre-configured business types
- Industry-specific setups
- Quick start options

### Invitations
- Invite team members to organization
- Role-based access
- Collaboration features

### Analytics
- Track onboarding completion
- Identify drop-off points
- A/B test different flows

---

## Summary

This flow transforms Traverum's dashboard into a **professional, user-friendly SaaS experience** that:

1. **Welcomes users** with a clean landing page
2. **Guides them** through adding their first business
3. **Adapts** to their business type automatically
4. **Scales** as they add more businesses
5. **Maintains clarity** through empty states and context switching

The key is **starting simple and building complexity progressively**, not overwhelming users with options they don't need yet.
