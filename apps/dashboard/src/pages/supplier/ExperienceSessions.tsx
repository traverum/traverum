import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { SessionsCalendar } from '@/components/sessions/SessionsCalendar';
import { SessionsListView } from '@/components/sessions/SessionsListView';
import {
  useExperienceSessions,
  generateRecurringSessions,
} from '@/hooks/useExperienceSessions';
import { useExperienceAvailability } from '@/hooks/useExperienceAvailability';
import { formatPrice } from '@/lib/pricing';

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

export default function ExperienceSessions() {
  const { id: experienceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const {
    experience,
    sessions,
    sessionsByDate,
    isLoading,
    createSession,
    createSessions,
    refetch,
  } = useExperienceSessions({
    experienceId: experienceId || '',
    currentMonth,
  });

  const { rules: availabilityRules } = useExperienceAvailability(experienceId || null);

  const handleCreateSession = async (data: SessionData | RecurringData) => {
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
        await createSession.mutateAsync({
          experience_id: experienceId!,
          session_date: data.date,
          start_time: data.time,
          spots_total: data.spotsTotal,
          spots_available: data.spotsAvailable,
          session_status: 'available',
          session_language: data.sessionLanguage,
          price_override_cents: data.priceOverrideCents,
          price_note: data.priceNote,
        });
        toast({ title: 'Session created' });
      } else {
        const baseSessions = generateRecurringSessions({
          experienceId: data.experienceId,
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
        await createSessions.mutateAsync(sessionsWithPricing);
        toast({ title: `${sessionsWithPricing.length} sessions created` });
      }
    } catch (error) {
      toast({
        title: 'Error creating session',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-alt">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-alt">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Experience not found</p>
          <Button onClick={() => navigate('/supplier/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isPerDay = (experience as any).pricing_type === 'per_day';

  return (
    <div className="min-h-screen bg-background-alt">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/supplier/experiences/${experienceId}`)}
              >
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{experience.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {isPerDay
                    ? `${formatPrice((experience as any).price_per_day_cents || experience.price_cents)} per day`
                    : `${experience.duration_minutes} min · ${formatPrice(experience.price_cents)} per person`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6">
        {isPerDay ? (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="rounded-lg border border-border bg-background p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2">Rental Experience</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
                This is a per-day rental experience. Guests send booking requests for their desired dates directly through the widget. You'll receive each request by email and can accept or decline it.
              </p>
              <p className="text-muted-foreground text-sm mt-3">
                Sessions are not needed for rental experiences.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => navigate(`/supplier/experiences/${experienceId}`)}
              >
                Back to Experience
              </Button>
            </div>
          </div>
        ) : isMobile ? (
          <SessionsListView
            sessionsByDate={sessionsByDate}
            onAddSession={() => {}}
          />
        ) : (
          <SessionsCalendar
            sessions={sessions}
            sessionsByDate={sessionsByDate}
            experience={experience}
            experiences={[{
              id: experience.id,
              title: experience.title,
              duration_minutes: experience.duration_minutes,
              max_participants: experience.max_participants,
              price_cents: experience.price_cents,
              available_languages: (experience as any).available_languages || [],
            }]}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onCreateSession={handleCreateSession}
            availabilityRules={availabilityRules}
            onSessionUpdate={refetch}
          />
        )}
      </main>
    </div>
  );
}
