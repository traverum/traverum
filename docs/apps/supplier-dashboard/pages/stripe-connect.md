# Stripe Connect - Payment Setup

## 1. Purpose

Guides suppliers through connecting their Stripe account to receive payouts from bookings, handling the Stripe Connect onboarding process.

## 2. URL/Location

- **Route:** `/supplier/stripe-connect`
- **Component:** `apps/dashboard/src/pages/supplier/StripeConnect.tsx`
- **Layout:** Uses DashboardLayout

## 3. User Goals

- Connect Stripe account to receive payments
- Complete Stripe onboarding (business details, bank account)
- Understand payment setup status
- Verify account is ready to receive payouts
- Troubleshoot onboarding issues

## 4. Information Displayed

### Header Section
| Field | Type | Description |
|-------|------|-------------|
| Back Button | Action | Navigate to `/supplier/dashboard` |
| Page Title | Text | "Payment Setup" or "Stripe Connect" |
| Status Badge | Badge | Not Connected / In Progress / Connected |

### Status Overview Card

- Card styling: Warm white background `#FEFCF9`, subtle border `1px solid rgba(55, 53, 47, 0.09)`, 16px padding, 4px radius

**Current Status:**
- Status indicator (icon + text - visual first):
  - Not Connected (muted colors)
  - Onboarding In Progress (muted gold `#C9A961`)
  - Connected & Ready (muted sage green `#6B8E6B`)
  - Needs Attention (muted terracotta `#B8866B`)
- Status description (minimal text, or use hover tooltip)
- Next steps (if not complete - visual indicators preferred)

### Connection Status Details

**If Not Connected:**
- Message: "Connect your Stripe account to receive payments"
- Description: Explains Stripe Connect and why it's needed (or use "?" icon with hover tooltip)
- "Connect Stripe" button (Traverum teal `#0D9488`, 28px height, 3px radius)
- Information about:
  - What information is needed (visual list, minimal text)
  - How long it takes (visual indicator)
  - What happens after connection (or use hover tooltip)

**If Onboarding In Progress:**
- Message: "Complete your Stripe onboarding"
- Description: "Finish providing your business and bank details" (or use hover tooltip)
- "Continue Onboarding" button (Traverum teal `#0D9488`, 28px height, 3px radius)
- Progress indicator (if available from Stripe - visual, not text-heavy)
- List of remaining steps (visual checklist, minimal text)

**If Connected:**
- Success message: "Your Stripe account is connected"
- Account details:
  - Account type (Express/Standard/Custom)
  - Account status
  - Payouts enabled status
- "View Stripe Dashboard" link (external)
- "Update Account" button (if changes needed)

**If Needs Attention:**
- Warning message (muted terracotta `#B8866B`, not bright red)
- Issue description (e.g., "Bank account verification failed") - minimal text, or use hover tooltip
- Action required (visual indicator)
- "Resolve Issue" button (Traverum teal `#0D9488`, 28px height, 3px radius)

### Information Section

**What You'll Need:**
- Business information (name, type, address)
- Tax ID (EIN, VAT, etc.)
- Bank account details
- Identity verification (government ID)
- Estimated time: 10-15 minutes

**How It Works:**
- Traverum uses Stripe Connect
- Payments go to your Stripe account
- Automatic payouts to your bank
- Secure and compliant

### Troubleshooting Section (Future - MVP: Not included)

**Common Issues:**
- Bank account verification failed
- Identity verification pending
- Account limitations
- Solutions and support links

## 5. User Actions

| Action | Location | Result |
|--------|----------|--------|
| Click "Back" | Header | Navigate to `/supplier/dashboard` |
| Click "Connect Stripe" | Status card | Create Stripe account link, redirect to Stripe |
| Click "Continue Onboarding" | Status card | Redirect to Stripe onboarding |
| Click "Resolve Issue" | Status card | Redirect to Stripe to fix issue |
| Click "View Stripe Dashboard" | Connected state | Open Stripe dashboard in new tab |
| Click "Update Account" | Connected state | Redirect to Stripe account settings |
| Return from Stripe | Redirect URL | Check onboarding status, show success/error |

## 6. States

### Loading State
- Full-screen spinner
- Shown while:
  - Checking Stripe account status
  - Creating account link
  - Fetching account details

### Not Connected State
- Show connection prompt
- "Connect Stripe" button
- Information about process

### Onboarding In Progress State
- Show "Continue Onboarding" button
- Status: "In Progress"
- Link to Stripe onboarding

### Connected State
- Success message
- Account details
- "View Stripe Dashboard" link
- Status: "Connected & Ready"

### Needs Attention State
- Warning message
- Issue description
- "Resolve Issue" button
- Status: "Needs Attention"

### Error State
- Error message
- Retry button
- Support contact information

### Success State (After Return)
- Success toast: "Stripe account connected successfully"
- Update status display
- Show connected state

## 7. Business Rules

### Account Creation
- When user clicks "Connect Stripe":
  1. Check if `stripe_account_id` exists
  2. If not: Create Stripe Express account via API
  3. Store `stripe_account_id` in `partners` table
  4. Create account link for onboarding
  5. Redirect user to Stripe

### Account Status Check
- Check Stripe account status via API:
  - `charges_enabled`: Can accept payments
  - `payouts_enabled`: Can receive payouts
  - `details_submitted`: Onboarding complete
- Determine status:
  - **Not Connected:** No `stripe_account_id`
  - **In Progress:** `stripe_account_id` exists but `details_submitted = false`
  - **Connected:** All three flags = true
  - **Needs Attention:** Account exists but issues (e.g., `payouts_enabled = false`)

### Onboarding Completion
- Monitor via webhook: `account.updated`
- Update `stripe_onboarding_complete` when all flags true
- Show success message on return

### Account Link Creation
- Type: `account_onboarding`
- Refresh URL: `/supplier/stripe-connect?refresh=true`
- Return URL: `/supplier/dashboard?stripe=success`
- Expires after use or 1 hour

### Return Handling
- Check URL parameter: `?stripe=success`
- Verify account status
- Update `stripe_onboarding_complete` if needed
- Show success message

### Refresh Handling
- Check URL parameter: `?refresh=true`
- Create new account link
- Redirect to Stripe

### Account Type
- Default: Express account
- **Future:** Support Standard or Custom accounts
- **MVP:** Express only

### Payout Schedule
- Automatic daily payouts (Stripe default)
- Funds arrive 2-3 business days
- Displayed in information section

## 8. Edge Cases

### Account Creation Failure
- Show error: "Failed to create Stripe account. Please try again."
- Retry button
- Log error for support

### Onboarding Abandoned
- If user starts but doesn't complete: Show "Continue Onboarding"
- Link remains valid for 1 hour
- After expiry: Create new link

### Account Verification Failed
- Show "Needs Attention" state
- Describe issue (from Stripe)
- "Resolve Issue" button creates new link

### Bank Account Issues
- If bank account rejected: Show specific error
- "Update Bank Account" action
- Link to Stripe to fix

### Concurrent Account Creation
- If account created in another tab: Show "Account already exists"
- Refresh status
- Show connected state

### Network Error
- Show error toast
- Retry button
- Keep previous status if available

### Stripe API Error
- Show user-friendly error message
- Log technical details
- Provide support contact

### Account Already Connected
- If account already connected: Show connected state
- Don't show "Connect" button
- Show account details

### Invalid Return URL
- If return URL tampered with: Ignore parameters
- Show current status
- No error (security)

### Webhook Not Received
- If onboarding complete but webhook missed: Manual check on page load
- Update status if needed
- **Future:** Polling as backup

### Account Limitations
- If Stripe places limitations: Show warning
- "Your account has limitations. Contact Stripe support."
- Link to Stripe dashboard

### Multiple Accounts (Shouldn't Happen)
- If multiple accounts detected: Use most recent
- Log warning
- Show connected state

### Timeout on Redirect
- If Stripe redirect takes too long: Show loading
- After 30 seconds: Show "Taking longer than expected"
- Provide manual check option

### Country Restrictions
- If supplier country not supported: Show error
- "Stripe Connect not available in your country"
- Provide alternatives (Future)

### Tax ID Issues
- If tax ID invalid: Stripe will reject
- Show error from Stripe
- Allow retry with corrected information
