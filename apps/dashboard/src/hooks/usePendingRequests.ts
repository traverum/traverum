import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from '@/hooks/useActivePartner';

export interface PendingRequest {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  participants: number;
  total_cents: number;
  requested_date: string | null;
  requested_time: string | null;
  time_preference: string | null;
  session_id: string | null;
  response_deadline: string;
  reservation_status: string;
  is_request: boolean;
  preferred_language: string | null;
  created_at: string;
  experience: {
    id: string;
    title: string;
    price_cents: number;
  };
  session?: {
    id: string;
    session_date: string;
    start_time: string;
  } | null;
}

export function usePendingRequests() {
  const { activePartnerId } = useActivePartner();

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['pending-requests', activePartnerId],
    queryFn: async () => {
      if (!activePartnerId) return [];

      // Get all experiences for this partner
      const { data: experiences } = await supabase
        .from('experiences')
        .select('id, title, price_cents')
        .eq('partner_id', activePartnerId);

      if (!experiences || experiences.length === 0) return [];

      const experienceIds = experiences.map(e => e.id);

      // Get pending reservations
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          *,
          experience_sessions (
            id,
            session_date,
            start_time
          )
        `)
        .in('experience_id', experienceIds)
        .eq('reservation_status', 'pending')
        .order('response_deadline', { ascending: true });

      if (error) throw error;

      // Map experiences to reservations
      const experienceMap = new Map(experiences.map(e => [e.id, e]));
      
      return (reservations || []).map(r => ({
        id: r.id,
        guest_name: r.guest_name,
        guest_email: r.guest_email,
        guest_phone: r.guest_phone,
        participants: r.participants,
        total_cents: r.total_cents,
        requested_date: r.requested_date,
        requested_time: r.requested_time || null,
        time_preference: r.time_preference || null,
        session_id: r.session_id,
        response_deadline: r.response_deadline,
        reservation_status: r.reservation_status,
        is_request: r.is_request ?? false,
        preferred_language: r.preferred_language || null,
        created_at: r.created_at || '',
        experience: experienceMap.get(r.experience_id)!,
        session: r.experience_sessions,
      })) as PendingRequest[];
    },
    enabled: !!activePartnerId,
  });

  return {
    requests,
    isLoading,
    refetch,
    count: requests.length,
  };
}
