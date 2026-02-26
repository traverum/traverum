# Vercel Widget Deployment Guide

This guide covers deploying the Traverum widget (`apps/widget`) to Vercel.

## Prerequisites

- Vercel account
- GitHub/GitLab/Bitbucket repository connected to Vercel
- All environment variables configured (see below)

## Quick Setup

1. **Connect Repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel will auto-detect the Next.js app in `apps/widget`

2. **Configure Project Settings**
   - **Root Directory**: `apps/widget` (or use the `vercel.json` configuration)
   - **Framework Preset**: Next.js
   - **Build Command**: `pnpm --filter @traverum/widget build`
   - **Output Directory**: `.next` (default for Next.js)
   - **Install Command**: `pnpm install`

3. **Environment Variables**
   Add all required environment variables in Vercel's project settings:

## Required Environment Variables

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Application URL
```bash
NEXT_PUBLIC_APP_URL=https://book.traverum.com
# Or your Vercel deployment URL: https://your-project.vercel.app
```

### Stripe Configuration
```bash
STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe Dashboard > Webhooks
```

### Email Configuration (Resend)
```bash
RESEND_API_KEY=re_...
FROM_EMAIL=Traverum <bookings@veyond.eu> # Optional, has default
```

### Optional
```bash
TOKEN_SECRET=your-secret-key # Optional, falls back to SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET=your-cron-secret # Optional, for securing cron endpoints
RECAPTCHA_SECRET_KEY=your-recaptcha-v3-secret-key # Optional; if set, dashboard signup requires reCAPTCHA verification
```

**Note**: `CRON_SECRET` is optional. If set, cron endpoints will require `Authorization: Bearer <CRON_SECRET>` header. Vercel Cron automatically includes this header, but external cron services will need it.

## Deployment Steps

### First Deployment

1. **Push to Main Branch**
   ```bash
   git push origin main
   ```

2. **Vercel Auto-Deploy**
   - Vercel will automatically detect the push
   - Build will start automatically
   - First deployment may take 3-5 minutes

3. **Verify Deployment**
   - Check build logs in Vercel dashboard
   - Visit the deployment URL
   - Test a hotel page: `https://your-deployment.vercel.app/[hotel-slug]`

### Subsequent Deployments

- **Automatic**: Every push to `main` triggers a production deployment
- **Preview**: Every push to other branches creates a preview deployment
- **Manual**: Deploy from Vercel dashboard

## Post-Deployment Configuration

### 1. Update NEXT_PUBLIC_APP_URL

After first deployment, update `NEXT_PUBLIC_APP_URL` in Vercel:
- Go to Project Settings > Environment Variables
- Update `NEXT_PUBLIC_APP_URL` to your production domain
- Redeploy to apply changes

### 2. Configure Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your domain: `book.traverum.com`
3. Follow DNS configuration instructions
4. SSL certificate will be automatically provisioned

### 3. Set Up Stripe Webhooks

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - Other events as needed
4. Copy the webhook signing secret
5. Add as `STRIPE_WEBHOOK_SECRET` in Vercel

### 4. Configure Cron Jobs

The widget includes several cron jobs. **Note**: Vercel Hobby plans only support daily cron jobs. Hourly jobs must use external services.

#### Daily Cron Jobs (Configured in vercel.json)

These run automatically on Vercel (including Hobby plan):
- **Auto-complete** (`/api/cron/auto-complete`): Daily at 2 AM - Completes bookings 7+ days after experience
- **Completion Check** (`/api/cron/completion-check`): Daily at 9 AM - Sends completion check emails

#### Hourly Cron Jobs (Require External Service)

These must be set up using external cron services (Vercel Hobby doesn't support hourly):
- **Expire Unpaid** (`/api/cron/expire-unpaid`): Hourly - Expires unpaid reservations
- **Expire Pending** (`/api/cron/expire-pending`): Hourly - Expires pending bookings  
- **Expire Reservations** (`/api/cron/expire-reservations`): Hourly - Expires old reservations

**Recommended External Services:**
- [cron-job.org](https://cron-job.org) (free)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)

**Configuration for external services:**
- **URL**: `https://your-domain.com/api/cron/[job-name]`
- **Method**: POST
- **Headers**: `Authorization: Bearer <CRON_SECRET>` (if CRON_SECRET is set)
- **Schedule**: `0 * * * *` (every hour at minute 0)

**Example cron-job.org setup for hourly jobs:**
- URL: `https://book.traverum.com/api/cron/expire-unpaid`
- Schedule: `0 * * * *` (hourly)
- Method: POST
- Headers: `Authorization: Bearer your-cron-secret` (if CRON_SECRET is set)

**Alternative**: Upgrade to Vercel Pro to use hourly cron jobs natively.

## Build Configuration

The `vercel.json` in the root is configured for the widget:

```json
{
  "buildCommand": "pnpm --filter @traverum/widget build",
  "devCommand": "pnpm --filter @traverum/widget dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "rootDirectory": "apps/widget"
}
```

## Troubleshooting

### Build Fails

**Issue**: Build command fails
- **Solution**: Ensure `pnpm` is installed and workspace is configured correctly
- Check that `@traverum/shared` package exists and builds

**Issue**: Module not found errors
- **Solution**: Verify `transpilePackages` in `next.config.js` includes `@traverum/shared`
- Check that workspace dependencies are properly linked

### Environment Variables Not Working

**Issue**: `NEXT_PUBLIC_*` variables not available
- **Solution**: Ensure variables are set in Vercel dashboard
- Redeploy after adding new `NEXT_PUBLIC_*` variables
- Check variable names match exactly (case-sensitive)

### Supabase Connection Issues

**Issue**: Cannot connect to Supabase
- **Solution**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase project is active
- Verify RLS policies allow public access where needed

### Stripe Webhook Failures

**Issue**: Webhooks not receiving events
- **Solution**: Verify webhook URL is correct in Stripe dashboard
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe's signing secret
- Review webhook logs in Stripe dashboard

## Monorepo Considerations

Since this is a monorepo:
- Vercel will install dependencies from the root
- The build runs from `apps/widget` directory
- Shared packages (`@traverum/shared`) are automatically linked via pnpm workspaces
- Ensure `packages/shared` is included in the repository

## Performance Optimization

- **Edge Functions**: Consider moving API routes to Edge Functions for better performance
- **Image Optimization**: Next.js Image component is configured for Supabase images
- **Caching**: Headers are configured in `next.config.js` for optimal caching

## Security Checklist

- [ ] All environment variables are set (no defaults in production)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is kept secret (never exposed to client)
- [ ] `STRIPE_SECRET_KEY` is production key (not test key)
- [ ] Webhook secret is configured and verified
- [ ] CORS headers are properly configured
- [ ] RLS policies are enabled in Supabase

## Monitoring

After deployment, monitor:
- Vercel Analytics (if enabled)
- Error logs in Vercel dashboard
- Stripe webhook delivery logs
- Supabase logs for database queries

## Rollback

If deployment has issues:
1. Go to Vercel dashboard > Deployments
2. Find the previous working deployment
3. Click "..." menu > "Promote to Production"

## Support

For issues:
- Check Vercel build logs
- Review Next.js documentation
- Check Supabase status page
- Review Stripe webhook logs
