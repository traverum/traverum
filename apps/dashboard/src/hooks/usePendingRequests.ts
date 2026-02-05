import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['pending-requests', user?.id],
    queryFn: async () => {
      // First get the user's partner_id
      const { data: userData } = await supabase
        .from('users')
        .select('partner_id')
        .eq('auth_id', user!.id)
        .single();

      if (!userData?.partner_id) return [];

      // Get all experiences for this partner
      const { data: experiences } = await supabase
        .from('experiences')
        .select('id, title, price_cents')
        .eq('partner_id', userData.partner_id);

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
    enabled: !!user,
  });

  return {
    requests,
    isLoading,
    refetch,
    count: requests.length,
  };
}
