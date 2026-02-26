import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from '@/hooks/useActivePartner';
import { getTodayLocal, isBookingEnded } from '@/lib/date-utils';

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
  rental_start_date: string | null;
  rental_end_date: string | null;
  isRental: boolean;
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

export interface AwaitingPaymentItem {
  id: string;
  guest_name: string;
  participants: number;
  total_cents: number;
  requested_date: string | null;
  requested_time: string | null;
  payment_deadline: string;
  rental_start_date: string | null;
  rental_end_date: string | null;
  isRental: boolean;
  experience: {
    id: string;
    title: string;
    currency: string;
  };
  session?: {
    id: string;
    session_date: string;
    start_time: string;
  } | null;
}

export interface BookingItem {
  id: string;
  reservationId: string;
  bookingStatus: string;
  amountCents: number;
  paidAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  stripeRefundId: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  participants: number;
  preferredLanguage: string | null;
  date: string;
  time: string | null;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  isRental: boolean;
  experience: {
    id: string;
    title: string;
    priceCents: number;
    durationMinutes?: number | null;
  };
}

// Legacy type kept for compatibility with other components
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

  const { data: experiences = [] } = useQuery({
    queryKey: ['partner-experiences', partnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from('experiences')
        .select('id, title, price_cents, currency, pricing_type, duration_minutes')
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

      return (reservations || []).map(r => {
        const exp = experienceMap.get(r.experience_id)!;
        return {
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
          rental_start_date: (r as any).rental_start_date || null,
          rental_end_date: (r as any).rental_end_date || null,
          isRental: (exp as any).pricing_type === 'per_day',
          experience: exp,
          session: r.experience_sessions,
        };
      }) as PendingRequest[];
    },
    enabled: experienceIds.length > 0,
  });

  // --- Tab 2 (Awaiting Payment) + Tab 3/4 (Bookings): Combined query ---
  const {
    data: reservationsData,
    isLoading: isLoadingReservations,
    refetch: refetchReservations,
  } = useQuery({
    queryKey: ['booking-mgmt-reservations', partnerId],
    queryFn: async () => {
      // Fetch all non-pending reservations (approved, declined, expired) with session data
      const { data: allReservations, error: resError } = await supabase
        .from('reservations')
        .select(`
          *,
          experience_sessions (
            id,
            session_date,
            start_time,
            session_status
          )
        `)
        .in('experience_id', experienceIds)
        .neq('reservation_status', 'pending');

      if (resError) throw resError;
      if (!allReservations || allReservations.length === 0) {
        return { awaitingPayment: [] as AwaitingPaymentItem[], bookingItems: [] as BookingItem[] };
      }

      // Fetch bookings for these reservations
      const resIds = allReservations.map(r => r.id);
      let bookings: any[] = [];
      if (resIds.length > 0) {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*')
          .in('reservation_id', resIds);
        bookings = bookingsData || [];
      }

      const bookingsMap = new Map(bookings.map(b => [b.reservation_id, b]));
      const experienceMap = new Map(experiences.map(e => [e.id, e]));

      const awaitingPayment: AwaitingPaymentItem[] = [];
      const bookingItems: BookingItem[] = [];

      for (const r of allReservations) {
        const exp = experienceMap.get(r.experience_id);
        if (!exp) continue;

        const isRental = (exp as any).pricing_type === 'per_day';
        const booking = bookingsMap.get(r.id);
        const session = r.experience_sessions;

        // Only show request-based awaiting-payment (supplier accepted, guest hasn't paid yet).
        // Session-based bookings stay invisible to the supplier until payment confirms.
        if (r.reservation_status === 'approved' && !booking && r.is_request) {
          awaitingPayment.push({
            id: r.id,
            guest_name: r.guest_name,
            participants: r.participants,
            total_cents: r.total_cents,
            requested_date: r.requested_date,
            requested_time: r.requested_time || null,
            payment_deadline: r.payment_deadline || '',
            rental_start_date: (r as any).rental_start_date || null,
            rental_end_date: (r as any).rental_end_date || null,
            isRental,
            experience: { id: exp.id, title: exp.title, currency: exp.currency },
            session,
          });
        } else if (booking) {
          const date = session?.session_date
            || (r as any).rental_start_date
            || r.requested_date
            || '';
          const time = session?.start_time || null;

          bookingItems.push({
            id: booking.id,
            reservationId: r.id,
            bookingStatus: booking.booking_status,
            amountCents: booking.amount_cents,
            paidAt: booking.paid_at,
            completedAt: booking.completed_at,
            cancelledAt: booking.cancelled_at,
            stripeRefundId: booking.stripe_refund_id,
            guestName: r.guest_name,
            guestEmail: r.guest_email,
            guestPhone: r.guest_phone,
            participants: r.participants,
            preferredLanguage: r.preferred_language || null,
            date,
            time,
            rentalStartDate: (r as any).rental_start_date || null,
            rentalEndDate: (r as any).rental_end_date || null,
            isRental,
            experience: {
              id: exp.id,
              title: exp.title,
              priceCents: exp.price_cents,
              durationMinutes: (exp as { duration_minutes?: number }).duration_minutes ?? null,
            },
          });
        }
      }

      // Sort awaiting payment by payment deadline (soonest first)
      awaitingPayment.sort((a, b) => a.payment_deadline.localeCompare(b.payment_deadline));

      return { awaitingPayment, bookingItems };
    },
    enabled: experienceIds.length > 0,
  });

  const awaitingPayment = reservationsData?.awaitingPayment ?? [];
  const allBookingItems = reservationsData?.bookingItems ?? [];

  // Split bookings into upcoming / past (past = after session/rental end, not just after midnight)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  const upcomingBookings = useMemo(
    () =>
      allBookingItems
        .filter((b) => b.bookingStatus === 'confirmed' && !isBookingEnded(b, now))
        .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')),
    [allBookingItems, now]
  );

  const pastBookings = useMemo(
    () =>
      allBookingItems
        .filter((b) => b.bookingStatus !== 'confirmed' || isBookingEnded(b, now))
        .sort((a, b) => b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || '')),
    [allBookingItems, now]
  );

  // --- Mutations ---

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
      queryClient.invalidateQueries({ queryKey: ['booking-mgmt-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-requests'] });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ['booking-mgmt-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-requests'] });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ['booking-mgmt-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const cancelBooking = useMutation({
    mutationFn: async (bookingId: string) => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) throw new Error('Not authenticated');

      const response = await fetch(`${WIDGET_BASE_URL}/api/dashboard/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to cancel booking');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-mgmt-reservations'] });
    },
  });

  const completeBooking = useMutation({
    mutationFn: async (bookingId: string) => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) throw new Error('Not authenticated');

      const response = await fetch(`${WIDGET_BASE_URL}/api/dashboard/bookings/${bookingId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
      });

      let result: any;
      try { result = await response.json(); } catch { result = {}; }
      if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-mgmt-reservations'] });
    },
  });

  const reportNoExperience = useMutation({
    mutationFn: async (bookingId: string) => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) throw new Error('Not authenticated');

      const response = await fetch(`${WIDGET_BASE_URL}/api/dashboard/bookings/${bookingId}/no-experience`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
      });

      let result: any;
      try { result = await response.json(); } catch { result = {}; }
      if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-mgmt-reservations'] });
    },
  });

  const refetchAll = async () => {
    await Promise.all([refetchPending(), refetchReservations()]);
  };

  return {
    pendingRequests,
    awaitingPayment,
    upcomingBookings,
    pastBookings,
    experiences,
    isLoading: isLoadingPending || isLoadingReservations,
    isLoadingPending,
    isLoadingReservations,
    acceptRequest,
    declineRequest,
    cancelSession,
    cancelBooking,
    completeBooking,
    reportNoExperience,
    refetchAll,
    pendingCount: pendingRequests.length,
    awaitingPaymentCount: awaitingPayment.length,
  };
}
