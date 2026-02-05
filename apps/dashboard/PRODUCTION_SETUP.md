# Production Setup for Location System

## Environment Variables

Make sure these are set in your production environment (Vercel/Deployment platform):

```bash
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## Google Cloud Console - HTTP Referrer Restrictions

For production, add these patterns to your API key's allowed referrers:

### Production URLs (add these):
```
https://dashboard.traverum.com/*
https://*.traverum.com/*
```

### Development URLs (keep these):
```
http://localhost:5173/*
http://127.0.0.1:5173/*
```

## Steps to Fix Production

1. **Add Production URL to Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click your API key
   - Under "Application restrictions" → "Website restrictions"
   - Add: `https://dashboard.traverum.com/*` (or your actual production domain)
   - Click "Save"
   - Wait 2-3 minutes for propagation

2. **Verify Environment Variable in Production:**
   - Check Vercel/your deployment platform
   - Ensure `VITE_GOOGLE_MAPS_API_KEY` is set
   - Redeploy if you just added it

3. **Test in Production:**
   - Open browser console (F12)
   - Look for: `✅ LocationAutocomplete: Places API available`
   - If you see `RefererNotAllowedMapError`, the production URL isn't in allowed referrers

## Debugging Production Issues

If autocomplete doesn't work in production, check browser console for:

1. **API Key Missing:**
   - Error: `VITE_GOOGLE_MAPS_API_KEY is not set`
   - Fix: Add environment variable in deployment platform

2. **Referrer Not Allowed:**
   - Error: `RefererNotAllowedMapError`
   - Fix: Add production URL to Google Cloud Console referrer restrictions

3. **Places API Not Enabled:**
   - Error: `Places API not available`
   - Fix: Enable Places API in Google Cloud Console

## Current Production Domain

Check what your actual production domain is and update the referrer restrictions accordingly.
