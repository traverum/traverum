# Vercel Deployment Guide

This guide will help you deploy the Traverum widget to Vercel with your custom domain.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- A custom domain (e.g., `widget.traverum.com` or `widget.yourdomain.com`)
- Domain DNS access to configure DNS records

## Step 1: Connect Your Repository to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository (GitHub, GitLab, or Bitbucket)
3. Vercel will auto-detect Next.js - verify the settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

## Step 2: Configure Environment Variables

In your Vercel project settings, go to **Settings → Environment Variables** and add all required variables:

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Resend Email Configuration
RESEND_API_KEY=re_your-resend-api-key
FROM_EMAIL=Traverum <bookings@yourdomain.com>

# App Configuration (IMPORTANT: Use your actual domain)
NEXT_PUBLIC_APP_URL=https://widget.yourdomain.com

# Security
TOKEN_SECRET=your-random-token-secret
CRON_SECRET=your-random-cron-secret

# Supabase Project Reference
SUPABASE_PROJECT_REF=your-project-ref
```

**Important**: 
- Set `NEXT_PUBLIC_APP_URL` to your actual domain (e.g., `https://widget.traverum.com`)
- Use production Stripe keys (`sk_live_` and `pk_live_`) for live deployments
- Generate secure random strings for `TOKEN_SECRET` and `CRON_SECRET`

### Environment Variable Scope

You can set variables for:
- **Production**: Live site
- **Preview**: Pull request previews
- **Development**: Local development (optional)

Set all variables for **Production** at minimum.

## Step 3: Add Your Custom Domain

1. In Vercel project settings, go to **Settings → Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `widget.traverum.com`)
4. Vercel will show you DNS records to add

### DNS Configuration

Add these DNS records to your domain provider:

**For apex domain (e.g., `traverum.com`):**
- Type: `A` record
- Name: `@` or `traverum.com`
- Value: `76.76.21.21` (Vercel's IP)

**For subdomain (e.g., `widget.traverum.com`):**
- Type: `CNAME` record
- Name: `widget`
- Value: `cname.vercel-dns.com`

**Alternative (recommended for subdomains):**
- Type: `CNAME` record  
- Name: `widget`
- Value: Your Vercel deployment URL (e.g., `your-project.vercel.app`)

### SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt. This usually takes a few minutes after DNS propagation.

## Step 4: Configure Stripe Webhook

After deployment, configure your Stripe webhook:

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Endpoint URL: `https://widget.yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the webhook signing secret
6. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
7. Redeploy if needed

## Step 5: Verify Deployment

1. Visit your domain: `https://widget.yourdomain.com`
2. Check the embed script: `https://widget.yourdomain.com/embed.js`
3. Test a hotel page: `https://widget.yourdomain.com/[hotel-slug]`
4. Verify environment variables are loaded (check browser console for errors)

## Step 6: Update Email Links

All email templates use `NEXT_PUBLIC_APP_URL` for links. After setting the environment variable and redeploying, all email links will point to your domain.

## Cron Jobs Configuration

The `vercel.json` file already includes cron job configurations:

- `expire-pending-reservations`: Every hour
- `expire-unpaid-reservations`: Every 15 minutes  
- `send-completion-checks`: Daily at 10:00
- `auto-complete-bookings`: Daily at 02:00

These will work automatically on Vercel. Ensure `CRON_SECRET` is set for security.

## Troubleshooting

### Domain Not Working

1. Check DNS propagation: Use [dnschecker.org](https://dnschecker.org)
2. Wait 24-48 hours for full propagation
3. Verify DNS records match Vercel's requirements
4. Check SSL certificate status in Vercel dashboard

### Environment Variables Not Loading

1. Ensure variables are set for the correct environment (Production)
2. Redeploy after adding new variables
3. Check variable names match exactly (case-sensitive)
4. Verify `NEXT_PUBLIC_*` variables are accessible in browser

### Build Failures

1. Check build logs in Vercel dashboard
2. Ensure all required environment variables are set
3. Verify `package.json` has correct dependencies
4. Check for TypeScript errors locally first

### Widget Not Loading

1. Verify `embed.js` is accessible: `https://widget.yourdomain.com/embed.js`
2. Check browser console for errors
3. Verify CORS headers are set correctly (already configured in `next.config.js`)
4. Test with a simple HTML page embedding the widget

## Post-Deployment Checklist

- [ ] Domain is accessible and SSL certificate is active
- [ ] Environment variables are set correctly
- [ ] `NEXT_PUBLIC_APP_URL` matches your domain
- [ ] Stripe webhook is configured and tested
- [ ] Email sending works (test with a booking request)
- [ ] Widget embed script loads correctly
- [ ] Cron jobs are running (check Vercel logs)
- [ ] All hotel pages are accessible
- [ ] Booking flow works end-to-end

## Support

For issues specific to:
- **Vercel**: Check [Vercel Documentation](https://vercel.com/docs)
- **Domain/DNS**: Contact your domain registrar
- **Traverum**: Check project documentation or contact support
