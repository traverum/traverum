/**
 * Debug component to test Google Maps API loading
 * Add this temporarily to your page to diagnose issues
 */
import { useEffect, useState } from 'react';

export function LocationAutocompleteDebug() {
  const [checks, setChecks] = useState({
    envVar: false,
    scriptLoaded: false,
    googleMaps: false,
    placesApi: false,
    error: null as string | null,
  });

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    // Check 1: Environment variable
    setChecks(prev => ({ ...prev, envVar: !!apiKey }));

    // Check 2: Script loading
    const script = document.querySelector('script[src*="maps.googleapis.com"]');
    setChecks(prev => ({ ...prev, scriptLoaded: !!script }));

    // Check 3: Google Maps object
    if (window.google) {
      setChecks(prev => ({ ...prev, googleMaps: true }));
      
      // Check 4: Places API
      if (window.google.maps && window.google.maps.places) {
        setChecks(prev => ({ ...prev, placesApi: true }));
      }
    } else {
      // Try to load script if not loaded
      if (apiKey && !script) {
        const newScript = document.createElement('script');
        newScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        newScript.async = true;
        newScript.defer = true;
        newScript.onload = () => {
          setChecks(prev => ({ 
            ...prev, 
            scriptLoaded: true,
            googleMaps: !!window.google,
            placesApi: !!(window.google?.maps?.places),
          }));
        };
        newScript.onerror = () => {
          setChecks(prev => ({ 
            ...prev, 
            error: 'Failed to load Google Maps script. Check API key and network.',
          }));
        };
        document.head.appendChild(newScript);
      }
    }
  }, []);

  return (
    <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
      <h3 className="font-semibold">Location Autocomplete Debug</h3>
      <div className="space-y-1">
        <div className={checks.envVar ? 'text-green-600' : 'text-red-600'}>
          {checks.envVar ? '✅' : '❌'} Environment Variable (VITE_GOOGLE_MAPS_API_KEY)
        </div>
        <div className={checks.scriptLoaded ? 'text-green-600' : 'text-yellow-600'}>
          {checks.scriptLoaded ? '✅' : '⏳'} Google Maps Script Loaded
        </div>
        <div className={checks.googleMaps ? 'text-green-600' : 'text-red-600'}>
          {checks.googleMaps ? '✅' : '❌'} window.google Available
        </div>
        <div className={checks.placesApi ? 'text-green-600' : 'text-red-600'}>
          {checks.placesApi ? '✅' : '❌'} Places API Available
        </div>
        {checks.error && (
          <div className="text-red-600">
            ❌ Error: {checks.error}
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        API Key: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY 
          ? `${import.meta.env.VITE_GOOGLE_MAPS_API_KEY.substring(0, 10)}...` 
          : 'NOT SET'}
      </div>
    </div>
  );
}
