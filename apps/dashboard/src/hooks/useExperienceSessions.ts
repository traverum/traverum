import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, addDays, getDay } from 'date-fns';

export interface Session {
  id: string;
  experience_id: string;
  session_date: string;
  start_time: string;
  spots_total: number;
  spots_available: number;
  session_status: string;
  session_language: string | null;
  price_override_cents: number | null;
  price_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Experience {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  max_participants: number;
  price_cents: number;
  partner_id: string;
  available_languages?: string[];
}

interface UseExperienceSessionsOptions {
  experienceId: string;
  currentMonth: Date;
}

export function useExperienceSessions({ experienceId, currentMonth }: UseExperienceSessionsOptions) {
  const queryClient = useQueryClient();
  // Expand range to include calendar overflow days (Mon of first week → Sun of last week)
  const rangeStart = format(startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const rangeEnd = format(endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Fetch experience details
  const { data: experience, isLoading: isLoadingExperience } = useQuery({
    queryKey: ['experience', experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('id', experienceId)
        .single();

      if (error) throw error;
      return data as Experience;
    },
    enabled: !!experienceId,
  });

  // Fetch sessions for the visible calendar range (includes overflow days)
  const { data: sessions = [], isLoading: isLoadingSessions, refetch } = useQuery({
    queryKey: ['sessions', experienceId, rangeStart, rangeEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experience_sessions')
        .select('*')
        .eq('experience_id', experienceId)
        .gte('session_date', rangeStart)
        .lte('session_date', rangeEnd)
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as Session[];
    },
    enabled: !!experienceId,
  });

  // Group sessions by date
  const sessionsByDate = sessions.reduce<Record<string, Session[]>>((acc, session) => {
    const date = session.session_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

  // Create session mutation
  const createSession = useMutation({
    mutationFn: async (newSession: Omit<Session, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('experience_sessions')
        .insert(newSession)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', experienceId] });
    },
  });

  // Create multiple sessions mutation (for recurring)
  const createSessions = useMutation({
    mutationFn: async (newSessions: Omit<Session, 'id' | 'created_at' | 'updated_at'>[]) => {
      const { data, error } = await supabase
        .from('experience_sessions')
        .insert(newSessions)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', experienceId] });
    },
  });

  // Update session mutation
  const updateSession = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Session> & { id: string }) => {
      const { data, error } = await supabase
        .from('experience_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', experienceId] });
    },
  });

  // Delete session mutation
  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('experience_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', experienceId] });
    },
  });

  // Delete multiple sessions mutation
  const deleteSessions = useMutation({
    mutationFn: async (sessionIds: string[]) => {
      const { error } = await supabase
        .from('experience_sessions')
        .delete()
        .in('id', sessionIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', experienceId] });
    },
  });

  // Find matching sessions for bulk delete (same weekday + time, future dates only)
  const findMatchingSessions = async (session: Session): Promise<Session[]> => {
    const sessionDayOfWeek = getDay(new Date(session.session_date));
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('experience_sessions')
      .select('*')
      .eq('experience_id', experienceId)
      .eq('start_time', session.start_time)
      .gte('session_date', today)
      .neq('id', session.id);

    if (error) throw error;

    // Filter by same day of week
    return (data || []).filter(s => 
      getDay(new Date(s.session_date)) === sessionDayOfWeek
    ) as Session[];
  };

  return {
    experience,
    sessions,
    sessionsByDate,
    isLoading: isLoadingExperience || isLoadingSessions,
    refetch,
    createSession,
    createSessions,
    updateSession,
    deleteSession,
    deleteSessions,
    findMatchingSessions,
  };
}

// Helper to generate recurring sessions
export function generateRecurringSessions({
  experienceId,
  startDate,
  endDate,
  time,
  spots,
  frequency,
}: {
  experienceId: string;
  startDate: string;
  endDate: string;
  time: string;
  spots: number;
  frequency: 'daily' | 'weekly';
}): Omit<Session, 'id' | 'created_at' | 'updated_at' | 'price_override_cents' | 'price_note'>[] {
  const sessions: Omit<Session, 'id' | 'created_at' | 'updated_at' | 'price_override_cents' | 'price_note'>[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Get current date/time for filtering past sessions
  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [timeHours, timeMinutes] = time.split(':').map(Number);
  const nowHours = now.getHours();
  const nowMinutes = now.getMinutes();
  
  let currentDate = new Date(start);
  
  while (currentDate <= end) {
    const sessionDateStr = format(currentDate, 'yyyy-MM-dd');
    
    // Skip past sessions
    if (sessionDateStr < todayLocal) {
      // Past date, skip
    } else if (sessionDateStr === todayLocal) {
      // Today - check time
      if (timeHours > nowHours || (timeHours === nowHours && timeMinutes > nowMinutes)) {
        sessions.push({
          experience_id: experienceId,
          session_date: sessionDateStr,
          start_time: time,
          spots_total: spots,
          spots_available: spots,
          session_status: 'available',
        });
      }
    } else {
      // Future date, include
      sessions.push({
        experience_id: experienceId,
        session_date: sessionDateStr,
        start_time: time,
        spots_total: spots,
        spots_available: spots,
        session_status: 'available',
      });
    }
    
    if (frequency === 'daily') {
      currentDate = addDays(currentDate, 1);
    } else {
      currentDate = addDays(currentDate, 7);
    }
  }
  
  return sessions;
}
