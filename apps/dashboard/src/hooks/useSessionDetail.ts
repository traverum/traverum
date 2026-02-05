import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Session, Experience } from './useExperienceSessions';

interface Guest {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  participants: number;
  total_cents: number;
  reservation_status: string;
  created_at: string;
  booking: {
    id: string;
    booking_status: string;
    amount_cents: number;
    paid_at: string;
  } | null;
}

interface SessionUpdate {
  spots_total?: number;
  spots_available?: number;
  price_override_cents?: number | null;
  price_note?: string | null;
  session_status?: string;
}

export function useSessionDetail(sessionId: string) {
  const queryClient = useQueryClient();

  // Fetch session
  const { 
    data: session, 
    isLoading: isLoadingSession,
    error: sessionError 
  } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experience_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data as Session;
    },
    enabled: !!sessionId,
  });

  // Fetch experience
  const { 
    data: experience, 
    isLoading: isLoadingExperience 
  } = useQuery({
    queryKey: ['experience', session?.experience_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('id', session!.experience_id)
        .single();

      if (error) throw error;
      return data as Experience;
    },
    enabled: !!session?.experience_id,
  });

  // Fetch guests (reservations with bookings) for this session
  const { 
    data: guests = [], 
    isLoading: isLoadingGuests 
  } = useQuery({
    queryKey: ['session-guests', sessionId],
    queryFn: async () => {
      // First get reservations for this session
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (reservationsError) throw reservationsError;
      if (!reservations || reservations.length === 0) return [];

      // Then get bookings for these reservations
      const reservationIds = reservations.map(r => r.id);
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .in('reservation_id', reservationIds);

      if (bookingsError) throw bookingsError;

      // Map bookings to reservations
      const bookingsMap = new Map(bookings?.map(b => [b.reservation_id, b]) || []);

      return reservations.map(r => ({
        id: r.id,
        guest_name: r.guest_name,
        guest_email: r.guest_email,
        guest_phone: r.guest_phone,
        participants: r.participants,
        total_cents: r.total_cents,
        reservation_status: r.reservation_status,
        created_at: r.created_at,
        booking: bookingsMap.get(r.id) || null,
      })) as Guest[];
    },
    enabled: !!sessionId,
  });

  // Update session mutation
  const updateSession = useMutation({
    mutationFn: async (updates: SessionUpdate) => {
      const { data, error } = await supabase
        .from('experience_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions'] });
    },
  });

  // Delete session mutation
  const deleteSession = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('experience_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions'] });
    },
  });

  // Cancel session mutation (updates status)
  const cancelSession = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('experience_sessions')
        .update({ session_status: 'cancelled' })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions'] });
    },
  });

  const bookingsCount = session ? session.spots_total - session.spots_available : 0;

  return {
    session,
    experience,
    guests,
    bookingsCount,
    isLoading: isLoadingSession || isLoadingExperience,
    isLoadingGuests,
    error: sessionError,
    updateSession,
    deleteSession,
    cancelSession,
  };
}

export type { Guest, SessionUpdate };
