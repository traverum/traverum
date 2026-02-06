# Location Autocomplete Troubleshooting Checklist

## ✅ Step 1: Verify Environment Variable

1. **Check `.env` file exists in `apps/dashboard/`**
   ```bash
   cd apps/dashboard
   cat .env | grep VITE_GOOGLE_MAPS_API_KEY
   ```
   - Should show: `VITE_GOOGLE_MAPS_API_KEY=your_key_here`
   - ❌ If missing or wrong name, fix it

2. **Verify the variable is loaded in the app**
   - Open browser DevTools Console (F12)
   - Type: `console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)`
   - Should show your API key (not `undefined`)
   - ❌ If `undefined`, restart dev server

3. **Restart Dev Server**
   - Stop server (Ctrl+C)
   - Start again: `npm run dev`
   - ⚠️ Vite only loads `.env` on startup

---

## ✅ Step 2: Check Google Cloud Console Setup

1. **Verify API Key is Valid**
   - Go to: https://console.cloud.google.com/
   - Navigate to: APIs & Services → Credentials
   - Find your API key
   - Check it's not deleted/disabled

2. **Enable Required APIs**
   - Go to: APIs & Services → Library
   - Search and enable:
     - ✅ **Places API** (required for autocomplete)
     - ✅ **Geocoding API** (required for coordinates)
     - ✅ **Maps JavaScript API** (required for Places library)

3. **Check API Key Restrictions**
   - Go to: APIs & Services → Credentials → Your API Key
   - Under "API restrictions":
     - Should allow: Places API, Geocoding API, Maps JavaScript API
   - Under "Application restrictions":
     - If set to "HTTP referrers", ensure your domain is allowed
     - For local dev: Add `http://localhost:5173/*`
     - For production: Add your domain

---

## ✅ Step 3: Check Browser Console for Errors

1. **Open DevTools (F12)**
2. **Check Console tab for errors:**
   - ❌ `Google Maps API key is not configured` → Env variable issue
   - ❌ `Failed to load Google Maps API` → Network/API key issue
   - ❌ `This API key is not authorized` → API restrictions issue
   - ❌ `RefererNotAllowedMapError` → HTTP referrer restriction
   - ❌ `ApiNotActivatedMapError` → API not enabled in console

3. **Check Network tab:**
   - Look for request to: `maps.googleapis.com/maps/api/js`
   - Status should be `200 OK`
   - ❌ If `403` → API key/auth issue
   - ❌ If `404` → Wrong URL/API not enabled

---

## ✅ Step 4: Verify Component Loading

1. **Check if Google Maps script loads:**
   - Open DevTools → Network tab
   - Filter: `maps.googleapis.com`
   - Reload page
   - Should see: `maps/api/js?key=...&libraries=places`
   - Status should be `200`

2. **Check if Autocomplete initializes:**
   - Open DevTools → Console
   - Type in location field
   - Should see no errors
   - If you see: `google is not defined` → Script didn't load

3. **Test in Console:**
   ```javascript
   // Check if Google Maps is loaded
   console.log(window.google);
   // Should show object, not undefined
   
   // Check if Places is available
   console.log(window.google?.maps?.places);
   // Should show object, not undefined
   ```

---

## ✅ Step 5: Test API Key Directly

1. **Test Places API with curl:**
   ```bash
   curl "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=paris&key=YOUR_API_KEY"
   ```
   - Replace `YOUR_API_KEY` with your actual key
   - Should return JSON with predictions
   - ❌ If error, API key or API not enabled

2. **Test in browser:**
   ```
   https://maps.googleapis.com/maps/api/place/autocomplete/json?input=paris&key=YOUR_API_KEY
   ```
   - Should show JSON response
   - ❌ If error, check API key and restrictions

---

## ✅ Step 6: Component-Specific Checks

1. **Verify input field is not disabled:**
   - Inspect the location input element
   - Check `disabled` attribute is not present
   - Check `readonly` attribute is not present

2. **Check for React errors:**
   - Look for red errors in console
   - Check React DevTools for component state

3. **Verify value prop:**
   - Input should be controlled component
   - Value should update when typing

---

## ✅ Step 7: Common Issues & Solutions

### Issue: "API key is not configured" but env variable exists
**Solution:**
- Restart dev server
- Check variable name is exactly `VITE_GOOGLE_MAPS_API_KEY`
- No spaces around `=`
- No quotes around value

### Issue: Script loads but autocomplete doesn't appear
**Solution:**
- Check Places API is enabled
- Check API key has Places API permission
- Clear browser cache
- Try incognito mode

### Issue: "RefererNotAllowedMapError"
**Solution:**
- Go to Google Cloud Console → API Key → Application restrictions
- Add: `http://localhost:5173/*` (for dev)
- Add your production domain (for prod)
- Or temporarily set to "None" for testing

### Issue: "ApiNotActivatedMapError"
**Solution:**
- Enable Places API in Google Cloud Console
- Enable Geocoding API
- Enable Maps JavaScript API
- Wait 5 minutes for changes to propagate

### Issue: Autocomplete dropdown doesn't show
**Solution:**
- Check z-index issues (dropdown might be behind other elements)
- Check CSS that might hide dropdown
- Try typing a known address (e.g., "Paris, France")

---

## ✅ Step 8: Quick Diagnostic Test

Run this in browser console on your app page:

```javascript
// 1. Check env variable
console.log('API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Missing');

// 2. Check Google Maps loaded
console.log('Google Maps:', window.google ? '✅ Loaded' : '❌ Not loaded');

// 3. Check Places library
console.log('Places API:', window.google?.maps?.places ? '✅ Available' : '❌ Not available');

// 4. Test autocomplete manually
if (window.google?.maps?.places) {
  const input = document.querySelector('#location-autocomplete');
  if (input) {
    const autocomplete = new google.maps.places.Autocomplete(input);
    console.log('Autocomplete:', autocomplete ? '✅ Created' : '❌ Failed');
  }
}
```

---

## 📝 Still Not Working?

1. **Share the following:**
   - Browser console errors (screenshot)
   - Network tab for `maps.googleapis.com` request (screenshot)
   - Output of diagnostic test above
   - Your `.env` file (with API key redacted)

2. **Try these:**
   - Different browser
   - Incognito/private mode
   - Clear browser cache
   - Check if ad blockers are interfering

3. **Verify API key billing:**
   - Google Maps requires billing account
   - Check billing is enabled in Google Cloud Console
   - Free tier: $200/month credit
