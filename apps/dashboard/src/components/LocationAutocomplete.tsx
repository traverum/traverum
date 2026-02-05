import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (address: string, lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void; // For when user types (without coordinates)
  onError?: (error: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  onAddressChange,
  onError,
  placeholder = 'Enter address',
  label,
  required = false,
  disabled = false,
  className,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      const error = 'VITE_GOOGLE_MAPS_API_KEY is not set. Check your .env file and restart dev server.';
      console.error('❌ LocationAutocomplete:', error);
      console.log('Current env check:', {
        hasKey: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes('GOOGLE')),
      });
      setErrorMessage(error);
      setStatus('error');
      onError?.(error);
      // Don't block the input - allow typing even without API key
      return;
    }

    console.log('✅ LocationAutocomplete: API key found, loading Google Maps...');

    // Check if script is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeAutocomplete();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`) as HTMLScriptElement;
    if (existingScript) {
      console.log('⏳ LocationAutocomplete: Script already loading, waiting...');
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          console.log('✅ LocationAutocomplete: Existing script loaded, Places API available');
          clearInterval(checkInterval);
          initializeAutocomplete();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.maps?.places) {
          const error = 'Timeout waiting for Places API. Check that Places API is enabled.';
          console.error('❌ LocationAutocomplete:', error);
          setErrorMessage(error);
          setStatus('error');
          onError?.(error);
        }
      }, 10000);
      
      return () => clearInterval(checkInterval);
    }

    // Load the script
    const script = document.createElement('script');
    // Use loading=async for better performance (Google's recommendation)
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ LocationAutocomplete: Google Maps script loaded');
      
      // Wait for Places library to initialize (it may load asynchronously)
      let attempts = 0;
      const maxAttempts = 20; // 2 seconds total
      
      const checkPlaces = () => {
        attempts++;
        
        if (window.google?.maps?.places) {
          console.log('✅ LocationAutocomplete: Places API available');
          initializeAutocomplete();
          return;
        }
        
        if (attempts < maxAttempts) {
          // Keep checking every 100ms
          setTimeout(checkPlaces, 100);
        } else {
          // Final check with detailed diagnostics
          const debugInfo = {
            hasGoogle: !!window.google,
            hasMaps: !!window.google?.maps,
            hasPlaces: !!window.google?.maps?.places,
            googleKeys: window.google ? Object.keys(window.google) : [],
            mapsKeys: window.google?.maps ? Object.keys(window.google.maps) : [],
            scriptSrc: script.src,
          };
          
          console.error('❌ LocationAutocomplete: Places API not available after', maxAttempts, 'attempts');
          console.error('Debug info:', debugInfo);
          
          const error = 'Places API not available. Please:\n1. Go to Google Cloud Console\n2. Enable "Places API"\n3. Wait 2-3 minutes for changes to propagate\n4. Refresh this page';
          setErrorMessage(error);
          setStatus('error');
          onError?.(error);
        }
      };
      
      // Start checking
      checkPlaces();
    };
    script.onerror = (event) => {
      const error = 'Failed to load Google Maps API. This is usually caused by:\n1. HTTP referrer restrictions blocking your domain\n2. Places API not enabled\n3. Invalid API key\n\nCheck browser console for details.';
      console.error('❌ LocationAutocomplete: Script load error', event);
      console.error('API Key used:', GOOGLE_MAPS_API_KEY.substring(0, 10) + '...');
      console.error('Current URL:', window.location.href);
      console.error('Expected referrer patterns:', [
        'http://localhost:5173/*',
        'http://127.0.0.1:5173/*',
        'https://traverum.com/*',
      ]);
      setErrorMessage(error);
      setStatus('error');
      onError?.(error);
    };
    
    // Also listen for Google Maps errors after script loads
    window.addEventListener('error', (event) => {
      if (event.message && event.message.includes('RefererNotAllowedMapError')) {
        const currentUrl = window.location.origin + window.location.pathname;
        const isProduction = window.location.protocol === 'https:';
        console.error('❌ LocationAutocomplete: RefererNotAllowedMapError');
        console.error('Current URL that needs to be authorized:', currentUrl);
        console.error('Add this pattern to Google Cloud Console:', window.location.origin + '/*');
        console.error('Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
        const error = `HTTP referrer restriction error.\n\nCurrent URL: ${currentUrl}\n\nAdd "${window.location.origin}/*" to your API key's allowed referrers in Google Cloud Console:\n1. Go to: https://console.cloud.google.com/apis/credentials\n2. Click your API key\n3. Add: ${window.location.origin}/*\n4. Save and wait 2-3 minutes`;
        setErrorMessage(error);
        setStatus('error');
        onError?.(error);
      }
    }, true);
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove autocomplete listeners
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const initializeAutocomplete = () => {
    if (!inputRef.current) {
      console.error('❌ LocationAutocomplete: Input ref not available');
      return;
    }
    
    if (!window.google?.maps?.places) {
      console.error('❌ LocationAutocomplete: Places API not available', {
        hasGoogle: !!window.google,
        hasMaps: !!window.google?.maps,
        hasPlaces: !!window.google?.maps?.places,
      });
      return;
    }

    try {
      console.log('✅ LocationAutocomplete: Initializing autocomplete...');
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        // Remove types restriction to allow all place types (addresses, establishments, etc.)
        // The 'address' type cannot be mixed with other types, so we remove the restriction
        fields: ['formatted_address', 'geometry', 'place_id'],
      });

      autocompleteRef.current = autocomplete;
      console.log('✅ LocationAutocomplete: Autocomplete initialized successfully');

      // Handle place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
          const error = 'No location found for this place';
          setErrorMessage(error);
          setStatus('error');
          onError?.(error);
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || '';

        setCoordinates({ lat, lng });
        setStatus('success');
        setErrorMessage(null);
        setIsLoading(false);

        // Call onChange with the selected place data
        // This will update the parent component's state
        onChange(address, lat, lng);
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to initialize autocomplete';
      setErrorMessage(errorMsg);
      setStatus('error');
      onError?.(errorMsg);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Update parent state when user types (for controlled input)
    if (onAddressChange) {
      onAddressChange(newValue);
    }
    
    // Reset status when user types (but don't clear if it's just the autocomplete filling in)
    if (newValue !== value && status !== 'success') {
      setStatus('idle');
      setErrorMessage(null);
      setCoordinates(null);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="location-autocomplete" className="text-sm">
          {label} {required && '*'}
        </Label>
      )}
      <div className="relative">
        <Input
          id="location-autocomplete"
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="h-8"
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      
      {status === 'error' && errorMessage && (
        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-red-900 dark:text-red-100">{errorMessage}</span>
        </div>
      )}

    </div>
  );
}
