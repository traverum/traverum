# Vercel Deployment Checklist

Quick checklist for deploying the Traverum widget to Vercel.

## Pre-Deployment

- [ ] Repository is connected to Vercel
- [ ] All environment variables are ready (see below)
- [ ] Stripe webhook endpoint is ready
- [ ] Custom domain is configured (if applicable)

## Environment Variables Setup

Copy these into Vercel Project Settings > Environment Variables:

### Required
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (set after first deployment)
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `RESEND_API_KEY`

### Optional
- [ ] `TOKEN_SECRET` (defaults to SUPABASE_SERVICE_ROLE_KEY)
- [ ] `CRON_SECRET` (for securing cron endpoints)
- [ ] `FROM_EMAIL` (defaults to "Traverum <bookings@veyond.eu>")

## Deployment Steps

1. [ ] Push code to main branch (or connect via Vercel dashboard)
2. [ ] Verify build succeeds in Vercel dashboard
3. [ ] Test deployment URL: `https://your-project.vercel.app/[hotel-slug]`
4. [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
5. [ ] Redeploy to apply `NEXT_PUBLIC_APP_URL` change

## Post-Deployment

### Domain Setup
- [ ] Add custom domain in Vercel (if applicable)
- [ ] Configure DNS records
- [ ] Wait for SSL certificate provisioning
- [ ] Verify domain works

### Stripe Webhooks
- [ ] Add webhook endpoint in Stripe Dashboard
- [ ] URL: `https://your-domain.com/api/webhooks/stripe`
- [ ] Select required events
- [ ] Copy webhook signing secret
- [ ] Add as `STRIPE_WEBHOOK_SECRET` in Vercel
- [ ] Test webhook delivery

### Cron Jobs
- [ ] **If Vercel Pro/Enterprise**: Cron jobs auto-configured
- [ ] **If using external service**: Set up cron jobs (see deployment guide)
- [ ] Test cron endpoints manually first

## Verification Tests

- [ ] Homepage loads: `https://your-domain.com`
- [ ] Hotel page loads: `https://your-domain.com/[hotel-slug]`
- [ ] Experience page loads: `https://your-domain.com/[hotel-slug]/[experience-slug]`
- [ ] Embed script loads: `https://your-domain.com/embed.js`
- [ ] API endpoints respond: `https://your-domain.com/api/embed/[hotel-slug]`
- [ ] Checkout flow works
- [ ] Payment processing works
- [ ] Email sending works (test booking)

## Monitoring Setup

- [ ] Enable Vercel Analytics (optional)
- [ ] Set up error alerts
- [ ] Monitor Stripe webhook logs
- [ ] Monitor Supabase logs
- [ ] Check cron job execution

## Rollback Plan

If issues occur:
- [ ] Identify last working deployment
- [ ] Promote previous deployment to production
- [ ] Investigate issues in build logs
- [ ] Fix and redeploy

## Quick Commands

```bash
# Build locally to test
pnpm --filter @traverum/widget build

# Run production build locally
pnpm --filter @traverum/widget start

# Check environment variables
# (Verify all are set in Vercel dashboard)
```

## Support Resources

- [Full Deployment Guide](./vercel-widget-deployment.md)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
