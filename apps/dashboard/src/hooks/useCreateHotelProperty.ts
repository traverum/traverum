import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from './useActivePartner';

interface CreateHotelPropertyData {
  hotelName: string;
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
      // Auto-generate slug from hotel name
      const baseSlug = data.hotelName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Ensure slug is unique by appending a suffix if needed
      let slug = baseSlug;
      let attempt = 0;
      while (true) {
        const { data: existingConfig } = await supabase
          .from('hotel_configs')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (!existingConfig) break;
        attempt++;
        slug = `${baseSlug}-${attempt}`;
      }

      // Create hotel_config for the existing organization
      const { error: hotelConfigError } = await supabase
        .from('hotel_configs')
        .insert({
          partner_id: activePartner.partner_id,
          slug,
          display_name: data.hotelName,
          is_active: true,
        });

      if (hotelConfigError) {
        return { error: hotelConfigError };
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['userPartners'] });
      await queryClient.invalidateQueries({ queryKey: ['partnerCapabilities'] });
      await queryClient.invalidateQueries({ queryKey: ['hotelConfigs', activePartner.partner_id] });
      // Also refresh the dropdown's all-hotel-configs query
      await queryClient.invalidateQueries({ queryKey: ['allHotelConfigs'] });

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
