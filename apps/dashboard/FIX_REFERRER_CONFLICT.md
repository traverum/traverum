# Fix: RefererNotAllowedMapError (Even with correct pattern)

## Issue
You have both patterns:
- `http://localhost:5173/` (without wildcard)
- `http://localhost:5173/*` (with wildcard)

The one without wildcard might be causing conflicts.

## Solution

### Step 1: Remove the conflicting entry
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your API key
3. Under "Website restrictions", **DELETE** this entry:
   - ❌ `http://localhost:5173/` (the one WITHOUT the `/*`)

### Step 2: Keep only the wildcard pattern
Make sure you have ONLY:
- ✅ `http://localhost:5173/*` (with wildcard)
- ✅ `https://traverum.com/*`

### Step 3: Save and wait
1. Click **"Save"**
2. Wait **2-3 minutes** (Google needs time to propagate changes)
3. **Clear browser cache** or use **Incognito/Private mode**
4. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)

### Step 4: Verify
After refreshing, the error should be gone. Check console:
- Should see: `✅ LocationAutocomplete: Autocomplete initialized successfully`
- Should NOT see: `RefererNotAllowedMapError`

## Why this happens
Google Maps might be matching the more specific pattern (`http://localhost:5173/`) first, which only matches the root path, not subpaths like `/supplier/experiences/...`.

## Alternative: Test without restrictions
If it still doesn't work:
1. Temporarily set "Application restrictions" to **"None"**
2. Test if autocomplete works
3. If it works, re-enable restrictions with only `http://localhost:5173/*`
4. This confirms it's a referrer restriction issue
