# Fix: RefererNotAllowedMapError

## Error Message
```
RefererNotAllowedMapError
Your site URL to be authorized: http://localhost:5173/supplier/experiences/...
```

## Solution

### Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/apis/credentials
2. Click on your API key (the one starting with `AIzaSy...`)

### Step 2: Update HTTP Referrer Restrictions
1. Scroll to **"Application restrictions"** section
2. Make sure **"HTTP referrers (web sites)"** is selected
3. Under **"Website restrictions"**, add these patterns (one per line):

```
http://localhost:5173/*
http://127.0.0.1:5173/*
```

**Important:** 
- Use `/*` at the end to match all paths
- Include the port number `:5173`
- Use `http://` (not `https://`) for localhost

### Step 3: Save and Wait
1. Click **"Save"** button
2. Wait **1-2 minutes** for changes to propagate
3. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)

### Step 4: Verify
After refreshing, check browser console:
- Should see: `✅ LocationAutocomplete: Places API available`
- Should NOT see: `RefererNotAllowedMapError`

## Why This Happens

Google Maps checks the **full URL** (including path) as the referrer:
- ❌ `http://localhost:5173` (doesn't match `/supplier/experiences/...`)
- ✅ `http://localhost:5173/*` (matches all paths)

The `/*` wildcard allows any path after the domain.

## For Production

When deploying, also add:
```
https://dashboard.traverum.com/*
https://*.traverum.com/*
```
