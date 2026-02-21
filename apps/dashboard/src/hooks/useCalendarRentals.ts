import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from '@/hooks/useActivePartner';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export interface CalendarRental {
  bookingId: string;
  reservationId: string;
  guestName: string;
  participants: number;
  amountCents: number;
  bookingStatus: string;
  rentalStartDate: string;
  rentalEndDate: string;
  experience: {
    id: string;
    title: string;
  };
}

export function useCalendarRentals(currentMonth: Date) {
  const { activePartnerId } = useActivePartner();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const rangeStart = format(startOfWeek(monthStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const rangeEnd = format(endOfWeek(monthEnd, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data: rentals = [], isLoading, refetch } = useQuery({
    queryKey: ['calendar-rentals', activePartnerId, rangeStart, rangeEnd],
    queryFn: async () => {
      if (!activePartnerId) return [];

      // Get per_day experiences for this partner
      const { data: experiences } = await supabase
        .from('experiences')
        .select('id, title')
        .eq('partner_id', activePartnerId)
        .eq('pricing_type', 'per_day');

      if (!experiences || experiences.length === 0) return [];

      const experienceIds = experiences.map(e => e.id);
      const experienceMap = new Map(experiences.map(e => [e.id, e]));

      // Fetch reservations whose rental range overlaps the visible calendar range
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .in('experience_id', experienceIds)
        .eq('reservation_status', 'approved')
        .not('rental_start_date', 'is', null)
        .not('rental_end_date', 'is', null)
        .lte('rental_start_date', rangeEnd)
        .gte('rental_end_date', rangeStart);

      if (resError) throw resError;
      if (!reservations || reservations.length === 0) return [];

      // Fetch bookings for these reservations (only confirmed/completed)
      const resIds = reservations.map(r => r.id);
      const { data: bookings, error: bookError } = await supabase
        .from('bookings')
        .select('*')
        .in('reservation_id', resIds)
        .in('booking_status', ['confirmed', 'completed']);

      if (bookError) throw bookError;

      const bookingsMap = new Map((bookings || []).map(b => [b.reservation_id, b]));

      const result: CalendarRental[] = [];

      for (const r of reservations) {
        const booking = bookingsMap.get(r.id);
        if (!booking) continue;

        const exp = experienceMap.get(r.experience_id);
        if (!exp) continue;

        result.push({
          bookingId: booking.id,
          reservationId: r.id,
          guestName: r.guest_name,
          participants: r.participants,
          amountCents: booking.amount_cents,
          bookingStatus: booking.booking_status,
          rentalStartDate: (r as any).rental_start_date,
          rentalEndDate: (r as any).rental_end_date,
          experience: { id: exp.id, title: exp.title },
        });
      }

      return result;
    },
    enabled: !!activePartnerId,
  });

  return {
    rentals,
    isLoading,
    refetch,
  };
}
