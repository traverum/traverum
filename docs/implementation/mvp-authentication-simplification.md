# MVP Authentication Simplification

## Overview

For the MVP phase, signup/registration functionality has been disabled. Account creation is handled manually by the team. Only simple email + password login is available to users.

**Date Implemented:** 2025-01-24  
**Status:** Active for MVP

---

## Changes Made

### 1. Authentication Page Simplification

**File:** `apps/dashboard/src/pages/Auth.tsx`

**Removed:**
- Signup mode (`mode === 'signup'`)
- Magic link login option
- Google OAuth login option
- Mode switching between login/signup
- Terms acceptance checkbox
- Signup form and validation
- `signupSchema` validation
- "Don't have an account? Create one" link

**Kept:**
- Simple email + password login form
- Password reset functionality (forgot password link)
- Error handling for invalid credentials

**Current State:**
- Shows login form directly (no method selection screen)
- Only accepts email + password
- Redirects to dashboard on successful login

---

### 2. Landing Page Update

**File:** `apps/dashboard/src/pages/Index.tsx`

**Removed:**
- "Get Started" button that navigated to `/auth?mode=signup`

**Kept:**
- "Log In" button that navigates to `/auth`

**Current State:**
- Single CTA: "Log In" button
- No signup option visible

---

### 3. Organization Dropdown Update

**File:** `apps/dashboard/src/components/layout/OrganizationDropdown.tsx`

**Removed:**
- "Add organization" menu item
- `handleAddOrganization` function
- Navigation to `/onboarding/add-business`
- "Add hotel property" menu item
- `handleAddHotelProperty` function
- `AddHotelProperty` component import and usage
- `showAddHotelProperty` state

**Kept:**
- Organization switcher (if multiple organizations exist)
- View switcher (for hybrid organizations)
- Sign out option

**Current State:**
- Users cannot add new organizations via UI
- Users cannot add new hotel properties via UI
- Organization and hotel property creation must be done manually

---

### 4. useAuth Hook Comment

**File:** `apps/dashboard/src/hooks/useAuth.tsx`

**Added:**
- Comment on `signUp` function indicating it's disabled for MVP
- Function remains in codebase for future use

**Note:** All signup-related functions (`signUp`, `signInWithMagicLink`, `signInWithGoogle`) remain in the hook but are not called from the Auth component.

---

## Routes Status

**File:** `apps/dashboard/src/App.tsx`

**Status:** The `/onboarding/add-business` route remains in the routing configuration but is not accessible via UI navigation. This allows:
- Manual access if needed for testing
- Easy re-enablement later
- Backend/admin access if needed

---

## How to Re-enable Signup (Future)

### Step 1: Restore Auth Page

1. **Restore method selection screen:**
   - Add back `loginMethod` state
   - Show options: password, magic link, Google OAuth
   - Add back mode switching UI

2. **Restore signup mode:**
   - Add back `mode` state with 'login' | 'signup'
   - Restore signup form with terms checkbox
   - Add back "Don't have an account? Create one" link

3. **Restore validation:**
   - Add back `signupSchema` validation
   - Restore signup form validation logic

4. **Restore handlers:**
   - Add back `handleMagicLink` function
   - Add back `handleGoogleAuth` function
   - Restore signup logic in `handlePasswordAuth`

**Reference:** 
- Current simplified version: `apps/dashboard/src/pages/Auth.tsx` (login only)
- For full signup implementation, see: `docs/implementation/login-account-setup-plan.md`
- Original implementation included signup mode, magic link, and Google OAuth

### Step 2: Restore Landing Page

1. **Add back "Get Started" button:**
   ```tsx
   <Button onClick={() => navigate('/auth?mode=signup')}>
     Get Started
   </Button>
   ```

2. **Update layout:**
   - Restore two-button layout (Get Started + Log In)

**Reference:** 
- Current simplified version: `apps/dashboard/src/pages/Index.tsx` (single Log In button)
- Original had both "Get Started" and "Log In" buttons

### Step 3: Restore Add Organization

1. **Add back handler:**
   ```tsx
   const handleAddOrganization = () => {
     navigate('/onboarding/add-business');
   };
   ```

2. **Add back menu item:**
   ```tsx
   <DropdownMenuItem
     onClick={handleAddOrganization}
     className="cursor-pointer px-2 py-1.5"
   >
     Add organization
   </DropdownMenuItem>
   ```

**Reference:** 
- Current simplified version: `apps/dashboard/src/components/layout/OrganizationDropdown.tsx` (no Add organization option)
- Original included "Add organization" menu item that navigated to `/onboarding/add-business`

### Step 4: Restore Add Hotel Property

1. **Add back imports:**
   ```tsx
   import { AddHotelProperty } from '@/components/AddHotelProperty';
   import { useState } from 'react';
   ```

2. **Add back state:**
   ```tsx
   const [showAddHotelProperty, setShowAddHotelProperty] = useState(false);
   ```

3. **Add back handler:**
   ```tsx
   const handleAddHotelProperty = () => {
     setShowAddHotelProperty(true);
   };
   ```

4. **Add back menu item (inside hotel capability check):**
   ```tsx
   {capabilities.isHotel && (
     <>
       <DropdownMenuItem
         onClick={handleAddHotelProperty}
         className="cursor-pointer px-2 py-1.5"
       >
         Add hotel property
       </DropdownMenuItem>
       <DropdownMenuSeparator />
     </>
   )}
   ```

5. **Add back component usage:**
   ```tsx
   <AddHotelProperty open={showAddHotelProperty} onOpenChange={setShowAddHotelProperty} />
   ```

**Reference:** 
- Current simplified version: `apps/dashboard/src/components/layout/OrganizationDropdown.tsx` (no Add hotel property option)
- Original included "Add hotel property" menu item that opened the `AddHotelProperty` dialog

### Step 5: Remove MVP Comments

1. Remove comment from `useAuth.tsx` signUp function
2. Update any documentation referencing MVP limitations

---

## Files Modified

1. `apps/dashboard/src/pages/Auth.tsx` - Simplified to login only
2. `apps/dashboard/src/pages/Index.tsx` - Removed "Get Started" button
3. `apps/dashboard/src/components/layout/OrganizationDropdown.tsx` - Removed "Add organization" option
4. `apps/dashboard/src/hooks/useAuth.tsx` - Added MVP comment

---

## Testing Checklist (When Re-enabling)

- [ ] Signup form appears and works
- [ ] Magic link option works
- [ ] Google OAuth option works
- [ ] Terms acceptance checkbox works
- [ ] "Get Started" button appears on landing page
- [ ] "Add organization" button appears in dropdown
- [ ] "Add hotel property" button appears in dropdown (for hotel organizations)
- [ ] Email verification flow works
- [ ] New users can create accounts
- [ ] New users can create organizations
- [ ] Existing login functionality still works

---

## Notes

- All signup-related code remains in the codebase but is not accessible via UI
- The `/onboarding/add-business` route exists but has no UI access
- Account creation during MVP is done manually through Supabase admin or backend
- Hotel property creation during MVP is done manually through Supabase admin or backend
- The `AddHotelProperty` component remains in the codebase but is not accessible via UI
- This simplification makes it easy to re-enable signup and hotel property creation later when needed

---

## Related Documentation

- `docs/implementation/login-account-setup-plan.md` - Original implementation plan (includes signup flow)
- `docs/flows/dashboard-onboarding-flow.md` - Onboarding flow documentation
