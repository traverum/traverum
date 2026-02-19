import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getTodayLocal } from '@/lib/date-utils';
import { useActivePartner } from './useActivePartner';

export interface Partner {
  id: string;
  name: string;
  email: string;
  partner_type: string;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
  city: string | null;
  country: string | null;
}

export interface Experience {
  id: string;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  price_cents: number;
  currency: string;
  duration_minutes: number;
  max_participants: number;
  meeting_point: string | null;
  allows_requests: boolean | null;
  experience_status: string;
  created_at: string | null;
  // Pricing fields
  pricing_type: 'per_person' | 'flat_rate' | 'base_plus_extra' | 'per_day';
  base_price_cents: number;
  included_participants: number;
  extra_person_cents: number;
  min_participants: number;
  // Cancellation policy fields
  cancellation_policy: 'flexible' | 'moderate' | 'strict' | 'non_refundable';
  force_majeure_refund: boolean;
}

export interface Distribution {
  id: string;
  hotel_id: string;
  experience_id: string;
  commission_supplier: number;
  commission_hotel: number;
  commission_platform: number;
  is_active: boolean | null;
  hotel?: Partner;
}

export interface Booking {
  id: string;
  booking_status: string;
  amount_cents: number;
  supplier_amount_cents: number;
  paid_at: string;
  completed_at: string | null;
  reservation?: {
    guest_name: string;
    guest_email: string;
    participants: number;
    experience?: {
      title: string;
    };
  };
}

export function useSupplierData() {
  // Get active partner from context
  const { activePartner } = useActivePartner();
  const partnerId = activePartner?.partner_id || null;

  // Get partner details
  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();
      
      if (error) throw error;
      return data as Partner;
    },
    enabled: !!partnerId,
  });

  // Get experiences with cover images from media table
  const { data: experiences = [], isLoading: experiencesLoading, refetch: refetchExperiences } = useQuery({
    queryKey: ['experiences', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch cover images from media table
      const experienceIds = data.map(e => e.id);
      const { data: coverImages } = await supabase
        .from('media')
        .select('experience_id, url')
        .in('experience_id', experienceIds)
        .eq('sort_order', 0);
      
      // Merge cover URLs into experiences
      return data.map(exp => ({
        ...exp,
        cover_url: coverImages?.find(m => m.experience_id === exp.id)?.url || exp.image_url
      })) as (Experience & { cover_url?: string })[];
    },
    enabled: !!partnerId,
  });

  // Get distributions (hotel partnerships)
  const { data: distributions = [], isLoading: distributionsLoading } = useQuery({
    queryKey: ['distributions', partnerId],
    queryFn: async () => {
      if (!partnerId || experiences.length === 0) return [];
      
      const experienceIds = experiences.map(e => e.id);
      
      const { data, error } = await supabase
        .from('distributions')
        .select(`
          *,
          hotel:partners!distributions_hotel_fk(*)
        `)
        .in('experience_id', experienceIds)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as Distribution[];
    },
    enabled: !!partnerId && experiences.length > 0,
  });

  // Get recent bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', partnerId],
    queryFn: async () => {
      if (!partnerId || experiences.length === 0) return [];
      
      const experienceIds = experiences.map(e => e.id);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          reservation:reservations!bookings_reservation_fk(
            guest_name,
            guest_email,
            participants,
            experience:experiences!reservations_experience_fk(title)
          )
        `)
        .order('paid_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Filter to only include bookings for this supplier's experiences
      const filteredBookings = data?.filter(booking => 
        booking.reservation?.experience && 
        experienceIds.includes(booking.reservation.experience as unknown as string)
      ) || [];
      
      return filteredBookings as Booking[];
    },
    enabled: !!partnerId && experiences.length > 0,
  });

  // Get upcoming sessions count (key includes today so it refetches at midnight local)
  const { data: upcomingSessionsCount = 0 } = useQuery({
    queryKey: ['upcomingSessionsCount', partnerId, getTodayLocal()],
    queryFn: async () => {
      if (!partnerId || experiences.length === 0) return 0;
      
      const experienceIds = experiences.map(e => e.id);
      const today = getTodayLocal();

      const { count, error } = await supabase
        .from('experience_sessions')
        .select('*', { count: 'exact', head: true })
        .in('experience_id', experienceIds)
        .gte('session_date', today)
        .neq('session_status', 'cancelled');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!partnerId && experiences.length > 0,
  });

  // Get pending requests count
  const { data: pendingRequestsCount = 0 } = useQuery({
    queryKey: ['pendingRequestsCount', partnerId],
    queryFn: async () => {
      if (!partnerId || experiences.length === 0) return 0;
      
      const experienceIds = experiences.map(e => e.id);
      
      const { count, error } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .in('experience_id', experienceIds)
        .eq('reservation_status', 'pending');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!partnerId && experiences.length > 0,
  });

  const isLoading = partnerLoading || experiencesLoading;

  // Determine supplier state
  const hasExperiences = experiences.length > 0;
  const hasStripe = partner?.stripe_onboarding_complete === true;
  const hasDistributions = distributions.length > 0;
  const isLive = hasExperiences && hasStripe && hasDistributions;

  return {
    partner,
    experiences,
    distributions,
    bookings,
    upcomingSessionsCount,
    pendingRequestsCount,
    isLoading,
    hasExperiences,
    hasStripe,
    hasDistributions,
    isLive,
    refetchExperiences,
  };
}
