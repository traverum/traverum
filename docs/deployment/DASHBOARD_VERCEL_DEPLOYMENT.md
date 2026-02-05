# Dashboard Vercel Deployment Guide

This guide helps you deploy the Traverum dashboard (Vite + React) to Vercel.

## Prerequisites

- A Vercel account
- A Supabase project
- (Optional) Google Maps API key for location features

## Step 1: Configure Vercel Project Settings

1. Go to your Vercel project dashboard
2. Navigate to **Settings → General**
3. Set **Root Directory** to: `.` (repo root) or leave empty
4. **Framework Preset**: Vite (or Other)
5. The `vercel.json` is already configured with:
   - `installCommand: "pnpm install"`
   - `buildCommand: "pnpm --filter @traverum/dashboard build"`
   - `outputDirectory: "apps/dashboard/dist"`

## Step 2: Configure Environment Variables

In Vercel project → **Settings → Environment Variables**, add:

### Required Variables

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

### Optional Variables

```bash
# Google Maps API (for location autocomplete features)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Where to Get Supabase Values

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Project Settings** → **API**
4. Copy:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon/public key** → Use for `VITE_SUPABASE_PUBLISHABLE_KEY`

### Important Notes

- ⚠️ **Vite environment variables MUST be prefixed with `VITE_`**
- ⚠️ **These are embedded at BUILD TIME** - you must redeploy after adding/changing them
- Set variables for **Production** environment (and Preview if needed)
- Variable names are **case-sensitive**

## Step 3: Deploy

1. After adding environment variables, trigger a new deployment
2. Vercel will:
   - Install dependencies using pnpm
   - Build the dashboard app
   - Deploy to your domain

## Step 4: Verify Deployment

1. Visit your deployed URL
2. Open browser DevTools (F12) → Console
3. Check for errors:
   - ❌ `supabaseUrl is required` → Missing `VITE_SUPABASE_URL`
   - ❌ `supabaseKey is required` → Missing `VITE_SUPABASE_PUBLISHABLE_KEY`
   - ✅ No errors → Deployment successful!

## Troubleshooting

### White Screen / "supabaseUrl is required" Error

**Cause**: Missing or incorrectly named environment variables

**Solution**:
1. Verify variables are set in Vercel → Settings → Environment Variables
2. Check variable names are exactly:
   - `VITE_SUPABASE_URL` (not `NEXT_PUBLIC_SUPABASE_URL`)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (not `VITE_SUPABASE_ANON_KEY`)
3. Ensure variables are set for **Production** environment
4. **Redeploy** after adding/changing variables (Vite embeds env vars at build time)

### Build Fails

**Check**:
1. Build logs in Vercel dashboard
2. Ensure pnpm is being used (check `packageManager` in root `package.json`)
3. Verify `pnpm-lock.yaml` is committed to git

### Environment Variables Not Loading

**Remember**:
- Vite only embeds `VITE_*` variables at build time
- You MUST redeploy after adding/changing environment variables
- Variables are case-sensitive
- Check variable names match exactly what the code expects

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ Yes | Your Supabase anon/public key |
| `VITE_GOOGLE_MAPS_API_KEY` | ⚠️ Optional | For location autocomplete features |

## Next Steps

After successful deployment:
- [ ] Test authentication flow
- [ ] Verify Supabase connection works
- [ ] Test location features (if using Google Maps)
- [ ] Configure custom domain (if needed)
