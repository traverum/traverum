import { useState, useEffect } from 'react';
import { useActivePartner } from '@/hooks/useActivePartner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Loader2, Check } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

export default function LocationSettings() {
  const { activePartner, activePartnerId, isLoading: partnerLoading } = useActivePartner();
  const { toast } = useToast();

  const [locationAddress, setLocationAddress] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [locationRadiusKm, setLocationRadiusKm] = useState('25');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Debounced values for auto-save
  const debouncedLocationAddress = useDebounce(locationAddress, 2000);
  const debouncedLocationLat = useDebounce(locationLat, 2000);
  const debouncedLocationLng = useDebounce(locationLng, 2000);
  const debouncedLocationRadiusKm = useDebounce(locationRadiusKm, 2000);

  // Load existing location data
  useEffect(() => {
    if (activePartnerId && !partnerLoading) {
      const loadPartnerData = async () => {
        const { data: partnerData, error } = await supabase
          .from('partners')
          .select('address, location, location_radius_km')
          .eq('id', activePartnerId)
          .single();

        if (error) {
          console.error('Error loading partner data:', error);
          return;
        }

        if (partnerData) {
          setLocationAddress(partnerData.address || '');
          setLocationRadiusKm((partnerData.location_radius_km || 25).toString());

          // If location exists, extract lat/lng from PostGIS POINT
          const partnerLocation = partnerData.location;
          if (partnerLocation) {
            try {
              if (typeof partnerLocation === 'string') {
                // Parse "POINT(lng lat)" format
                const match = partnerLocation.match(/POINT\(([^ ]+) ([^ ]+)\)/);
                if (match) {
                  setLocationLng(parseFloat(match[1]));
                  setLocationLat(parseFloat(match[2]));
                }
              } else if (partnerLocation && typeof partnerLocation === 'object') {
                // Supabase might return as GeoJSON: { type: 'Point', coordinates: [lng, lat] }
                if ('coordinates' in partnerLocation && Array.isArray(partnerLocation.coordinates) && partnerLocation.coordinates.length >= 2) {
                  setLocationLng(partnerLocation.coordinates[0]);
                  setLocationLat(partnerLocation.coordinates[1]);
                } else if ('x' in partnerLocation && 'y' in partnerLocation) {
                  // Alternative format: { x: lng, y: lat }
                  setLocationLng(partnerLocation.x);
                  setLocationLat(partnerLocation.y);
                }
              }
            } catch (e) {
              console.error('Error parsing location:', e);
            }
          }
        }
      };

      loadPartnerData();
    }
  }, [activePartnerId, partnerLoading]);

  // Auto-save location changes
  useEffect(() => {
    if (!activePartnerId || partnerLoading) return;

    const autoSave = async () => {
      setSaveStatus('saving');
      setSaving(true);

      try {
        // Prepare location data if available
        let locationData: any = {};
        if (debouncedLocationAddress.trim() && debouncedLocationLat !== null && debouncedLocationLng !== null) {
          locationData.address = debouncedLocationAddress.trim();
          // Format as WKT for PostGIS geography: POINT(lng lat) - note: lng comes first in PostGIS
          locationData.location = `POINT(${debouncedLocationLng} ${debouncedLocationLat})`;
        }

        // Update radius
        const radiusValue = parseInt(debouncedLocationRadiusKm, 10);
        if (!isNaN(radiusValue) && radiusValue > 0) {
          locationData.location_radius_km = radiusValue;
        }

        const { error } = await supabase
          .from('partners')
          .update(locationData)
          .eq('id', activePartnerId);

        if (error) throw error;

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error: any) {
        console.error('Error saving location:', error);
        toast({
          title: 'Error saving location',
          description: error.message || 'Failed to save location settings',
          variant: 'destructive',
        });
        setSaveStatus('idle');
      } finally {
        setSaving(false);
      }
    };

    autoSave();
  }, [
    activePartnerId,
    debouncedLocationAddress,
    debouncedLocationLat,
    debouncedLocationLng,
    debouncedLocationRadiusKm,
    partnerLoading,
    toast,
  ]);

  // Handle location selection from autocomplete (with coordinates)
  const handleLocationChange = (address: string, lat: number, lng: number) => {
    setLocationAddress(address);
    setLocationLat(lat);
    setLocationLng(lng);
  };

  // Handle address change without coordinates (manual entry)
  const handleAddressChange = (address: string) => {
    setLocationAddress(address);
    setLocationLat(null);
    setLocationLng(null);
  };

  if (partnerLoading || !activePartner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Location Settings</h1>
        </div>

        {/* Location Card */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Hotel Address</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="location-autocomplete" className="text-sm">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Used to filter experiences by distance</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <LocationAutocomplete
                value={locationAddress}
                onChange={handleLocationChange}
                onAddressChange={handleAddressChange}
                required
                label=""
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="radius" className="text-sm">Search Radius</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Maximum distance to show experiences (km)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="radius"
                type="number"
                min="1"
                max="100"
                value={locationRadiusKm}
                onChange={(e) => setLocationRadiusKm(e.target.value)}
                className="h-8"
                placeholder="25"
              />
            </div>

            {/* Save Status */}
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Saving</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="h-3 w-3 text-[#6B8E6B]" />
                    <span className="text-xs text-[#6B8E6B]">Saved</span>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
