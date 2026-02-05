/**
 * Google Maps Geocoding API utilities
 * Handles address geocoding and reverse geocoding
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('VITE_GOOGLE_MAPS_API_KEY is not set. Geocoding will not work.');
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export interface GeocodeError {
  message: string;
  code?: string;
}

/**
 * Geocode an address to coordinates using Google Maps Geocoding API
 * @param address - The address string to geocode
 * @returns Promise with lat, lng, and formatted address
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured');
  }

  if (!address || address.trim().length === 0) {
    throw new Error('Address cannot be empty');
  }

  try {
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === 'ZERO_RESULTS') {
      throw new Error('No results found for this address');
    }

    if (data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned from geocoding API');
    }

    const result = data.results[0];
    const location = result.geometry.location;

    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to geocode address');
  }
}

/**
 * Reverse geocode coordinates to an address using Google Maps Geocoding API
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Promise with formatted address string
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured');
  }

  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid coordinates');
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === 'ZERO_RESULTS') {
      throw new Error('No results found for these coordinates');
    }

    if (data.status !== 'OK') {
      throw new Error(`Reverse geocoding failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned from reverse geocoding API');
    }

    return data.results[0].formatted_address;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to reverse geocode coordinates');
  }
}

/**
 * Format PostGIS geography point from lat/lng
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns PostGIS POINT string format
 */
export function formatPostGISPoint(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}
