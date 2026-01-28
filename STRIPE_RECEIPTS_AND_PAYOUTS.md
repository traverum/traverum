# Stripe Receipts and Supplier Payouts Guide

This document explains how receipts work in the Traverum system and what suppliers need to do to receive their money.

---

## 📧 Receipts for Travelers (Customers)

### How Receipts Work

**Your system uses "Separate Charges and Transfers"** in Stripe Connect:
- The **platform** (Traverum) is the merchant of record
- Charges are created on the **platform account**
- Funds are later transferred to supplier connected accounts

### Automatic Receipts

Stripe **automatically sends receipts** to travelers when:
- ✅ Payment is successful
- ✅ Payment Links or Checkout Sessions are used (which you do)
- ✅ Receipt emails are enabled in Stripe Dashboard

**Receipt Configuration:**
- Receipts use the **platform's branding** (Traverum's settings)
- Receipts include the platform's business name and contact info
- Receipts are sent to the email address provided during checkout

### Receipt Content

Each receipt includes:
- ✅ Receipt number (unique identifier)
- ✅ Payment amount and currency
- ✅ Date and time of payment
- ✅ Payment method used
- ✅ Link to view receipt online (valid for 30 days)
- ✅ Business information (platform's details)

### Accessing Receipts

**For Travelers:**
1. **Automatic Email**: Stripe sends receipt automatically after payment
2. **Receipt URL**: Available in the Charge object (`receipt_url`)
3. **Dashboard**: Travelers can request receipts via Stripe's customer portal (if enabled)

**For Your Platform:**
- View receipts in Stripe Dashboard → Payments
- Access receipt URL via API: `charge.receipt_url`
- Resend receipts manually from Dashboard

### Current Implementation

**What your system does:**
- ✅ Creates Payment Links (which automatically send receipts)
- ✅ Sends custom confirmation emails via Resend
- ✅ Stripe handles receipt emails separately

**What your system doesn't do:**
- ❌ Custom receipt generation (Stripe handles this)
- ❌ Receipt storage in your database (not needed - Stripe manages this)

### Enabling/Disabling Receipts

**To configure receipt settings:**
1. Go to Stripe Dashboard → Settings → Customer emails
2. Toggle "Automatically email customers a receipt" ON/OFF
3. Configure receipt branding under Settings → Branding

**Note:** Receipts are enabled by default for Payment Links and Checkout Sessions.

---

## 💰 Receipts for Suppliers

### Do Suppliers Get Receipts?

**Short answer: No, suppliers don't receive receipts for customer payments.**

**Why?**
- Suppliers are **not the merchant of record** in your system
- The platform (Traverum) is the merchant
- Receipts go to the merchant (platform), not to connected accounts

### What Suppliers See Instead

**Suppliers receive:**
1. **Transfer Records** in their Stripe Dashboard
   - Shows amount transferred
   - Shows booking ID in metadata
   - Shows transfer date and status

2. **Payout Records** (after funds are paid out to their bank)
   - Shows payout amount
   - Shows payout date
   - Shows bank account destination

3. **Email Notifications** (from your system)
   - Transfer confirmation when booking is completed
   - Payout notifications (if configured)

### Supplier Dashboard Access

**If suppliers have Express or Standard accounts:**
- They can log into Stripe Dashboard
- View all transfers and payouts
- Download transaction reports
- See their account balance

**If suppliers have Custom accounts:**
- They can't access Stripe Dashboard
- You must build a custom dashboard for them
- Or provide transaction reports via email/API

---

## 🏦 Supplier Onboarding Process

### What Suppliers Must Do to Receive Money

Suppliers need to complete **Stripe Connect onboarding** before they can receive payouts.

### Step 1: Create Connected Account

**Your system does this automatically:**
- When a supplier signs up, create a Stripe Connect account
- Store the `stripe_account_id` in the `partners` table
- Account type: Express (recommended) or Custom

**For Express accounts:**
```javascript
// Your system creates this via API
const account = await stripe.accounts.create({
  type: 'express',
  country: 'US', // or supplier's country
  email: supplier.email,
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
})
```

### Step 2: Complete Onboarding

**Suppliers must provide:**
1. **Business Information**
   - Business name
   - Business type (individual, company, etc.)
   - Tax ID (EIN, VAT, etc.)
   - Business address

2. **Identity Verification**
   - Personal information (for business owners)
   - Government ID (passport, driver's license)
   - Proof of address
   - Bank account information

3. **Bank Account Details**
   - Account number
   - Routing number (US) or IBAN (international)
   - Account holder name
   - Bank name and address

### Step 3: Onboarding Flow

**Option A: Stripe Hosted Onboarding (Recommended)**
```javascript
// Create account link for supplier
const accountLink = await stripe.accountLinks.create({
  account: supplier.stripe_account_id,
  refresh_url: 'https://yourapp.com/onboarding/refresh',
  return_url: 'https://yourapp.com/onboarding/complete',
  type: 'account_onboarding',
})

// Send link to supplier via email
```

**Option B: Custom Onboarding**
- Build your own form
- Collect all required information
- Submit via Stripe API
- More complex but fully customizable

### Step 4: Monitor Onboarding Status

**Your system tracks this via webhook:**

```typescript
// Webhook: account.updated
// Check these fields:
- charges_enabled: true  // Can accept payments
- payouts_enabled: true  // Can receive payouts
- details_submitted: true // All info provided
```

**When all three are `true`, onboarding is complete.**

### Current Implementation

**Your system already:**
- ✅ Creates connected accounts (via `scripts/create-test-account.js`)
- ✅ Stores `stripe_account_id` in database
- ✅ Tracks `stripe_onboarding_complete` status
- ✅ Monitors `account.updated` webhook
- ✅ Blocks accepting bookings if onboarding incomplete

**What suppliers need to do:**
1. Click onboarding link (sent via email or dashboard)
2. Complete Stripe's hosted form
3. Provide all required information
4. Wait for verification (usually instant for test mode, 1-2 days for live)

---

## 💸 How Suppliers Get Paid

### The Payment Flow

1. **Customer Pays** → Platform receives payment
2. **Booking Completed** → System creates transfer to supplier's connected account
3. **Transfer Arrives** → Funds appear in supplier's Stripe balance
4. **Payout Scheduled** → Stripe automatically pays out to supplier's bank
5. **Funds Arrive** → Money appears in supplier's bank account (2-3 business days)

### Transfer Process

**When booking is completed:**
```typescript
// Your system does this in /api/bookings/[id]/complete
const transfer = await createTransfer(
  booking.supplier_amount_cents,  // 80% of total
  experience.currency,
  supplier.stripe_account_id,
  booking.id,
  chargeId  // Links transfer to original charge
)
```

**What happens:**
- ✅ Funds are transferred to supplier's connected account balance
- ✅ Transfer is linked to the original charge (via `source_transaction`)
- ✅ Supplier receives email notification (from your system)
- ✅ Transfer appears in supplier's Stripe Dashboard

### Payout Process

**Automatic Payouts (Default):**
- Stripe automatically pays out funds to supplier's bank account
- Payout schedule: Daily, weekly, or monthly (supplier chooses)
- Funds arrive 2-3 business days after payout

**Manual Payouts:**
- Supplier can request instant payout (if enabled)
- Or wait for scheduled payout
- Can be done via Stripe Dashboard or API

### Payout Timing

**Standard Payout Schedule:**
- **Daily**: Funds paid out every business day
- **Weekly**: Funds paid out on specific day (e.g., every Monday)
- **Monthly**: Funds paid out on specific date (e.g., 1st of month)
- **Manual**: Supplier initiates when ready

**Settlement Timing:**
- Funds from transfers are typically available immediately
- But payouts to bank accounts take 2-3 business days
- Instant payouts available (for a fee) if enabled

### Payout Fees

**Stripe Fees:**
- No fee for standard payouts
- Instant payouts: 1% fee (minimum $0.50)
- International payouts: May incur currency conversion fees

**Platform Fees:**
- Your commission (12% hotel, 8% platform) is deducted before transfer
- Suppliers receive their portion (80%) minus Stripe's processing fees

---

## 📋 Supplier Checklist

### To Receive Money, Suppliers Must:

1. **✅ Complete Stripe Onboarding**
   - Click onboarding link
   - Provide business information
   - Verify identity
   - Add bank account details

2. **✅ Wait for Verification**
   - Test mode: Usually instant
   - Live mode: 1-2 business days typically

3. **✅ Configure Payout Schedule** (Optional)
   - Choose daily, weekly, monthly, or manual
   - Set in Stripe Dashboard after onboarding

4. **✅ Wait for Booking Completion**
   - Experience must be marked as completed
   - Or auto-completed after 7 days

5. **✅ Receive Transfer**
   - Funds appear in Stripe balance
   - Email notification sent

6. **✅ Receive Payout**
   - Automatic payout to bank account
   - Funds arrive in 2-3 business days

### What Suppliers DON'T Need to Do

- ❌ Manually request transfers (automatic when booking completes)
- ❌ Handle customer receipts (platform handles this)
- ❌ Manage payment processing (platform handles this)
- ❌ Deal with refunds directly (platform handles this)

---

## 🔍 Monitoring and Troubleshooting

### Check Onboarding Status

**Via Database:**
```sql
SELECT 
  name,
  email,
  stripe_account_id,
  stripe_onboarding_complete
FROM partners
WHERE id = 'supplier-id';
```

**Via Stripe API:**
```javascript
const account = await stripe.accounts.retrieve(supplier.stripe_account_id);
console.log({
  charges_enabled: account.charges_enabled,
  payouts_enabled: account.payouts_enabled,
  details_submitted: account.details_submitted,
});
```

### Check Transfer Status

**Via Stripe Dashboard:**
- Go to Transfers → Find transfer by booking ID
- Check status: `paid`, `pending`, or `failed`

**Via API:**
```javascript
const transfer = await stripe.transfers.retrieve(transferId);
console.log(transfer.status);
```

### Check Payout Status

**Via Stripe Dashboard:**
- Go to Payouts → View all payouts
- Check status: `paid`, `pending`, `in_transit`, or `failed`

**Common Issues:**
- **Payout failed**: Bank account details incorrect → Supplier must update
- **Onboarding incomplete**: Missing information → Supplier must complete
- **Transfer failed**: Account not ready → Check onboarding status

---

## 📊 Summary

### Receipts

| Party | Receives Receipt? | How? |
|-------|------------------|------|
| **Traveler** | ✅ Yes | Automatic email from Stripe |
| **Supplier** | ❌ No | Receives transfer records instead |
| **Platform** | ✅ Yes | Can view in Stripe Dashboard |

### Money Flow

1. **Traveler pays** → Platform receives payment
2. **Booking completes** → Transfer to supplier's connected account
3. **Supplier's balance** → Funds appear in Stripe balance
4. **Payout to bank** → Automatic payout (2-3 business days)

### Supplier Requirements

1. ✅ Complete Stripe Connect onboarding
2. ✅ Provide bank account information
3. ✅ Wait for verification
4. ✅ That's it! Everything else is automatic

---

## 🔗 Resources

- [Stripe Receipts Documentation](https://docs.stripe.com/receipts)
- [Stripe Connect Onboarding](https://docs.stripe.com/connect/onboarding)
- [Stripe Payouts Guide](https://docs.stripe.com/payouts)
- [Stripe Connect Charges](https://docs.stripe.com/connect/charges)
- [Separate Charges and Transfers](https://docs.stripe.com/connect/separate-charges-and-transfers)

---

**Last Updated:** January 2025
