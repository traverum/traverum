# Google Maps API Key Setup - HTTP Referrer Restrictions

## Current Issue
The error "This page cannot load Google Maps correctly" means your API key's HTTP referrer restrictions are blocking the request.

## Solution

### Option 1: Add Correct Localhost Pattern (Recommended)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Under **"Application restrictions"** → **"Website restrictions"**
4. Make sure you have these patterns (one per line):
   ```
   http://localhost:5173/*
   http://127.0.0.1:5173/*
   https://traverum.com/*
   https://*.traverum.com/*
   ```
5. Click **"Save"**

### Option 2: Temporarily Remove Restrictions (For Testing Only)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Under **"Application restrictions"**
4. Select **"None"** (temporarily for testing)
5. Click **"Save"**
6. ⚠️ **Important**: Re-enable restrictions after testing!

### Option 3: Check Your Actual URL

Your dev server might be running on a different URL. Check:
- What URL shows in your browser? (e.g., `http://localhost:5173` or `http://127.0.0.1:5173`)
- Make sure that exact pattern is in the allowed referrers

## Common Patterns Needed

For local development:
- `http://localhost:5173/*`
- `http://127.0.0.1:5173/*`
- `http://localhost:*/*` (allows any port)
- `http://127.0.0.1:*/*` (allows any port)

For production:
- `https://traverum.com/*`
- `https://*.traverum.com/*`
- `https://dashboard.traverum.com/*`

## After Making Changes

1. Wait 1-2 minutes for changes to propagate
2. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear browser cache if needed
4. Try again

## Verify It's Working

After updating restrictions, check browser console:
- Should see: `✅ LocationAutocomplete: Places API available`
- Should NOT see: "This page cannot load Google Maps correctly"
