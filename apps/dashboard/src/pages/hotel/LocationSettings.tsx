import { useState, useEffect } from 'react';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';
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
import { cn } from '@/lib/utils';

interface LocationSettingsProps {
  embedded?: boolean;
}

export default function LocationSettings({ embedded = false }: LocationSettingsProps) {
  const { activePartner, isLoading: partnerLoading } = useActivePartner();
  const { activeHotelConfigId, isLoading: configLoading } = useActiveHotelConfig();
  const { toast } = useToast();

  const [locationAddress, setLocationAddress] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [locationRadiusKm, setLocationRadiusKm] = useState('25');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Debounced values for auto-save
  const debouncedLocationAddress = useDebounce(locationAddress, 2000);
  const debouncedLocationLat = useDebounce(locationLat, 2000);
  const debouncedLocationLng = useDebounce(locationLng, 2000);
  const debouncedLocationRadiusKm = useDebounce(locationRadiusKm, 2000);

  // Load existing location data from hotel_configs
  useEffect(() => {
    if (!activeHotelConfigId || partnerLoading || configLoading) return;
    setHasInitialized(false);

    const loadLocationData = async () => {
      // Use select('*') to avoid issues with columns not in generated types
      const { data, error } = await supabase
        .from('hotel_configs')
        .select('*')
        .eq('id', activeHotelConfigId)
        .single();

      if (error) {
        console.error('Error loading hotel config location:', error);
        setHasInitialized(true);
        return;
      }

      if (data) {
        const config = data as any;
        setLocationAddress(config.address || '');
        setLocationRadiusKm((config.location_radius_km || 25).toString());

        // If location exists, extract lat/lng from PostGIS POINT
        const loc = config.location;
        if (loc) {
          try {
            if (typeof loc === 'string') {
              const match = loc.match(/POINT\(([^ ]+) ([^ ]+)\)/);
              if (match) {
                setLocationLng(parseFloat(match[1]));
                setLocationLat(parseFloat(match[2]));
              }
            } else if (loc && typeof loc === 'object') {
              if ('coordinates' in loc && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
                setLocationLng(loc.coordinates[0]);
                setLocationLat(loc.coordinates[1]);
              } else if ('x' in loc && 'y' in loc) {
                setLocationLng(loc.x);
                setLocationLat(loc.y);
              }
            }
          } catch (e) {
            console.error('Error parsing location:', e);
          }
        }
      }

      // Mark initialized after a tick so debounced values don't trigger immediate save
      setTimeout(() => setHasInitialized(true), 100);
    };

    loadLocationData();
  }, [activeHotelConfigId, partnerLoading, configLoading]);

  // Auto-save location changes to hotel_configs
  useEffect(() => {
    if (!activeHotelConfigId || !hasInitialized) return;

    const autoSave = async () => {
      setSaveStatus('saving');
      setSaving(true);

      try {
        const locationData: any = {
          updated_at: new Date().toISOString(),
        };

        if (debouncedLocationAddress.trim() && debouncedLocationLat !== null && debouncedLocationLng !== null) {
          locationData.address = debouncedLocationAddress.trim();
          locationData.location = `POINT(${debouncedLocationLng} ${debouncedLocationLat})`;
        } else if (debouncedLocationAddress.trim()) {
          locationData.address = debouncedLocationAddress.trim();
        }

        const radiusValue = parseInt(debouncedLocationRadiusKm, 10);
        if (!isNaN(radiusValue) && radiusValue > 0) {
          locationData.location_radius_km = radiusValue;
        }

        const { error } = await supabase
          .from('hotel_configs')
          .update(locationData)
          .eq('id', activeHotelConfigId);

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
    activeHotelConfigId,
    debouncedLocationAddress,
    debouncedLocationLat,
    debouncedLocationLng,
    debouncedLocationRadiusKm,
    hasInitialized,
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

  if (partnerLoading || configLoading || !activePartner) {
    return (
      <div className={cn(embedded ? 'flex items-center justify-center py-4' : 'min-h-screen flex items-center justify-center bg-background')}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!activeHotelConfigId) {
    return (
      <div className={cn(embedded ? 'py-4 text-center' : 'p-6')}>
        <p className="text-sm text-muted-foreground">
          Select a property to configure its location.
        </p>
      </div>
    );
  }

  // When embedded (e.g. in StayDashboard Details tab), render just the fields
  if (embedded) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Property Location</CardTitle>
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
                  <p className="text-xs">Used to filter experiences by distance from this property</p>
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
    );
  }

  // Standalone page render
  return (
    <div className="p-6">
      <div className="container max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Location Settings</h1>
        </div>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Property Address</CardTitle>
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
                    <p className="text-xs">Used to filter experiences by distance from this property</p>
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
