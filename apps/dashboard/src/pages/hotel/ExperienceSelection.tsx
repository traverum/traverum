import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';
import { getCategoryLabel, getCategoryIcon, DEFAULT_COMMISSION, SELF_OWNED_COMMISSION } from '@traverum/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/pricing';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Search, Clock, Users, MapPin, CheckCircle2, Loader2, Check, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  distance_km: number | null;
  sort_order: number;
}

// ── Sortable card for drag-and-drop reordering ──
function SortableExperienceCard({
  exp,
  index,
  partnerId,
  onRemove,
  isRemoving,
  formatDuration,
}: {
  exp: AvailableExperience;
  index: number;
  partnerId: string | undefined;
  onRemove: () => void;
  isRemoving: boolean;
  formatDuration: (m: number) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exp.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="bg-primary/5 border-primary/30"
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
            <span className="text-xs font-medium text-muted-foreground tabular-nums w-5 text-center">
              {index + 1}
            </span>
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-accent"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
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
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground line-clamp-1 text-sm">
                    {exp.title}
                  </h3>
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  {exp.supplier?.id === partnerId && (
                    <Badge variant="secondary" className="text-xs font-normal">Your Experience</Badge>
                  )}
                </div>
                {exp.supplier?.name && (
                  <p className="text-xs text-secondary">
                    {exp.supplier.name}
                    {exp.supplier.city && ` · ${exp.supplier.city}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-base font-semibold text-primary whitespace-nowrap">
                  {formatPrice(exp.price_cents)}
                </span>
                <Checkbox
                  checked={true}
                  onCheckedChange={onRemove}
                  disabled={isRemoving}
                  className="h-4 w-4"
                />
              </div>
            </div>
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
                    : `${exp.distance_km.toFixed(1)} km`}
                </span>
              )}
            </div>
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
  );
}

interface ExperienceSelectionProps {
  embedded?: boolean;
}

export default function ExperienceSelection({ embedded = false }: ExperienceSelectionProps) {
  const { activePartner, isLoading: partnerLoading } = useActivePartner();
  const { activeHotelConfigId } = useActiveHotelConfig();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // ── Location state ──
  const [locationAddress, setLocationAddress] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const hasInitialized = useRef(false);

  // Debounce all location values (same pattern as ExperienceDashboard)
  const debouncedAddress = useDebounce(locationAddress, 2000);
  const debouncedLat = useDebounce(locationLat, 2000);
  const debouncedLng = useDebounce(locationLng, 2000);
  const debouncedRadiusKm = useDebounce(radiusKm, 2000);

  const partnerId = activePartner?.partner_id;
  const hasLocation = locationLat !== null && locationLng !== null;

  // ── Load saved location from hotel_config ──
  const { data: savedConfig } = useQuery({
    queryKey: ['hotelConfigLocation', activeHotelConfigId],
    queryFn: async () => {
      if (!activeHotelConfigId) return null;
      const { data, error } = await supabase
        .from('hotel_configs')
        .select('*')
        .eq('id', activeHotelConfigId)
        .single();

      if (error) {
        console.error('Error fetching hotel config:', error);
        return null;
      }
      const config = data as any;
      return {
        address: config?.address ?? null,
        location: config?.location ?? null,
        location_radius_km: config?.location_radius_km ?? 25,
      };
    },
    enabled: !!activeHotelConfigId,
  });

  // Initialize from saved config (once per config change)
  useEffect(() => {
    hasInitialized.current = false;
  }, [activeHotelConfigId]);

  useEffect(() => {
    if (!savedConfig || hasInitialized.current) return;

    if (savedConfig.address) {
      setLocationAddress(savedConfig.address);
    }
    setRadiusKm(savedConfig.location_radius_km || 25);

    if (savedConfig.location) {
      try {
        const loc = savedConfig.location;
        if (typeof loc === 'string') {
          const match = loc.match(/POINT\(([^ ]+) ([^ ]+)\)/);
          if (match) {
            setLocationLng(parseFloat(match[1]));
            setLocationLat(parseFloat(match[2]));
          }
        } else if (loc && typeof loc === 'object') {
          if ('coordinates' in loc && Array.isArray(loc.coordinates)) {
            setLocationLng(loc.coordinates[0]);
            setLocationLat(loc.coordinates[1]);
          } else if ('x' in loc && 'y' in loc) {
            setLocationLng(loc.x);
            setLocationLat(loc.y);
          }
        }
      } catch (e) {
        console.error('Error parsing saved location:', e);
      }
    }
    hasInitialized.current = true;
  }, [savedConfig]);

  // ── Auto-save location to hotel_config (same pattern as ExperienceDashboard) ──
  useEffect(() => {
    if (!activeHotelConfigId || !hasInitialized.current) return;
    if (!debouncedLat || !debouncedLng || !debouncedAddress.trim()) return;

    const autoSave = async () => {
      setSaveStatus('saving');
      try {
        const { error } = await supabase
          .from('hotel_configs')
          .update({
            address: debouncedAddress.trim(),
            location: `POINT(${debouncedLng} ${debouncedLat})`,
            location_radius_km: debouncedRadiusKm,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', activeHotelConfigId);

        if (error) throw error;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error: any) {
        console.error('Error saving location:', error);
        setSaveStatus('idle');
        toast({
          title: 'Error',
          description: 'Failed to save location. Please try again.',
          variant: 'destructive',
        });
      }
    };

    autoSave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHotelConfigId, debouncedAddress, debouncedLat, debouncedLng, debouncedRadiusKm]);

  // ── Fetch experiences within radius (when location set) or all (when not) ──
  const { data: experienceResults = [], isLoading: experiencesLoading } = useQuery({
    queryKey: ['experiencesForHotel', hasLocation, debouncedLat, debouncedLng, debouncedRadiusKm],
    queryFn: async () => {
      if (debouncedLat !== null && debouncedLng !== null) {
        // Use RPC to get distance-filtered results
        const locationWkt = `POINT(${debouncedLng} ${debouncedLat})`;
        const radiusMeters = debouncedRadiusKm * 1000;

        const { data, error } = await supabase.rpc('get_experiences_within_radius', {
          hotel_location: locationWkt,
          radius_meters: radiusMeters,
        });

        if (error) {
          console.error('RPC error, falling back to all experiences:', error);
          // Fallback: fetch all
          return fetchAllExperiences();
        }

        return (data || []).map((exp: any) => ({
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
          distance_km: exp.distance_meters ? exp.distance_meters / 1000 : 0,
          supplier: {
            id: exp.supplier_id,
            name: exp.supplier_name,
            city: exp.supplier_city,
          },
        }));
      }

      // No location set — fetch all
      return fetchAllExperiences();
    },
  });

  async function fetchAllExperiences() {
    const { data, error } = await supabase
      .from('experiences')
      .select(`
        id, title, slug, description, image_url, price_cents,
        duration_minutes, max_participants, meeting_point, tags,
        experience_status,
        supplier:partners!experiences_partner_fk(id, name, city)
      `)
      .eq('experience_status', 'active');

    if (error) throw error;

    return (data || []).map((exp: any) => ({
      ...exp,
      supplier: exp.supplier as any,
      tags: exp.tags || [],
      distance_km: null,
    }));
  }

  // ── Fetch distributions ──
  const { data: distributions = [], isLoading: distributionsLoading } = useQuery({
    queryKey: ['hotelDistributions', partnerId, activeHotelConfigId],
    queryFn: async () => {
      if (!partnerId) return [];

      const { data, error } = await supabase
        .from('distributions')
        .select('id, experience_id, is_active, hotel_config_id, sort_order')
        .eq('hotel_id', partnerId);

      if (error) {
        console.error('Distributions error:', error);
        return [];
      }

      return (data || []).filter(
        (d: any) => d.hotel_config_id === activeHotelConfigId
      );
    },
    enabled: !!partnerId && !!activeHotelConfigId,
  });

  // ── Merge experiences + distributions ──
  const isLoading = experiencesLoading || distributionsLoading;

  const distributionMap = new Map(
    distributions.map((d: any) => [d.experience_id, { id: d.id, isActive: d.is_active, sort_order: d.sort_order ?? 0 }])
  );

  const allExperiences: AvailableExperience[] = experienceResults
    .map((exp: any) => {
      const dist = distributionMap.get(exp.id);
      return {
        ...exp,
        isSelected: dist?.isActive ?? false,
        distributionId: dist?.id || null,
        sort_order: dist?.sort_order ?? 0,
      };
    });

  const selectedExperiences = allExperiences
    .filter(e => e.isSelected)
    .sort((a, b) => a.sort_order - b.sort_order);

  const availableExperiences = allExperiences
    .filter(e => !e.isSelected)
    .sort((a, b) => {
      if (a.distance_km !== null && b.distance_km !== null) return a.distance_km - b.distance_km;
      if (a.distance_km !== null) return -1;
      if (b.distance_km !== null) return 1;
      return a.title.localeCompare(b.title);
    });

  // ── Toggle experience selection ──
  const toggleMutation = useMutation({
    mutationFn: async ({ experienceId, isSelected, distributionId }: {
      experienceId: string;
      isSelected: boolean;
      distributionId: string | null;
    }) => {
      if (!partnerId) throw new Error('No partner selected');

      if (isSelected && distributionId) {
        const { error } = await supabase
          .from('distributions')
          .update({ is_active: false })
          .eq('id', distributionId);
        if (error) throw error;
      } else if (!isSelected && distributionId) {
        const nextOrder = selectedExperiences.length > 0
          ? Math.max(...selectedExperiences.map(e => e.sort_order)) + 1
          : 1;
        const { error } = await supabase
          .from('distributions')
          .update({ is_active: true, sort_order: nextOrder })
          .eq('id', distributionId);
        if (error) throw error;
      } else {
        const { data: experienceData } = await supabase
          .from('experiences')
          .select('partner_id')
          .eq('id', experienceId)
          .single();

        const isSelfOwned = experienceData?.partner_id === partnerId;
        const commissionRates = isSelfOwned
          ? SELF_OWNED_COMMISSION
          : DEFAULT_COMMISSION;

        if (!activeHotelConfigId) throw new Error('No hotel property selected');

        const nextOrder = selectedExperiences.length > 0
          ? Math.max(...selectedExperiences.map(e => e.sort_order)) + 1
          : 1;

        const { error } = await supabase
          .from('distributions')
          .insert({
            hotel_id: partnerId,
            hotel_config_id: activeHotelConfigId,
            experience_id: experienceId,
            commission_supplier: commissionRates.supplier,
            commission_hotel: commissionRates.hotel,
            commission_platform: commissionRates.platform,
            is_active: true,
            sort_order: nextOrder,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotelDistributions', partnerId, activeHotelConfigId] });
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

  // ── Reorder mutation ──
  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      const promises = updates.map(({ id, sort_order }) =>
        supabase
          .from('distributions')
          .update({ sort_order })
          .eq('id', id)
      );
      const results = await Promise.all(promises);
      const failed = results.find(r => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotelDistributions', partnerId, activeHotelConfigId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save order. Please try again.',
        variant: 'destructive',
      });
      console.error('Reorder error:', error);
    },
  });

  // ── Drag-and-drop ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedExperiences.findIndex(e => e.id === active.id);
    const newIndex = selectedExperiences.findIndex(e => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(selectedExperiences, oldIndex, newIndex);
    const updates = reordered.map((exp, i) => ({
      id: exp.distributionId!,
      sort_order: i + 1,
    }));
    reorderMutation.mutate(updates);
  };

  // ── Location handlers ──
  const handleLocationSelect = (address: string, lat: number, lng: number) => {
    setLocationAddress(address);
    setLocationLat(lat);
    setLocationLng(lng);
  };

  const handleAddressChange = (address: string) => {
    setLocationAddress(address);
    setLocationLat(null);
    setLocationLng(null);
  };

  // ── Client-side text search ──
  const matchesSearch = (exp: AvailableExperience) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      exp.title.toLowerCase().includes(query) ||
      (exp.supplier?.name || '').toLowerCase().includes(query) ||
      exp.tags.some(tag => tag.toLowerCase().includes(query))
    );
  };

  const filteredSelected = selectedExperiences.filter(matchesSearch);
  const filteredAvailable = availableExperiences.filter(matchesSearch);

  const selectedCount = selectedExperiences.length;

  const formatDuration = (minutes: number) => {
    if (minutes >= 480) return 'All day';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  // ── Loading / Error states ──
  if (partnerLoading) {
    return (
      <div className={cn(embedded ? 'flex items-center justify-center py-8' : 'min-h-screen flex items-center justify-center bg-background')}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!activePartner) {
    return (
      <div className={cn(embedded ? 'py-8 text-center' : 'min-h-screen flex items-center justify-center bg-background')}>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No organization selected</h2>
          <p className="text-muted-foreground">
            Please select an organization to view available experiences.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(embedded ? '' : 'bg-background-alt min-h-screen')}>
      <div className={cn(embedded ? '' : 'container max-w-6xl mx-auto px-4 py-6')}>
        {/* Header */}
        {!embedded && (
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
        )}
        {embedded && selectedCount > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-medium">
              {selectedCount} selected
            </Badge>
          </div>
        )}

        {/* ── Property Location ── */}
        <Card className="mb-4 border-border">
          <CardContent className="p-4 space-y-4">
            {/* Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-sm font-medium">Property location</Label>
                </div>
                <div className="flex items-center gap-1.5">
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
              </div>
              <LocationAutocomplete
                value={locationAddress}
                onChange={handleLocationSelect}
                onAddressChange={handleAddressChange}
                placeholder="Search for your property address..."
              />
            </div>

            {/* Radius slider — always visible */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Search radius</Label>
                <span className="text-sm font-medium tabular-nums">{radiusKm} km</span>
              </div>
              <Slider
                value={[radiusKm]}
                onValueChange={([val]) => setRadiusKm(val)}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 km</span>
                <span>100 km</span>
              </div>
            </div>

            {/* Result count when filtering */}
            {hasLocation && !isLoading && (
              <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                {allExperiences.length} experience{allExperiences.length !== 1 ? 's' : ''} within {radiusKm} km
              </p>
            )}
          </CardContent>
        </Card>

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

        {/* Experience Lists */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredSelected.length === 0 && filteredAvailable.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-secondary mb-1">
                {searchQuery
                  ? 'No experiences match your search.'
                  : hasLocation
                  ? `No experiences found within ${radiusKm} km. Try increasing the radius.`
                  : 'No experiences available yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── Selected experiences (sortable) ── */}
            {filteredSelected.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-2">
                  Your experiences · Drag to reorder
                </h2>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredSelected.map(e => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {filteredSelected.map((exp, index) => (
                        <SortableExperienceCard
                          key={exp.id}
                          exp={exp}
                          index={index}
                          partnerId={partnerId}
                          onRemove={() => handleToggle(exp)}
                          isRemoving={toggleMutation.isPending}
                          formatDuration={formatDuration}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {/* ── Available experiences ── */}
            {filteredAvailable.length > 0 && (
              <div>
                {filteredSelected.length > 0 && (
                  <h2 className="text-sm font-medium text-muted-foreground mb-2">
                    Available experiences
                  </h2>
                )}
                <div className="space-y-3">
                  {filteredAvailable.map((exp) => (
                    <Card
                      key={exp.id}
                      className="bg-card cursor-pointer transition-ui hover:bg-accent/50"
                      onClick={() => handleToggle(exp)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 pt-0.5">
                            <Checkbox
                              checked={false}
                              onCheckedChange={() => handleToggle(exp)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={toggleMutation.isPending}
                              className="h-4 w-4"
                            />
                          </div>
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
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground line-clamp-1 text-sm">
                                    {exp.title}
                                  </h3>
                                  {exp.supplier?.id === partnerId && (
                                    <Badge variant="secondary" className="text-xs font-normal">Your Experience</Badge>
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
                                    : `${exp.distance_km.toFixed(1)} km`}
                                </span>
                              )}
                            </div>
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
