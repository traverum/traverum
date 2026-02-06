import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from './useActivePartner';

interface CreateHotelPropertyData {
  hotelName: string;
  slug: string;
  displayName: string;
}

export function useCreateHotelProperty() {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { activePartner } = useActivePartner();

  const createHotelProperty = async (data: CreateHotelPropertyData) => {
    if (!activePartner?.partner_id) {
      return { error: new Error('No active organization selected') };
    }

    setIsLoading(true);

    try {
      // Check if slug already exists
      const { data: existingConfig } = await supabase
        .from('hotel_configs')
        .select('id')
        .eq('slug', data.slug)
        .single();

      if (existingConfig) {
        return { error: new Error('This slug is already taken. Please choose another.') };
      }

      // Create hotel_config for the existing organization
      const { error: hotelConfigError } = await supabase
        .from('hotel_configs')
        .insert({
          partner_id: activePartner.partner_id,
          slug: data.slug,
          display_name: data.displayName,
          is_active: true,
        });

      if (hotelConfigError) {
        return { error: hotelConfigError };
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['userPartners'] });
      await queryClient.invalidateQueries({ queryKey: ['partnerCapabilities'] });
      await queryClient.invalidateQueries({ queryKey: ['hotelConfigs', activePartner.partner_id] });

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createHotelProperty,
    isLoading,
  };
}
