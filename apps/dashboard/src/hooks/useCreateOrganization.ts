import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useActivePartner } from './useActivePartner';

type BusinessType = 'supplier' | 'hotel' | 'hybrid';

interface CreateOrganizationData {
  businessType: BusinessType;
  name: string;
  email: string;
  city?: string;
  country?: string;
  businessEntityType?: string;
  taxId?: string;
  hotelName?: string;
  slug?: string;
  displayName?: string;
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
      // First, get the user record from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        return { error: new Error('User record not found') };
      }

      // Determine partner_type
      let partnerType = 'supplier';
      if (data.businessType === 'hotel') {
        partnerType = 'hotel';
      } else if (data.businessType === 'hybrid') {
        partnerType = 'hybrid';
      }

      // Create the partner/organization
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .insert({
          name: data.name,
          email: data.email,
          partner_type: partnerType,
          city: data.city || null,
          country: data.country || null,
        })
        .select()
        .single();

      if (partnerError || !partner) {
        return { error: partnerError || new Error('Failed to create organization') };
      }

      // Check if user already has organizations
      const { data: existingPartners } = await supabase
        .from('user_partners')
        .select('id')
        .eq('user_id', userData.id);

      const isFirstOrganization = !existingPartners || existingPartners.length === 0;

      // Create user_partner relationship
      const { error: userPartnerError } = await supabase
        .from('user_partners')
        .insert({
          user_id: userData.id,
          partner_id: partner.id,
          role: 'owner',
          is_default: isFirstOrganization, // Only first organization is default
        });

      if (userPartnerError) {
        // Rollback: delete the partner if user_partner creation fails
        await supabase.from('partners').delete().eq('id', partner.id);
        return { error: userPartnerError };
      }

      // If hotel or hybrid, create hotel_config
      if (data.businessType === 'hotel' || data.businessType === 'hybrid') {
        if (!data.slug || !data.displayName) {
          return { error: new Error('Hotel slug and display name are required') };
        }

        // Check if slug already exists
        const { data: existingConfig } = await supabase
          .from('hotel_configs')
          .select('id')
          .eq('slug', data.slug)
          .single();

        if (existingConfig) {
          // Rollback: delete partner and user_partner
          await supabase.from('user_partners').delete().eq('partner_id', partner.id);
          await supabase.from('partners').delete().eq('id', partner.id);
          return { error: new Error('This slug is already taken. Please choose another.') };
        }

        const { error: hotelConfigError } = await supabase
          .from('hotel_configs')
          .insert({
            partner_id: partner.id,
            slug: data.slug,
            display_name: data.displayName,
            is_active: true,
          });

        if (hotelConfigError) {
          // Rollback: delete partner and user_partner
          await supabase.from('user_partners').delete().eq('partner_id', partner.id);
          await supabase.from('partners').delete().eq('id', partner.id);
          return { error: hotelConfigError };
        }
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['userPartners'] });
      await queryClient.invalidateQueries({ queryKey: ['partnerCapabilities'] });

      // Set as active partner
      setActivePartnerId(partner.id);

      // Redirect based on business type
      if (data.businessType === 'supplier' || data.businessType === 'hybrid') {
        navigate('/supplier/dashboard', { replace: true });
      } else if (data.businessType === 'hotel') {
        navigate('/hotel/selection', { replace: true });
      }

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
