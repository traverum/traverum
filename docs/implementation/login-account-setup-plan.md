# Login & Account Setup Implementation Plan

## Overview

This document outlines the implementation plan for the login and account setup flow based on the dashboard onboarding flow and design principles. The goal is to create a clean, minimal authentication experience followed by a progressive account setup process.

---

## Phase 1: Landing Page Enhancement

### Current State
- Basic landing page exists at `apps/dashboard/src/pages/Index.tsx`
- Simple "Create Account" and "Log In" buttons
- Uses generic styling

### Required Changes

**File:** `apps/dashboard/src/pages/Index.tsx`

**Design Updates:**
1. **Background:** Change to warm white/beige `#FEFCF9`
2. **Typography:** Use Poppins font (ensure it's loaded)
3. **Buttons:** 
   - Traverum teal `#0D9488` for primary CTA
   - Height: 28px, radius: 3px, padding: `4px 12px`
   - "Get Started" (primary) and "Log In" (outline variant)
4. **Layout:** 
   - Clean, minimal design
   - Clear value proposition (1-2 sentences max)
   - No overwhelming information
   - Muted "old money" color palette

**Implementation Steps:**
1. Update background color to `#FEFCF9`
2. Update button styling to match design system
3. Add subtle value proposition text (minimal, visual-first)
4. Ensure proper spacing (8px grid system)
5. Add 20ms transitions for button interactions

---

## Phase 2: Authentication Page Redesign

### Current State
- Auth page exists at `apps/dashboard/src/pages/Auth.tsx`
- Supports login and signup modes
- Basic email + password authentication
- Missing: magic link, Google login, forgot password

### Required Changes

**File:** `apps/dashboard/src/pages/Auth.tsx`

**New Features:**
1. **Magic Link Login** - "Login with email" sends magic link
2. **Google OAuth** - Google login/signup buttons
3. **Forgot Password** - Link to reset password flow
4. **Terms Acceptance** - Checkbox for signup (visual indicator, not text-heavy)

**Design Updates:**
1. **Background:** Warm white/beige `#FEFCF9`
2. **Inputs:** 
   - Borderless, 32px height, 3px radius
   - Background: `rgba(242, 241, 238, 0.6)`
   - Focus: Inset box-shadow `inset 0 0 0 1px rgba(35, 131, 226, 0.57)`
3. **Buttons:**
   - Primary: Traverum teal `#0D9488`, 28px height, 3px radius
   - Secondary: Muted colors, same dimensions
4. **Card:**
   - Warm white background `#FEFCF9`
   - Subtle border `1px solid rgba(55, 53, 47, 0.09)`
   - 8px radius
   - 16px padding
5. **Layout:**
   - Remove company name from signup (per flow docs - no business questions yet)
   - Minimal text, visual indicators
   - Clean separation between login/signup modes

**Implementation Steps:**

1. **Update useAuth Hook** (`apps/dashboard/src/hooks/useAuth.tsx`):
   - Add `signInWithMagicLink(email: string)` method
   - Add `signInWithGoogle()` method
   - Add `resetPassword(email: string)` method
   - Update `signUp` to remove `companyName` parameter (no business questions at signup)

2. **Update Auth.tsx Component:**
   - Remove company name field from signup form
   - Add magic link option (toggle or separate button)
   - Add Google OAuth buttons (login and signup)
   - Add "Forgot password?" link
   - Add terms acceptance checkbox (signup only)
   - Update styling to match design system
   - Add proper error handling and success messages
   - Implement loading states

3. **Magic Link Flow:**
   - Show email input
   - On submit, send magic link
   - Display success message: "Check your email for the login link"
   - Handle callback from email link

4. **Google OAuth Flow:**
   - Configure Supabase OAuth provider
   - Add Google login/signup buttons
   - Handle OAuth callback
   - Redirect appropriately after authentication

5. **Password Reset Flow:**
   - Add "Forgot password?" link below password field
   - Show email input modal/page
   - Send reset email
   - Handle reset callback

**Component Structure:**
```
Auth.tsx
├── Login Mode
│   ├── Email input
│   ├── Password input
│   ├── "Forgot password?" link
│   ├── "Log In" button (email/password)
│   ├── OR divider
│   ├── "Login with email" button (magic link)
│   ├── "Continue with Google" button
│   └── "Don't have an account? Create one" link
└── Signup Mode
    ├── Email input
    ├── Password input
    ├── Terms acceptance checkbox (visual, minimal)
    ├── "Create Account" button
    ├── OR divider
    ├── "Sign up with Google" button
    └── "Already have an account? Log in" link
```

---

## Phase 3: Post-Authentication Flow

### Current State
- `Dashboard.tsx` redirects based on capabilities
- No empty state handling for users with no organizations
- No onboarding flow for first-time users

### Required Changes

**File:** `apps/dashboard/src/pages/Dashboard.tsx`

**Empty Canvas State:**
When user has no organizations:
- Show centered empty state
- Large "Add Your First Business" button/CTA
- Subtle guidance (minimal text, visual icon)
- No sidebar navigation (except account dropdown)
- Warm white background `#FEFCF9`

**Implementation Steps:**

1. **Update Dashboard.tsx:**
   - Check if user has any organizations
   - If no organizations → Show empty canvas
   - If has organizations → Redirect based on capabilities (existing logic)

2. **Create EmptyCanvas Component:**
   - Centered layout
   - Large plus icon or visual element
   - "Add Your First Business" button (Traverum teal, 28px height)
   - Subtle guidance text (minimal)
   - Link to `/onboarding/add-business`

3. **Update useActivePartner Hook:**
   - Handle case when `userPartners.length === 0`
   - Return `null` for `activePartner` when no organizations exist
   - Update `isLoading` logic to handle empty state

---

## Phase 4: Account Setup Flow (Add Business)

### New Components Required

**Route:** `/onboarding/add-business`

**Step 1: Business Type Selection**

**File:** `apps/dashboard/src/pages/onboarding/BusinessTypeSelection.tsx`

**Design:**
- Modal or full page (prefer modal for cleaner UX)
- Warm white background `#FEFCF9`
- Subtle border `1px solid rgba(55, 53, 47, 0.09)`
- 8px radius
- Layered shadow for elevation

**Content:**
- Title: "What type of business are you?"
- Three radio options:
  - ○ I create and sell experiences (Supplier)
    - [?] icon with hover tooltip: "Tour operators, activity providers, guides"
  - ○ I'm a hotel or accommodation (Hotel)
    - [?] icon with hover tooltip: "Hotels, resorts, B&Bs that want to sell experiences"
  - ○ I do both (Hybrid)
    - [?] icon with hover tooltip: "Hotels that also create their own experiences"
- Continue button (Traverum teal, 28px height)
- Cancel button (muted colors, 28px height)

**Implementation:**
- Use radio buttons with visual selection
- Muted colors for options
- Hover tooltips on "?" icons
- Form validation (must select one)
- Navigate to business details on continue

**Step 2: Business Details Form**

**File:** `apps/dashboard/src/pages/onboarding/BusinessDetails.tsx`

**Design:**
- Same modal/page styling
- Borderless inputs (32px height, 3px radius)
- Background: `rgba(242, 241, 238, 0.6)`
- Inset focus shadow
- Minimal labels, "?" tooltips for explanations

**Fields by Business Type:**

**For All Types:**
- Business/Organization Name* (required - visual indicator)
- Email (pre-filled from account, read-only)
- City (optional - subtle label)
- Country (optional - subtle label)

**For Suppliers:**
- Business Type (Individual, Company, etc.) - dropdown
- Tax ID (optional - can add later)

**For Hotels:**
- Hotel Name* (required)
- Hotel Slug* (for widget URL, auto-generated from name, editable)
- Display Name* (how it appears in widget)

**For Hybrid:**
- All of the above (combined form)

**Implementation:**
- Dynamic form based on selected business type
- Pre-fill email from user account
- Auto-generate slug from hotel name (with manual override)
- Validation (required fields marked with *)
- "?" tooltips for field explanations
- Back button to return to type selection
- Submit button (Traverum teal, 28px height)

**Step 3: Organization Creation & Redirect**

**File:** `apps/dashboard/src/hooks/useCreateOrganization.ts` (new hook)

**Functionality:**
- Create organization record in database
- Create user_organization relationship
- For Suppliers: Set `partner_type = 'supplier'`
- For Hotels: Create `hotel_config` record
- For Hybrid: Create both supplier and hotel_config
- Set as active organization
- Update `last_accessed_at` timestamp

**Redirect Logic:**
- **Suppliers:** `/supplier/dashboard` (empty state: "Create your first experience")
- **Hotels:** `/hotel/selection` (empty state: "Select experiences to showcase")
- **Hybrid:** `/supplier/dashboard` (content creation prioritized, both sections visible)

**Database Operations:**
```typescript
// Pseudo-code structure
async function createOrganization(data: {
  name: string;
  email: string;
  city?: string;
  country?: string;
  businessType: 'supplier' | 'hotel' | 'hybrid';
  // Additional fields based on type
}) {
  // 1. Create organization
  // 2. Create user_organization relationship
  // 3. If hotel/hybrid: Create hotel_config
  // 4. Set as active partner
  // 5. Return organization ID
}
```

---

## Phase 5: Routing Updates

### New Routes

**File:** `apps/dashboard/src/App.tsx`

**Add Routes:**
```typescript
<Route 
  path="/onboarding/add-business" 
  element={
    <ProtectedRoute>
      <AddBusinessFlow />
    </ProtectedRoute>
  } 
/>
```

**Update Routes:**
- Ensure `/dashboard` handles empty state
- Ensure redirects work correctly after organization creation

---

## Phase 6: Email Verification Handling

### Current State
- Signup sends email verification
- No explicit handling of verification state

### Required Changes

**File:** `apps/dashboard/src/pages/EmailVerification.tsx` (new)

**Functionality:**
- Check if user email is verified
- Show verification prompt if not verified
- Resend verification email option
- Redirect to dashboard after verification

**Design:**
- Warm white background
- Minimal text
- Visual indicator (icon)
- "Resend email" button
- "Check your email" message

**Integration:**
- Check verification status in `useAuth` hook
- Redirect to verification page if needed
- Update auth state after verification

---

## Phase 7: Styling & Design System

### Global Styles

**File:** `apps/dashboard/src/index.css` or Tailwind config

**Ensure:**
1. Warm white background `#FEFCF9` is default
2. Poppins font is loaded and set as default
3. Color system variables are defined:
   - Primary: `#0D9488`
   - Success: `#6B8E6B`
   - Warning: `#C9A961`
   - Error: `#B8866B`
   - Info: `#7A9CC6`
   - Border: `rgba(55, 53, 47, 0.09)`
4. Spacing system (8px grid)
5. Border radius system (3px, 4px, 8px, 14px)
6. Transition timings (20ms, 150ms, 300ms)

### Component Updates

**Update existing UI components to match design system:**
- Button component (28px height, 3px radius, proper padding)
- Input component (borderless, 32px height, inset shadow)
- Card component (warm white, subtle border)
- Modal component (8px radius, proper shadows)

---

## Implementation Checklist

### Phase 1: Landing Page
- [ ] Update Index.tsx with warm white background
- [ ] Update button styling to match design system
- [ ] Add minimal value proposition
- [ ] Ensure Poppins font is loaded
- [ ] Add 20ms transitions

### Phase 2: Authentication
- [ ] Update useAuth hook with magic link method
- [ ] Update useAuth hook with Google OAuth method
- [ ] Update useAuth hook with password reset method
- [ ] Remove company name from signup
- [ ] Add magic link option to Auth.tsx
- [ ] Add Google OAuth buttons
- [ ] Add forgot password link
- [ ] Add terms acceptance checkbox
- [ ] Update Auth.tsx styling to match design system
- [ ] Test email verification flow
- [ ] Test password reset flow

### Phase 3: Empty Canvas
- [ ] Update Dashboard.tsx to handle no organizations
- [ ] Create EmptyCanvas component
- [ ] Update useActivePartner to handle empty state
- [ ] Test empty state display

### Phase 4: Account Setup
- [ ] Create BusinessTypeSelection component
- [ ] Create BusinessDetails component
- [ ] Create useCreateOrganization hook
- [ ] Implement organization creation logic
- [ ] Add routing for onboarding flow
- [ ] Test supplier creation flow
- [ ] Test hotel creation flow
- [ ] Test hybrid creation flow

### Phase 5: Routing
- [ ] Add onboarding routes to App.tsx
- [ ] Update redirect logic
- [ ] Test navigation flow

### Phase 6: Email Verification
- [ ] Create EmailVerification component
- [ ] Add verification check to useAuth
- [ ] Add resend email functionality
- [ ] Test verification flow

### Phase 7: Styling
- [ ] Update global styles
- [ ] Update Button component
- [ ] Update Input component
- [ ] Update Card component
- [ ] Update Modal component
- [ ] Verify all components match design system

---

## Technical Considerations

### Supabase Configuration

**Required Settings:**
1. **Email Templates:**
   - Magic link email template
   - Password reset email template
   - Email verification template

2. **OAuth Providers:**
   - Google OAuth configured
   - Redirect URLs set correctly

3. **Database:**
   - Ensure `organizations` table supports new fields
   - Ensure `user_organizations` supports multiple relationships
   - Update triggers if needed (don't auto-create organization)

### Error Handling

**Scenarios to Handle:**
- Invalid email format
- Weak password
- Email already registered
- Magic link expired
- OAuth cancellation
- Network errors
- Database errors during organization creation

**User Feedback:**
- Use toast notifications (muted colors)
- Inline validation errors (minimal, visual)
- Loading states (subtle, not intrusive)

### Accessibility

**Requirements:**
- Keyboard navigation
- Screen reader support
- Focus indicators (inset shadow)
- ARIA labels where needed
- Proper form labels

---

## Testing Plan

### Unit Tests
- [ ] Auth hook methods
- [ ] Organization creation logic
- [ ] Form validation
- [ ] Routing logic

### Integration Tests
- [ ] Complete signup flow
- [ ] Complete login flow
- [ ] Magic link flow
- [ ] Google OAuth flow
- [ ] Password reset flow
- [ ] Business creation flow (all types)

### E2E Tests
- [ ] New user signup → add business → dashboard
- [ ] Existing user login → dashboard
- [ ] Multi-business user flow

---

## Migration Notes

### For Existing Users

**Backward Compatibility:**
- Existing users with organizations should see their dashboard normally
- No breaking changes to current functionality
- Existing organizations remain accessible

**New Features:**
- Existing users can add new organizations via account dropdown
- Empty canvas only shows for users with zero organizations

---

## Success Criteria

✅ **Login:**
- Clean, minimal authentication page
- Magic link option works
- Google OAuth works
- Password reset works
- Email verification handled

✅ **Account Setup:**
- Empty canvas shows for new users
- Business type selection is clear
- Business details form is intuitive
- Organization creation succeeds
- Redirect to appropriate dashboard

✅ **Design:**
- All components match design system
- Warm white background throughout
- Muted color palette
- Minimal text, visual indicators
- 8px grid spacing
- 20ms transitions

✅ **User Experience:**
- No overwhelming information
- Progressive disclosure
- Clear next steps
- Visual feedback
- Smooth transitions

---

## Next Steps After Implementation

1. **User Testing:** Get feedback on login and onboarding flow
2. **Analytics:** Track completion rates at each step
3. **Iteration:** Refine based on user behavior
4. **Documentation:** Update user guides if needed

---

**Version:** 1.0  
**Created:** 2025-01-24  
**Status:** Planning Phase
