import { useState } from 'react';
import { useAllSessions } from '@/hooks/useAllSessions';
import { useCalendarRequests } from '@/hooks/useCalendarRequests';
import { useCalendarRentals } from '@/hooks/useCalendarRentals';
import { SessionsCalendar } from '@/components/sessions/SessionsCalendar';
import { SessionsListView } from '@/components/sessions/SessionsListView';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useSupplierData } from '@/hooks/useSupplierData';
import { generateRecurringSessions } from '@/hooks/useExperienceSessions';
import { supabase } from '@/integrations/supabase/client';

type SessionData = {
  single: true;
  experienceId: string;
  date: string;
  time: string;
  spotsTotal: number;
  spotsAvailable: number;
  priceOverrideCents: number | null;
  priceNote: string | null;
  sessionLanguage: string | null;
};

type RecurringData = {
  experienceId: string;
  startDate: string;
  endDate: string;
  time: string;
  spots: number;
  frequency: 'daily' | 'weekly';
  priceOverrideCents: number | null;
  priceNote: string | null;
  sessionLanguage: string | null;
};

export default function SupplierSessions() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { experiences: allExperiences } = useSupplierData();
  const { sessions, sessionsByDate, isLoading, refetch } = useAllSessions({ 
    currentMonth,
    experienceId: null 
  });
  const { requestsByDate, refetch: refetchRequests } = useCalendarRequests(currentMonth);
  const { rentals } = useCalendarRentals(currentMonth);

  const handleCreateSession = async (data: SessionData | RecurringData) => {
    const experienceId = data.experienceId;
    if (!experienceId) {
      toast({
        title: 'Error',
        description: 'Please select an experience.',
        variant: 'destructive',
      });
      return;
    }

    // Safety check: prevent creating sessions in the past
    const now = new Date();
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();
    
    if ('single' in data) {
      const [startH, startM] = data.time.split(':').map(Number);
      const isPast = data.date < todayLocal || 
        (data.date === todayLocal && (startH < nowHours || (startH === nowHours && startM < nowMinutes)));
      
      if (isPast) {
        toast({
          title: 'Error',
          description: 'Cannot create sessions in the past. Please select a future date and time.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      if ('single' in data) {
        const { error } = await supabase
          .from('experience_sessions')
          .insert({
            experience_id: experienceId,
            session_date: data.date,
            start_time: data.time,
            spots_total: data.spotsTotal,
            spots_available: data.spotsAvailable,
            session_status: 'available',
            session_language: data.sessionLanguage,
            price_override_cents: data.priceOverrideCents,
            price_note: data.priceNote,
          });

        if (error) throw error;
        toast({ title: 'Session created' });
      } else {
        const baseSessions = generateRecurringSessions({
          experienceId: experienceId,
          startDate: data.startDate,
          endDate: data.endDate,
          time: data.time,
          spots: data.spots,
          frequency: data.frequency,
        });
        
        if (baseSessions.length === 0) {
          toast({
            title: 'No sessions created',
            description: 'All selected sessions are in the past.',
            variant: 'destructive',
          });
          return;
        }
        
        const sessionsWithPricing = baseSessions.map(s => ({
          ...s,
          session_language: data.sessionLanguage,
          price_override_cents: data.priceOverrideCents,
          price_note: data.priceNote,
        }));

        const { error } = await supabase
          .from('experience_sessions')
          .insert(sessionsWithPricing);

        if (error) throw error;
        toast({ title: `${sessionsWithPricing.length} sessions created` });
      }
      await refetch();
    } catch (error: any) {
      toast({
        title: 'Error creating session',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Convert sessions to the format expected by SessionsListView
  const formattedSessionsByDate = Object.entries(sessionsByDate).reduce((acc, [date, dateSessions]) => {
    acc[date] = dateSessions.map(session => ({
      ...session,
      created_at: '',
      updated_at: '',
    }));
    return acc;
  }, {} as Record<string, any[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-alt">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-alt">
      <main className="container max-w-7xl mx-auto px-3 py-3">
        {isMobile ? (
          <SessionsListView
            sessionsByDate={formattedSessionsByDate}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onAddSession={() => {}}
            showExperienceTitle={true}
          />
        ) : (
          <SessionsCalendar
            sessions={sessions}
            sessionsByDate={formattedSessionsByDate}
            requestsByDate={requestsByDate}
            rentals={rentals}
            experience={null}
            experiences={allExperiences
              .filter(e => e.pricing_type !== 'per_day')
              .map(e => ({
                id: e.id,
                title: e.title,
                duration_minutes: e.duration_minutes,
                max_participants: e.max_participants,
                price_cents: e.price_cents,
                available_languages: (e as any).available_languages || [],
              }))}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onCreateSession={handleCreateSession}
            showExperienceTitle={true}
            availabilityRules={[]}
            onSessionClick={() => {
              // Session clicks handled by SessionsCalendar's internal quick-edit popup
            }}
            onSessionUpdate={refetch}
            onRequestAction={() => {
              refetchRequests();
              refetch();
            }}
          />
        )}
      </main>
    </div>
  );
}
