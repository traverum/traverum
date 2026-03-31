import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSuperadmin } from './useSuperadmin';

export interface UserPartner {
  id: string;
  user_id: string;
  partner_id: string;
  role: 'owner' | 'admin' | 'member' | 'receptionist' | 'superadmin';
  is_default: boolean;
  created_at: string;
  partner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    partner_type: string;
    stripe_account_id: string | null;
    stripe_onboarding_complete: boolean | null;
    city: string | null;
    country: string | null;
  };
}

export interface PartnerCapabilities {
  isSupplier: boolean;
  isHotel: boolean;
  experienceCount: number;
  hasHotelConfig: boolean;
}

export function useUserPartners() {
  const { user } = useAuth();
  const { isSuperadmin, isLoading: superadminLoading } = useSuperadmin();

  const {
    data: userPartners = [],
    isLoading: partnersLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['userPartners', user?.id, isSuperadmin],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user:', userError);
        return [];
      }

      // Superadmins see all partners directly
      if (isSuperadmin) {
        const { data: allPartners, error: partnerError } = await supabase
          .from('partners')
          .select('id, name, email, phone, partner_type, stripe_account_id, stripe_onboarding_complete, city, country')
          .order('name');

        if (partnerError) {
          console.error('Error fetching all partners:', partnerError);
          throw partnerError;
        }

        return (allPartners || []).map((p: any) => ({
          id: `sa-${p.id}`,
          user_id: userData.id,
          partner_id: p.id,
          role: 'superadmin' as const,
          is_default: false,
          created_at: '',
          partner: p,
        })) as UserPartner[];
      }

      const { data, error } = await supabase
        .from('user_partners')
        .select(`
          id,
          user_id,
          partner_id,
          role,
          is_default,
          created_at,
          partner:partners(
            id,
            name,
            email,
            phone,
            partner_type,
            stripe_account_id,
            stripe_onboarding_complete,
            city,
            country
          )
        `)
        .eq('user_id', userData.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching user partners:', error);
        throw error;
      }

      return (data || []) as UserPartner[];
    },
    enabled: !!user?.id && !superadminLoading,
  });

  const isLoading = partnersLoading || superadminLoading;
  const defaultPartner = userPartners.find(up => up.is_default) || userPartners[0] || null;
  const hasMultiplePartners = userPartners.length > 1;

  return {
    userPartners,
    defaultPartner,
    hasMultiplePartners,
    isLoading,
    isSuperadmin,
    error,
    refetch,
  };
}

// Hook to get capabilities for a specific partner
export function usePartnerCapabilities(partnerId: string | null) {
  return useQuery({
    queryKey: ['partnerCapabilities', partnerId],
    queryFn: async (): Promise<PartnerCapabilities> => {
      if (!partnerId) {
        return { isSupplier: false, isHotel: false, experienceCount: 0, hasHotelConfig: false };
      }

      // Check for experiences (supplier capability)
      const { count: experienceCount } = await supabase
        .from('experiences')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId);

      // Check for hotel_config (hotel capability)
      // Use count instead of maybeSingle — multiple hotel_configs are now possible
      const { count: hotelConfigCount } = await supabase
        .from('hotel_configs')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId);

      // Also check partner_type for backwards compatibility
      const { data: partner } = await supabase
        .from('partners')
        .select('partner_type')
        .eq('id', partnerId)
        .single();

      const hasExperiences = (experienceCount || 0) > 0;
      const hasHotelConfig = (hotelConfigCount || 0) > 0;
      
      // A partner is a supplier if they have experiences OR partner_type is 'supplier'
      const isSupplier = hasExperiences || partner?.partner_type === 'supplier';
      
      // A partner is a hotel if they have hotel_config OR partner_type is 'hotel'
      const isHotel = hasHotelConfig || partner?.partner_type === 'hotel';

      return {
        isSupplier,
        isHotel,
        experienceCount: experienceCount || 0,
        hasHotelConfig,
      };
    },
    enabled: !!partnerId,
  });
}
