import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from '@/hooks/useActivePartner';
import { getTodayLocal } from '@/lib/date-utils';

export interface UpcomingRental {
  bookingId: string;
  reservationId: string;
  guestName: string;
  participants: number;
  rentalStartDate: string;
  rentalEndDate: string;
  experience: {
    id: string;
    title: string;
  };
}

export function useUpcomingRentals() {
  const { activePartnerId } = useActivePartner();
  const today = getTodayLocal();

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ['upcoming-rentals', activePartnerId, today],
    queryFn: async () => {
      if (!activePartnerId) return [];

      const { data: experiences } = await supabase
        .from('experiences')
        .select('id, title')
        .eq('partner_id', activePartnerId)
        .eq('pricing_type', 'per_day');

      if (!experiences || experiences.length === 0) return [];

      const experienceIds = experiences.map(e => e.id);
      const experienceMap = new Map(experiences.map(e => [e.id, e]));

      // Rentals that haven't ended yet (end date >= today)
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .in('experience_id', experienceIds)
        .eq('reservation_status', 'approved')
        .not('rental_start_date', 'is', null)
        .not('rental_end_date', 'is', null)
        .gte('rental_end_date', today)
        .order('rental_start_date', { ascending: true });

      if (resError) throw resError;
      if (!reservations || reservations.length === 0) return [];

      const resIds = reservations.map(r => r.id);
      const { data: bookings, error: bookError } = await supabase
        .from('bookings')
        .select('*')
        .in('reservation_id', resIds)
        .in('booking_status', ['confirmed', 'completed']);

      if (bookError) throw bookError;

      const bookingsMap = new Map((bookings || []).map(b => [b.reservation_id, b]));

      const result: UpcomingRental[] = [];

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
          rentalStartDate: (r as any).rental_start_date,
          rentalEndDate: (r as any).rental_end_date,
          experience: { id: exp.id, title: exp.title },
        });
      }

      return result;
    },
    enabled: !!activePartnerId,
  });

  return { rentals, isLoading };
}
