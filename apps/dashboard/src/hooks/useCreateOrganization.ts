import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useActivePartner } from './useActivePartner';

interface CreateOrganizationData {
  name: string;
  email: string;
}

export function useCreateOrganization() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setActivePartnerId } = useActivePartner();

  const createOrganization = async (data: CreateOrganizationData) => {
    if (!user?.id) {
      return { error: new Error('User not authenticated') };
    }

    setIsLoading(true);

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        return { error: new Error('User record not found') };
      }

      const partnerId = crypto.randomUUID();

      const { data: existingPartners } = await supabase
        .from('user_partners')
        .select('id')
        .eq('user_id', userData.id);

      const isFirstOrganization = !existingPartners || existingPartners.length === 0;

      // partner_type defaults to 'supplier' — capabilities are determined
      // dynamically by what entities exist (experiences, hotel_configs)
      const { error: partnerError } = await supabase
        .from('partners')
        .insert({
          id: partnerId,
          name: data.name,
          email: data.email,
          partner_type: 'supplier',
        });

      if (partnerError) {
        return { error: partnerError };
      }

      const { error: userPartnerError } = await supabase
        .from('user_partners')
        .insert({
          user_id: userData.id,
          partner_id: partnerId,
          role: 'owner',
          is_default: isFirstOrganization,
        });

      if (userPartnerError) {
        await supabase.from('partners').delete().eq('id', partnerId).catch(() => {});
        return { error: userPartnerError };
      }

      if (isFirstOrganization) {
        await supabase
          .from('users')
          .update({ partner_id: partnerId })
          .eq('id', userData.id);
      }

      await queryClient.invalidateQueries({ queryKey: ['userPartners'] });
      await queryClient.invalidateQueries({ queryKey: ['partnerCapabilities'] });

      setActivePartnerId(partnerId);
      navigate('/supplier/dashboard', { replace: true });

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createOrganization,
    isLoading,
  };
}
