import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from '@/hooks/useActivePartner';
import { isSessionUpcoming } from '@/lib/date-utils';

const WIDGET_BASE_URL = import.meta.env.VITE_WIDGET_URL || 'https://book.traverum.com';

// --- Types ---

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
    currency: string;
  };
  session?: {
    id: string;
    session_date: string;
    start_time: string;
  } | null;
}

export interface SessionGuest {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  participants: number;
  total_cents: number;
  reservation_status: string;
  preferred_language: string | null;
  booking: {
    id: string;
    booking_status: string;
    amount_cents: number;
    paid_at: string;
    completed_at: string | null;
    cancelled_at: string | null;
    stripe_refund_id: string | null;
  } | null;
}

export interface SessionWithGuests {
  id: string;
  experience_id: string;
  session_date: string;
  start_time: string;
  session_status: string;
  experience: {
    id: string;
    title: string;
    price_cents: number;
  };
  guests: SessionGuest[];
  bookingsCount: number;
}

// --- Hook ---

export function useBookingManagement() {
  const { activePartnerId: partnerId } = useActivePartner();
  const queryClient = useQueryClient();

  // Get experiences for this partner
  const { data: experiences = [] } = useQuery({
    queryKey: ['partner-experiences', partnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from('experiences')
        .select('id, title, price_cents, currency')
        .eq('partner_id', partnerId!);
      return data || [];
    },
    enabled: !!partnerId,
  });

  const experienceIds = experiences.map(e => e.id);

  // --- Tab 1: Pending Requests ---
  const {
    data: pendingRequests = [],
    isLoading: isLoadingPending,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['booking-mgmt-pending', partnerId],
    queryFn: async () => {
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
    enabled: experienceIds.length > 0,
  });

  // --- Tab 2 & 3: Sessions with guests ---
  const {
    data: sessionsWithGuests = [],
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['booking-mgmt-sessions', partnerId],
    queryFn: async () => {
      // Get all sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('experience_sessions')
        .select('*')
        .in('experience_id', experienceIds)
        .order('session_date', { ascending: false })
        .order('start_time', { ascending: true });

      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) return [];

      const sessionIds = sessions.map(s => s.id);

      // Get reservations for these sessions
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .in('session_id', sessionIds);

      if (resError) throw resError;

      // Get bookings for these reservations
      const reservationIds = (reservations || []).map(r => r.id);
      let bookings: any[] = [];
      if (reservationIds.length > 0) {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*')
          .in('reservation_id', reservationIds);
        bookings = bookingsData || [];
      }

      const bookingsMap = new Map(bookings.map(b => [b.reservation_id, b]));
      const experienceMap = new Map(experiences.map(e => [e.id, e]));

      // Group reservations by session
      const resBySession = new Map<string, any[]>();
      (reservations || []).forEach(r => {
        if (!r.session_id) return;
        const existing = resBySession.get(r.session_id) || [];
        existing.push(r);
        resBySession.set(r.session_id, existing);
      });

      return sessions.map(session => {
        const sessionReservations = resBySession.get(session.id) || [];
        const guests: SessionGuest[] = sessionReservations.map(r => ({
          id: r.id,
          guest_name: r.guest_name,
          guest_email: r.guest_email,
          guest_phone: r.guest_phone,
          participants: r.participants,
          total_cents: r.total_cents,
          reservation_status: r.reservation_status,
          preferred_language: r.preferred_language || null,
          booking: bookingsMap.get(r.id) ? {
            id: bookingsMap.get(r.id).id,
            booking_status: bookingsMap.get(r.id).booking_status,
            amount_cents: bookingsMap.get(r.id).amount_cents,
            paid_at: bookingsMap.get(r.id).paid_at,
            completed_at: bookingsMap.get(r.id).completed_at,
            cancelled_at: bookingsMap.get(r.id).cancelled_at,
            stripe_refund_id: bookingsMap.get(r.id).stripe_refund_id,
          } : null,
        }));

        return {
          id: session.id,
          experience_id: session.experience_id,
          session_date: session.session_date,
          start_time: session.start_time,
          session_status: session.session_status,
          experience: experienceMap.get(session.experience_id)!,
          guests,
          bookingsCount: guests.filter(g => g.booking).length,
        } as SessionWithGuests;
      });
    },
    enabled: experienceIds.length > 0,
  });

  // Split sessions into upcoming / past (using shared date utility for local timezone)
  const upcomingSessions = sessionsWithGuests
    .filter(s => isSessionUpcoming(s.session_date, s.start_time))
    .sort((a, b) => a.session_date.localeCompare(b.session_date) || a.start_time.localeCompare(b.start_time));
  
  const pastSessions = sessionsWithGuests
    .filter(s => !isSessionUpcoming(s.session_date, s.start_time))
    .sort((a, b) => b.session_date.localeCompare(a.session_date) || b.start_time.localeCompare(a.start_time));

  // --- Mutations ---

  // Accept a pending request via widget API (accepts as-is using guest's requested date/time)
  const acceptRequest = useMutation({
    mutationFn: async (reservationId: string) => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) throw new Error('Not authenticated');

      const response = await fetch(`${WIDGET_BASE_URL}/api/dashboard/requests/${reservationId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to accept request');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-mgmt-pending'] });
      queryClient.invalidateQueries({ queryKey: ['booking-mgmt-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-requests'] });
    },
  });

  // Decline a pending request via widget API
  const declineRequest = useMutation({
    mutationFn: async ({ reservationId, message }: { reservationId: string; message?: string }) => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) throw new Error('Not authenticated');

      const response = await fetch(`${WIDGET_BASE_URL}/api/dashboard/requests/${reservationId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({ message }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to decline request');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-mgmt-pending'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-requests'] });
    },
  });

  // Cancel a session
  const cancelSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('experience_sessions')
        .update({
          session_status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      // TODO: Trigger refunds + emails for all confirmed bookings in this session
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-mgmt-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const refetchAll = async () => {
    await Promise.all([refetchPending(), refetchSessions()]);
  };

  return {
    // Data
    pendingRequests,
    upcomingSessions,
    pastSessions,
    experiences,
    // Loading states
    isLoading: isLoadingPending || isLoadingSessions,
    isLoadingPending,
    isLoadingSessions,
    // Mutations
    acceptRequest,
    declineRequest,
    cancelSession,
    // Refetch
    refetchAll,
    pendingCount: pendingRequests.length,
  };
}
