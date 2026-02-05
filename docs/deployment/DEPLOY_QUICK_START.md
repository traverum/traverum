# Quick Start: Deploy to Vercel

## 🚀 Fast Deployment Steps

### 1. Push to Git
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### 2. Connect to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Vercel auto-detects Next.js ✅

### 3. Set Environment Variables
In Vercel project → Settings → Environment Variables, add:

**Critical:**
- `NEXT_PUBLIC_APP_URL` = `https://widget.yourdomain.com` (your actual domain)

**Required:**
- All variables from `env.example`

### 4. Add Domain
1. Settings → Domains → Add Domain
2. Enter: `widget.yourdomain.com`
3. Add DNS CNAME record pointing to Vercel
4. Wait for SSL (automatic, ~5 minutes)

### 5. Deploy!
Click "Deploy" - Vercel handles the rest.

---

## ✅ What's Already Configured

- ✅ Cron jobs (in `vercel.json`)
- ✅ Dynamic domain detection in `embed.js`
- ✅ CORS headers for widget embedding
- ✅ Next.js build configuration

## 📋 Full Guide

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.
