import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from '@/hooks/useActivePartner';
import { getCategoryLabel, getCategoryIcon } from '@traverum/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/pricing';
import { Search, Clock, Users, MapPin, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailableExperience {
  id: string;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  price_cents: number;
  duration_minutes: number;
  max_participants: number;
  meeting_point: string | null;
  tags: string[];
  experience_status: string;
  supplier: {
    id: string;
    name: string;
    city: string | null;
  };
  isSelected: boolean;
  distributionId: string | null;
  distance_km: number | null; // Distance from hotel in kilometers
}

export default function ExperienceSelection() {
  const { activePartner, isLoading: partnerLoading, capabilities } = useActivePartner();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const partnerId = activePartner?.partner_id;

  // Show loading while partner is loading
  if (partnerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Show error state if no partner
  if (!activePartner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No organization selected</h2>
          <p className="text-muted-foreground">
            Please select an organization to view available experiences.
          </p>
        </div>
      </div>
    );
  }

  // Show error if organization doesn't have hotel capabilities
  if (!capabilities.isHotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Hotel capabilities required</h2>
          <p className="text-muted-foreground">
            This organization does not have hotel capabilities. Please select a hotel organization.
          </p>
        </div>
      </div>
    );
  }

  // Fetch hotel location and radius first
  const { data: hotelLocation } = useQuery({
    queryKey: ['hotelLocation', partnerId],
    queryFn: async () => {
      if (!partnerId) return null;

      const { data, error } = await supabase
        .from('partners')
        .select('location, location_radius_km, address')
        .eq('id', partnerId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });

  // Fetch all active experiences (not owned by this hotel) and current distributions
  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ['availableExperiences', partnerId, hotelLocation?.location, hotelLocation?.location_radius_km],
    queryFn: async () => {
      if (!partnerId) return [];

      // Get hotel location and radius
      const hotelLoc = hotelLocation?.location;
      const radiusKm = hotelLocation?.location_radius_km || 25;

      let filteredExperiences: any[] = [];

      // If hotel has location, use optimized RPC function
      if (hotelLoc) {
        const radiusMeters = radiusKm * 1000; // Convert km to meters

        // RPC function now accepts text (WKB hex string) and casts to geography internally
        console.log('Calling RPC with:', {
          hotel_location: hotelLoc,
          hotel_location_type: typeof hotelLoc,
          radius_meters: radiusMeters,
          exclude_partner_id: partnerId,
        });
        
        const { data: experiencesData, error: rpcError } = await supabase.rpc('get_experiences_within_radius', {
          hotel_location: hotelLoc,
          radius_meters: radiusMeters,
          exclude_partner_id: partnerId,
        });

        if (rpcError) {
          console.error('RPC error details:', {
            code: rpcError.code,
            message: rpcError.message,
            details: rpcError.details,
            hint: rpcError.hint,
            fullError: rpcError,
          });
          
          // Fall back to fetching all experiences if RPC fails
          console.warn('RPC failed, falling back to fetching all experiences');
          const { data: allExperiences, error: expError } = await supabase
            .from('experiences')
            .select(`
              id,
              title,
              slug,
              description,
              image_url,
              price_cents,
              duration_minutes,
              max_participants,
              meeting_point,
              tags,
              experience_status,
              location,
              supplier:partners!experiences_partner_fk(
                id,
                name,
                city
              )
            `)
            .eq('experience_status', 'active')
            .neq('partner_id', partnerId);

          if (expError) throw expError;

          filteredExperiences = (allExperiences || []).map((exp: any) => ({
            ...exp,
            supplier: exp.supplier as any,
            tags: exp.tags || [],
            distance_km: null,
          }));
        } else {
          console.log('RPC success, returned experiences:', experiencesData?.length || 0);
          
          // Transform RPC result to match our interface
          filteredExperiences = (experiencesData || []).map((exp: any) => ({
            id: exp.id,
            title: exp.title,
            slug: exp.slug,
            description: exp.description,
            image_url: exp.image_url,
            price_cents: exp.price_cents,
            duration_minutes: exp.duration_minutes,
            max_participants: exp.max_participants,
            meeting_point: exp.meeting_point,
            tags: exp.tags || [],
            experience_status: exp.experience_status,
            location: exp.location,
            distance_km: exp.distance_meters ? exp.distance_meters / 1000 : null,
            supplier: {
              id: exp.supplier_id,
              name: exp.supplier_name,
              city: exp.supplier_city,
            },
          }));
        }
      } else {
        // No hotel location set, fetch all experiences normally
        const { data: allExperiences, error: expError } = await supabase
          .from('experiences')
          .select(`
            id,
            title,
            slug,
            description,
            image_url,
            price_cents,
            duration_minutes,
            max_participants,
            meeting_point,
            tags,
            experience_status,
            location,
            supplier:partners!experiences_partner_fk(
              id,
              name,
              city
            )
          `)
          .eq('experience_status', 'active')
          .neq('partner_id', partnerId);

        if (expError) throw expError;

        filteredExperiences = (allExperiences || []).map((exp: any) => ({
          ...exp,
          supplier: exp.supplier as any,
          tags: exp.tags || [],
          distance_km: null,
        }));
      }

      // Get current distributions for this hotel
      const { data: distributions, error: distError } = await supabase
        .from('distributions')
        .select('id, experience_id, is_active')
        .eq('hotel_id', partnerId);

      if (distError) throw distError;

      // Merge to show selection state
      const distributionMap = new Map(
        (distributions || []).map(d => [d.experience_id, { id: d.id, isActive: d.is_active }])
      );

      return filteredExperiences.map((exp: any): AvailableExperience => {
        const dist = distributionMap.get(exp.id);
        return {
          ...exp,
          supplier: exp.supplier as any,
          tags: exp.tags || [],
          isSelected: dist?.isActive ?? false,
          distributionId: dist?.id || null,
          distance_km: exp.distance_km || null,
        };
      });
    },
    enabled: !!partnerId && hotelLocation !== undefined, // Wait for hotelLocation to load (even if null)
  });

  // Toggle experience selection
  const toggleMutation = useMutation({
    mutationFn: async ({ experienceId, isSelected, distributionId }: { 
      experienceId: string; 
      isSelected: boolean; 
      distributionId: string | null;
    }) => {
      if (!partnerId) throw new Error('No partner selected');

      if (isSelected && distributionId) {
        // Deselect: set is_active to false
        const { error } = await supabase
          .from('distributions')
          .update({ is_active: false })
          .eq('id', distributionId);
        if (error) throw error;
      } else if (!isSelected && distributionId) {
        // Re-select existing distribution
        const { error } = await supabase
          .from('distributions')
          .update({ is_active: true })
          .eq('id', distributionId);
        if (error) throw error;
      } else {
        // Create new distribution with default commissions
        const { error } = await supabase
          .from('distributions')
          .insert({
            hotel_id: partnerId,
            experience_id: experienceId,
            commission_supplier: 80,
            commission_hotel: 12,
            commission_platform: 8,
            is_active: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableExperiences', partnerId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update selection. Please try again.',
        variant: 'destructive',
      });
      console.error('Toggle error:', error);
    },
  });

  const handleToggle = (exp: AvailableExperience) => {
    toggleMutation.mutate({
      experienceId: exp.id,
      isSelected: exp.isSelected,
      distributionId: exp.distributionId,
    });
  };

  // Filter experiences by search
  const filteredExperiences = experiences.filter(exp => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      exp.title.toLowerCase().includes(query) ||
      (exp.supplier?.name || '').toLowerCase().includes(query) ||
      exp.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const selectedCount = experiences.filter(e => e.isSelected).length;

  const formatDuration = (minutes: number) => {
    if (minutes >= 480) return 'All day';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="bg-background-alt min-h-screen">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold">Experience Selection</h1>
            {selectedCount > 0 && (
              <Badge className="bg-primary text-primary-foreground font-medium">
                {selectedCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search experiences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Experience List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredExperiences.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-secondary mb-1">
                {searchQuery 
                  ? 'No experiences match your search.' 
                  : hotelLocation?.location
                  ? `No experiences found within ${hotelLocation.location_radius_km || 25} km.`
                  : 'No experiences available yet.'}
              </p>
              {hotelLocation?.location && !searchQuery && (
                <p className="text-xs text-muted-foreground mt-2">
                  Try increasing your search radius in <a href="/hotel/location" className="text-primary hover:underline">Location Settings</a>.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredExperiences.map((exp) => (
              <Card
                key={exp.id}
                className={cn(
                  "bg-card cursor-pointer transition-ui",
                  exp.isSelected 
                    ? "bg-primary/5 border-primary/30" 
                    : "hover:bg-accent/50"
                )}
                onClick={() => handleToggle(exp)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-0.5">
                      <Checkbox
                        checked={exp.isSelected}
                        onCheckedChange={() => handleToggle(exp)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={toggleMutation.isPending}
                        className="h-4 w-4"
                      />
                    </div>

                    {/* Image */}
                    <div className="flex-shrink-0">
                      {exp.image_url ? (
                        <img
                          src={exp.image_url}
                          alt={exp.title}
                          className="w-24 h-24 rounded object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground line-clamp-1 text-sm">
                              {exp.title}
                            </h3>
                            {exp.isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                          {exp.supplier?.name && (
                            <p className="text-xs text-secondary">
                              {exp.supplier.name}
                              {exp.supplier.city && ` · ${exp.supplier.city}`}
                            </p>
                          )}
                        </div>
                        <span className="text-base font-semibold text-primary whitespace-nowrap flex-shrink-0">
                          {formatPrice(exp.price_cents)}
                        </span>
                      </div>

                      <p className="text-xs text-secondary line-clamp-2 mb-2">
                        {exp.description}
                      </p>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(exp.duration_minutes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {exp.max_participants}
                        </span>
                        {exp.distance_km !== null && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {exp.distance_km < 1 
                              ? `${Math.round(exp.distance_km * 1000)}m`
                              : `${exp.distance_km.toFixed(1)}km`}
                          </span>
                        )}
                      </div>

                      {/* Category Badge */}
                      {exp.tags.length > 0 && exp.tags[0] && (
                        <div className="mt-2">
                          <Badge 
                            variant="outline" 
                            className="text-xs font-normal border-border/50"
                          >
                            <span className="mr-1">{getCategoryIcon(exp.tags[0])}</span>
                            {getCategoryLabel(exp.tags[0])}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
