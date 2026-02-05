import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AvailabilityRule, DEFAULT_WEEKDAYS, DEFAULT_START_TIME, DEFAULT_END_TIME } from '@/lib/availability';

export interface AvailabilityData {
  weekdays: number[];
  startTime: string;
  endTime: string;
  validFrom: string | null;
  validUntil: string | null;
}

export function useExperienceAvailability(experienceId: string | null) {
  const queryClient = useQueryClient();

  // Fetch availability rules for an experience
  const {
    data: availability,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['experienceAvailability', experienceId],
    queryFn: async () => {
      if (!experienceId) return null;

      const { data, error } = await supabase
        .from('experience_availability')
        .select('*')
        .eq('experience_id', experienceId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Return the first rule (most experiences will have just one)
      // Map to our internal format
      if (data && data.length > 0) {
        const rule = data[0];
        return {
          id: rule.id,
          weekdays: rule.weekdays || DEFAULT_WEEKDAYS,
          startTime: rule.start_time || DEFAULT_START_TIME,
          endTime: rule.end_time || DEFAULT_END_TIME,
          validFrom: rule.valid_from,
          validUntil: rule.valid_until,
        };
      }

      return null;
    },
    enabled: !!experienceId,
  });

  // Fetch all rules (for calendar integration)
  const { data: rules = [] } = useQuery({
    queryKey: ['experienceAvailabilityRules', experienceId],
    queryFn: async () => {
      if (!experienceId) return [];

      const { data, error } = await supabase
        .from('experience_availability')
        .select('*')
        .eq('experience_id', experienceId);

      if (error) throw error;

      return (data || []).map((rule): AvailabilityRule => ({
        id: rule.id,
        experience_id: rule.experience_id,
        weekdays: rule.weekdays || DEFAULT_WEEKDAYS,
        start_time: rule.start_time || DEFAULT_START_TIME,
        end_time: rule.end_time || DEFAULT_END_TIME,
        valid_from: rule.valid_from,
        valid_until: rule.valid_until,
      }));
    },
    enabled: !!experienceId,
  });

  // Save or update availability
  const saveAvailability = useMutation({
    mutationFn: async ({
      experienceId,
      data,
    }: {
      experienceId: string;
      data: AvailabilityData;
    }) => {
      // Check if a rule already exists
      const { data: existing } = await supabase
        .from('experience_availability')
        .select('id')
        .eq('experience_id', experienceId)
        .limit(1);

      const payload = {
        experience_id: experienceId,
        weekdays: data.weekdays,
        start_time: data.startTime,
        end_time: data.endTime,
        valid_from: data.validFrom,
        valid_until: data.validUntil,
        updated_at: new Date().toISOString(),
      };

      if (existing && existing.length > 0) {
        // Update existing rule
        const { error } = await supabase
          .from('experience_availability')
          .update(payload)
          .eq('id', existing[0].id);

        if (error) throw error;
      } else {
        // Insert new rule
        const { error } = await supabase
          .from('experience_availability')
          .insert(payload);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['experienceAvailability', variables.experienceId],
      });
      queryClient.invalidateQueries({
        queryKey: ['experienceAvailabilityRules', variables.experienceId],
      });
    },
  });

  // Delete availability (revert to "always available")
  const deleteAvailability = useMutation({
    mutationFn: async (experienceId: string) => {
      const { error } = await supabase
        .from('experience_availability')
        .delete()
        .eq('experience_id', experienceId);

      if (error) throw error;
    },
    onSuccess: (_, experienceId) => {
      queryClient.invalidateQueries({
        queryKey: ['experienceAvailability', experienceId],
      });
      queryClient.invalidateQueries({
        queryKey: ['experienceAvailabilityRules', experienceId],
      });
    },
  });

  return {
    availability,
    rules,
    isLoading,
    error,
    saveAvailability,
    deleteAvailability,
  };
}

// Hook to get availability for multiple experiences at once
export function useMultipleExperienceAvailability(experienceIds: string[]) {
  return useQuery({
    queryKey: ['multipleExperienceAvailability', experienceIds],
    queryFn: async () => {
      if (experienceIds.length === 0) return {};

      const { data, error } = await supabase
        .from('experience_availability')
        .select('*')
        .in('experience_id', experienceIds);

      if (error) throw error;

      // Group by experience_id
      const byExperience: Record<string, AvailabilityRule[]> = {};
      for (const rule of data || []) {
        if (!byExperience[rule.experience_id]) {
          byExperience[rule.experience_id] = [];
        }
        byExperience[rule.experience_id].push({
          id: rule.id,
          experience_id: rule.experience_id,
          weekdays: rule.weekdays || DEFAULT_WEEKDAYS,
          start_time: rule.start_time || DEFAULT_START_TIME,
          end_time: rule.end_time || DEFAULT_END_TIME,
          valid_from: rule.valid_from,
          valid_until: rule.valid_until,
        });
      }

      return byExperience;
    },
    enabled: experienceIds.length > 0,
  });
}
