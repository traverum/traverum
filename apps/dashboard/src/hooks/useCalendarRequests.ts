import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from '@/hooks/useActivePartner';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, addDays } from 'date-fns';

export interface CalendarRequest {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  participants: number;
  total_cents: number;
  requested_date: string;
  requested_time: string | null;
  time_preference: string | null;
  response_deadline: string;
  reservation_status: string;
  created_at: string;
  rental_start_date: string | null;
  rental_end_date: string | null;
  isRental: boolean;
  experience: {
    id: string;
    title: string;
    slug: string;
    currency: string;
  };
}

export function useCalendarRequests(currentMonth: Date) {
  const { activePartnerId } = useActivePartner();

  // Calculate date range for the visible calendar (includes overflow days from prev/next months)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const rangeStart = format(subDays(calendarStart, 1), 'yyyy-MM-dd');
  const rangeEnd = format(addDays(calendarEnd, 1), 'yyyy-MM-dd');

  const { data: requestsByDate = {}, isLoading, refetch } = useQuery({
    queryKey: ['calendar-requests', activePartnerId, rangeStart, rangeEnd],
    queryFn: async () => {
      if (!activePartnerId) return {};

      // Get all experiences for this partner
      const { data: experiences } = await supabase
        .from('experiences')
        .select('id, title, slug, currency, pricing_type')
        .eq('partner_id', activePartnerId);

      if (!experiences || experiences.length === 0) return {};

      const experienceIds = experiences.map(e => e.id);
      const experienceMap = new Map(experiences.map(e => [e.id, e]));

      // Get pending reservations within the date range
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*')
        .in('experience_id', experienceIds)
        .eq('reservation_status', 'pending')
        .eq('is_request', true)
        .not('requested_date', 'is', null)
        .gte('requested_date', rangeStart)
        .lte('requested_date', rangeEnd)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const grouped: Record<string, CalendarRequest[]> = {};

      (reservations || []).forEach(reservation => {
        const dateKey = reservation.requested_date as string;
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        const exp = experienceMap.get(reservation.experience_id);
        if (exp) {
          grouped[dateKey].push({
            id: reservation.id,
            guest_name: reservation.guest_name,
            guest_email: reservation.guest_email,
            guest_phone: reservation.guest_phone,
            participants: reservation.participants,
            total_cents: reservation.total_cents,
            requested_date: dateKey,
            requested_time: reservation.requested_time || null,
            time_preference: reservation.time_preference || null,
            response_deadline: reservation.response_deadline,
            reservation_status: reservation.reservation_status,
            created_at: reservation.created_at || '',
            rental_start_date: (reservation as any).rental_start_date || null,
            rental_end_date: (reservation as any).rental_end_date || null,
            isRental: exp.pricing_type === 'per_day',
            experience: {
              id: exp.id,
              title: exp.title,
              slug: exp.slug || '',
              currency: exp.currency || 'EUR',
            },
          });
        }
      });

      return grouped;
    },
    enabled: !!activePartnerId,
  });

  return {
    requestsByDate,
    isLoading,
    refetch,
  };
}
