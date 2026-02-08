import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useActivePartner } from './useActivePartner';

type BusinessType = 'supplier' | 'hotel';

interface CreateOrganizationData {
  businessType: BusinessType;
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
      // Get the user record from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        return { error: new Error('User record not found') };
      }

      // Determine partner_type
      const partnerType = data.businessType === 'hotel' ? 'hotel' : 'supplier';

      // Generate UUID client-side so we can reference it immediately
      // (avoids needing .select() which is blocked by SELECT RLS before user_partners exists)
      const partnerId = crypto.randomUUID();

      // Check if user already has organizations (before insert so we know is_default)
      const { data: existingPartners } = await supabase
        .from('user_partners')
        .select('id')
        .eq('user_id', userData.id);

      const isFirstOrganization = !existingPartners || existingPartners.length === 0;

      // Create the partner/organization
      const { error: partnerError } = await supabase
        .from('partners')
        .insert({
          id: partnerId,
          name: data.name,
          email: data.email,
          partner_type: partnerType,
        });

      if (partnerError) {
        return { error: partnerError };
      }

      // Create user_partner relationship (must happen right after partner insert
      // so the SELECT RLS policy via get_user_partner_ids() grants access)
      const { error: userPartnerError } = await supabase
        .from('user_partners')
        .insert({
          user_id: userData.id,
          partner_id: partnerId,
          role: 'owner',
          is_default: isFirstOrganization,
        });

      if (userPartnerError) {
        // Rollback: try to delete the partner (may fail if DELETE RLS requires user_partners,
        // but the orphaned partner is invisible to all users via SELECT RLS, so it's harmless)
        await supabase.from('partners').delete().eq('id', partnerId).catch(() => {});
        return { error: userPartnerError };
      }

      // If hotel, create hotel_config with auto-generated slug
      if (data.businessType === 'hotel') {
        // Generate slug from hotel name
        const baseSlug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        // Ensure slug is at least 3 characters
        if (baseSlug.length < 3) {
          // Rollback
          await supabase.from('user_partners').delete().eq('partner_id', partnerId);
          await supabase.from('partners').delete().eq('id', partnerId);
          return { error: new Error('Hotel name must be at least 3 characters to generate a valid URL') };
        }

        // Find a unique slug by appending numbers if needed
        let slug = baseSlug;
        let attempt = 0;
        let isUnique = false;

        while (!isUnique && attempt < 100) {
          const { data: existingConfig } = await supabase
            .from('hotel_configs')
            .select('id')
            .eq('slug', slug)
            .single();

          if (!existingConfig) {
            isUnique = true;
          } else {
            attempt++;
            slug = `${baseSlug}-${attempt}`;
          }
        }

        if (!isUnique) {
          // Rollback
          await supabase.from('user_partners').delete().eq('partner_id', partnerId);
          await supabase.from('partners').delete().eq('id', partnerId);
          return { error: new Error('Could not generate a unique URL. Please try a different hotel name.') };
        }

        const { error: hotelConfigError } = await supabase
          .from('hotel_configs')
          .insert({
            partner_id: partnerId,
            slug: slug,
            display_name: data.name, // Hotel name = display name
            is_active: true,
          });

        if (hotelConfigError) {
          // Rollback
          await supabase.from('user_partners').delete().eq('partner_id', partnerId);
          await supabase.from('partners').delete().eq('id', partnerId);
          return { error: hotelConfigError };
        }
      }

      // Backfill users.partner_id for backward compatibility (first org only)
      if (isFirstOrganization) {
        await supabase
          .from('users')
          .update({ partner_id: partnerId })
          .eq('id', userData.id);
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['userPartners'] });
      await queryClient.invalidateQueries({ queryKey: ['partnerCapabilities'] });

      // Set as active partner
      setActivePartnerId(partnerId);

      // Redirect based on business type
      if (data.businessType === 'supplier') {
        navigate('/supplier/dashboard', { replace: true });
      } else {
        navigate('/hotel/dashboard', { replace: true });
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
