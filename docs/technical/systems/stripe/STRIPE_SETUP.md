# Stripe Payment System Setup Guide

This guide walks you through setting up Stripe for your Traverum hotel booking platform.

## Prerequisites

- A Stripe account ([sign up here](https://dashboard.stripe.com/register))
- Your application deployed (or local development environment)
- Access to your environment variables configuration

## Step 1: Get Your Stripe API Keys

### For Test Mode (Development)

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in the top right)
3. Navigate to **Developers** → **API keys** (or visit [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys))
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Click "Reveal" to see it

### For Live Mode (Production)

1. Switch to **Live mode** in the Dashboard (toggle in top right)
2. Navigate to **Developers** → **API keys** (or visit [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys))
3. Copy your **Publishable key** (`pk_live_...`) and **Secret key** (`sk_live_...`)

⚠️ **Important**: Never commit API keys to version control. Always use environment variables.

## Step 2: Configure Environment Variables

Add these environment variables to your application:

### Required Variables

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here  # Use sk_live_ for production
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here  # Use pk_live_ for production

# Stripe Webhook Secret (see Step 3)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Where to Set These

- **Local Development**: Create a `.env.local` file in your project root
- **Vercel**: Go to Project Settings → Environment Variables
- **Other Platforms**: Follow your hosting provider's documentation

## Step 3: Set Up Webhooks

Webhooks allow Stripe to notify your application about payment events (successful payments, failures, refunds, etc.).

### Option A: Local Development (Using Stripe CLI)

1. **Install Stripe CLI**:
   - **macOS**: `brew install stripe/stripe-cli/stripe`
   - **Windows**: Download from [Stripe CLI releases](https://github.com/stripe/stripe-cli/releases)
   - **Linux**: See [Stripe CLI installation guide](https://docs.stripe.com/stripe-cli)

2. **Log in to Stripe CLI**:
   ```bash
   stripe login
   ```
   This opens your browser to authorize the CLI.

3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Replace `3000` with your local port if different.

4. **Get the webhook signing secret**:
   The CLI will display a webhook signing secret (starts with `whsec_`). Copy this and add it to your `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. **Test webhooks locally**:
   ```bash
   stripe trigger payment_intent.succeeded
   ```

### Option B: Production Webhook Setup

1. **Deploy your application** first (your webhook endpoint must be publicly accessible)

2. **Create webhook endpoint in Stripe Dashboard**:
   - Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) (or use [Workbench](https://dashboard.stripe.com/workbench/webhooks))
   - Click **Add endpoint** (or **Add destination** in Workbench)
   - Enter your endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
   - Select the events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `checkout.session.completed`
     - `charge.refunded`
     - `account.updated` (if using Connect)
     - `transfer.created` (if using Connect)
   - Click **Add endpoint**

3. **Get the webhook signing secret**:
   - After creating the endpoint, click on it to view details
   - Click **Reveal** next to "Signing secret"
   - Copy the secret (starts with `whsec_`)
   - Add it to your production environment variables

4. **Verify webhook is working**:
   - In the webhook endpoint details, you can send a test event
   - Check your application logs to confirm events are being received

## Step 4: Verify Your Integration

Your application already has the following Stripe features implemented:

### ✅ Payment Links
- Creates payment links for reservations
- Located in: `src/lib/stripe.ts` → `createPaymentLink()`

### ✅ Webhook Handler
- Processes payment events
- Located in: `src/app/api/webhooks/stripe/route.ts`
- Handles:
  - Payment success
  - Payment failures
  - Refunds
  - Account updates (Connect)
  - Transfers (Connect)

### ✅ Refunds
- Function: `createRefund()` in `src/lib/stripe.ts`

### ✅ Transfers (Stripe Connect)
- Function: `createTransfer()` in `src/lib/stripe.ts`
- Used for sending funds to connected accounts (suppliers)

## Step 5: Test Your Setup

### Test Payment Flow

1. **Create a test payment**:
   - Use Stripe's test card numbers:
     - Success: `4242 4242 4242 4242`
     - Decline: `4000 0000 0000 0002`
   - Use any future expiry date (e.g., `12/34`)
   - Use any 3-digit CVC

2. **Monitor webhook events**:
   - Check your application logs
   - View events in [Stripe Dashboard → Events](https://dashboard.stripe.com/test/events)

3. **Verify webhook signature**:
   - Your code already verifies webhook signatures in `verifyWebhookSignature()`
   - This ensures events are actually from Stripe

## Step 6: Go Live Checklist

Before switching to live mode:

- [ ] Complete Stripe account verification (business details, bank account)
- [ ] Switch API keys to live mode (`sk_live_` and `pk_live_`)
- [ ] Create production webhook endpoint
- [ ] Update all environment variables in production
- [ ] Test with a small real payment
- [ ] Set up monitoring/alerting for webhook failures
- [ ] Review [Stripe's go-live checklist](https://docs.stripe.com/get-started/checklist/go-live)

## Step 7: Stripe Connect Setup (If Using)

Your application uses Stripe Connect for transfers to suppliers. Additional setup:

1. **Enable Stripe Connect**:
   - Go to [Stripe Dashboard → Connect](https://dashboard.stripe.com/connect)
   - Complete Connect onboarding

2. **Create Connected Accounts**:
   - Use the Stripe API to create connected accounts for suppliers
   - Or use Stripe-hosted onboarding links

3. **Handle Account Updates**:
   - Your webhook already handles `account.updated` events
   - Monitor onboarding status in your database

## Additional Resources

- [Stripe API Documentation](https://docs.stripe.com/api)
- [Stripe Webhooks Guide](https://docs.stripe.com/webhooks)
- [Stripe Payment Links Documentation](https://docs.stripe.com/payment-links)
- [Stripe Connect Documentation](https://docs.stripe.com/connect)
- [Stripe Testing Guide](https://docs.stripe.com/testing)
- [Stripe CLI Documentation](https://docs.stripe.com/stripe-cli)

## Quick Reference: Local Development Setup

If you're testing locally and payments aren't creating bookings, follow these steps:

### 1. Start Stripe CLI Listener
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 2. Copy the Webhook Secret
The CLI will output something like:
```
> Ready! Your webhook signing secret is whsec_abc123xyz...
```

### 3. Update Your .env.local
```bash
STRIPE_WEBHOOK_SECRET=whsec_abc123xyz...  # Paste the actual secret from CLI
```

### 4. Restart Your Dev Server
```bash
npm run dev
```

### 5. Test a Payment
Make a test payment. The CLI should show:
```
2026-01-27 12:00:00   --> checkout.session.completed [evt_...]
2026-01-27 12:00:00  <--  [200] POST http://localhost:3000/api/webhooks/stripe
```

⚠️ **Common Mistake**: Using `whsec_your-webhook-secret` as a placeholder. This will cause all webhook signature verifications to fail, and no bookings will be created.

---

## Troubleshooting

### Webhook Not Receiving Events

1. **Check endpoint URL**: Must be HTTPS in production
2. **Verify signature**: Ensure `STRIPE_WEBHOOK_SECRET` is correct
3. **Check firewall**: Ensure Stripe IPs are allowed ([Stripe IP ranges](https://docs.stripe.com/ips))
4. **View webhook logs**: Check in Stripe Dashboard → Webhooks → Your endpoint → Recent events

### Payment Links Not Working

1. **Verify API keys**: Ensure correct keys for test/live mode
2. **Check API version**: Your code uses `2023-10-16` (in `src/lib/stripe.ts`)
3. **Review error logs**: Check Stripe Dashboard → Logs

### Connect Issues

1. **Verify account status**: Check `charges_enabled` and `payouts_enabled`
2. **Complete onboarding**: Ensure connected accounts complete KYC
3. **Check webhook events**: Monitor `account.updated` events

### Booking Not Created After Payment

If payment succeeds in Stripe but no booking record is created:

1. **Check webhook secret**: Ensure `STRIPE_WEBHOOK_SECRET` is not a placeholder value
2. **Verify Stripe CLI is running**: For local development, webhooks won't reach localhost without the CLI
3. **Check server logs**: Look for errors in the webhook handler
4. **Verify metadata**: Payment link must include `reservationId` in metadata
5. **Check database constraints**: Booking requires a valid `session_id` (sessions are now auto-created for request-based bookings)

## Security Best Practices

1. ✅ **Never expose secret keys** in client-side code
2. ✅ **Always verify webhook signatures** (already implemented)
3. ✅ **Use HTTPS** for all webhook endpoints
4. ✅ **Rotate API keys** periodically
5. ✅ **Monitor webhook failures** and set up alerts
6. ✅ **Use separate keys** for test and production

## Support

- [Stripe Support](https://support.stripe.com/)
- [Stripe Discord Community](https://discord.gg/stripe)
- [Stripe API Reference](https://docs.stripe.com/api)
