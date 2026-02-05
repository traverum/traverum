import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from '@/hooks/useActivePartner';
import { getCategoryLabel, getCategoryIcon } from '@traverum/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/pricing';
import { Search, Clock, Users, MapPin } from 'lucide-react';

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
}

export default function ExperienceSelection() {
  const { activePartner } = useActivePartner();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const partnerId = activePartner?.partner_id;

  // Fetch all active experiences (not owned by this hotel) and current distributions
  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ['availableExperiences', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];

      // Get all active experiences from suppliers
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
          supplier:partners!experiences_partner_fk(
            id,
            name,
            city
          )
        `)
        .eq('experience_status', 'active')
        .neq('partner_id', partnerId); // Exclude own experiences

      if (expError) throw expError;

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

      return (allExperiences || []).map((exp): AvailableExperience => {
        const dist = distributionMap.get(exp.id);
        return {
          ...exp,
          supplier: exp.supplier as any,
          tags: exp.tags || [],
          isSelected: dist?.isActive ?? false,
          distributionId: dist?.id || null,
        };
      });
    },
    enabled: !!partnerId,
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
      exp.supplier.name.toLowerCase().includes(query) ||
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
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Experience Selection</h1>
          <p className="text-muted-foreground">
            Select experiences to display in your booking widget. Guests will be able to book these directly.
          </p>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search experiences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="font-normal">
              {selectedCount} selected
            </Badge>
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
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'No experiences match your search.' 
                  : 'No experiences available yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredExperiences.map((exp) => (
              <Card
                key={exp.id}
                className={`cursor-pointer transition-all ${
                  exp.isSelected 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleToggle(exp)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <Checkbox
                        checked={exp.isSelected}
                        onCheckedChange={() => handleToggle(exp)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={toggleMutation.isPending}
                      />
                    </div>

                    {/* Image */}
                    {exp.image_url ? (
                      <img
                        src={exp.image_url}
                        alt={exp.title}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-muted-foreground">No image</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground line-clamp-1">
                            {exp.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            by {exp.supplier.name}
                            {exp.supplier.city && ` · ${exp.supplier.city}`}
                          </p>
                        </div>
                        <span className="text-lg font-semibold text-primary whitespace-nowrap">
                          {formatPrice(exp.price_cents)}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {exp.description}
                      </p>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(exp.duration_minutes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Up to {exp.max_participants}
                        </span>
                        {exp.meeting_point && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {exp.meeting_point}
                          </span>
                        )}
                      </div>

                      {/* Category */}
                      {exp.tags.length > 0 && exp.tags[0] && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline" className="text-xs font-normal flex items-center gap-1">
                            <span>{getCategoryIcon(exp.tags[0])}</span>
                            <span>{getCategoryLabel(exp.tags[0])}</span>
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
