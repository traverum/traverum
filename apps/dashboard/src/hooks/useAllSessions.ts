import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from '@/hooks/useActivePartner';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface SessionWithExperience {
  id: string;
  experience_id: string;
  session_date: string;
  start_time: string;
  spots_available: number;
  spots_total: number;
  session_status: string;
  price_override_cents: number | null;
  price_note: string | null;
  experience: {
    id: string;
    title: string;
    price_cents: number;
    duration_minutes: number;
  };
}

interface UseAllSessionsOptions {
  currentMonth: Date;
  experienceId?: string | null;
}

export function useAllSessions({ currentMonth, experienceId }: UseAllSessionsOptions) {
  const { activePartnerId } = useActivePartner();

  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ['all-sessions', activePartnerId, monthStart, monthEnd, experienceId],
    queryFn: async () => {
      if (!activePartnerId) return [];

      // Get all experiences for this partner
      const { data: experiences } = await supabase
        .from('experiences')
        .select('id, title, price_cents, duration_minutes')
        .eq('partner_id', activePartnerId);

      if (!experiences || experiences.length === 0) return [];

      // Filter by experience if specified
      const experienceIds = experienceId 
        ? [experienceId]
        : experiences.map(e => e.id);

      // Get all sessions for these experiences in the current month
      const { data: sessionsData, error } = await supabase
        .from('experience_sessions')
        .select('*')
        .in('experience_id', experienceIds)
        .gte('session_date', monthStart)
        .lte('session_date', monthEnd)
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Map experiences to sessions
      const experienceMap = new Map(experiences.map(e => [e.id, e]));
      
      return (sessionsData || []).map(session => ({
        ...session,
        experience: experienceMap.get(session.experience_id)!,
      })) as SessionWithExperience[];
    },
    enabled: !!activePartnerId,
  });

  // Group sessions by date
  const sessionsByDate = sessions.reduce((acc, session) => {
    const dateKey = session.session_date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, SessionWithExperience[]>);

  // Get unique experiences from sessions
  const experiences = Array.from(
    new Map(sessions.map(s => [s.experience.id, s.experience])).values()
  );

  return {
    sessions,
    sessionsByDate,
    experiences,
    isLoading,
    refetch,
  };
}
