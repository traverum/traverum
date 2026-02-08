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
  session_id: string | null;
  response_deadline: string;
  reservation_status: string;
  is_request: boolean;
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
      
      return (reservations || []).map(reservation => ({
        ...reservation,
        experience: experienceMap.get(reservation.experience_id)!,
        session: reservation.experience_sessions,
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
