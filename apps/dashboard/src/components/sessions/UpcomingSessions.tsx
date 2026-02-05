import { format, isToday, isTomorrow } from 'date-fns';
import { CalendarPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { Session } from '@/hooks/useExperienceSessions';

interface UpcomingSessionsProps {
  sessions: Session[];
  isLoading?: boolean;
}

export function UpcomingSessions({ 
  sessions, 
  isLoading 
}: UpcomingSessionsProps) {
  const navigate = useNavigate();
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'd.M.yyyy');
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // "10:00:00" -> "10:00"
  };

  const getBookingStatus = (session: Session) => {
    const booked = session.spots_total - session.spots_available;
    if (booked === 0) return { text: `${session.spots_total} spots`, variant: 'available' as const };
    if (session.spots_available === 0) return { text: 'Full', variant: 'full' as const };
    return { text: `${booked}/${session.spots_total} booked`, variant: 'partial' as const };
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Upcoming Sessions</h3>
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-40 h-28 rounded-xl bg-muted animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <CalendarPlus className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-medium mb-1">No upcoming sessions</p>
          <p className="text-sm text-muted-foreground">
            Add sessions from the availability calendar below
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold">Upcoming Sessions</h3>
        <p className="text-sm text-muted-foreground">Your next scheduled sessions</p>
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-3">
          {sessions.map((session) => {
            const status = getBookingStatus(session);
            const isCancelled = session.session_status === 'cancelled';
            
            return (
              <Card 
                key={session.id}
                className={`flex-shrink-0 w-44 cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
                  isCancelled ? 'opacity-60' : ''
                }`}
                onClick={() => navigate(`/supplier/sessions/${session.id}`)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {/* Date */}
                    <p className="text-sm font-medium text-muted-foreground">
                      {formatDateLabel(session.session_date)}
                    </p>
                    
                    {/* Time */}
                    <span className="text-lg font-semibold">
                      {formatTime(session.start_time)}
                    </span>
                    
                    {/* Booking status */}
                    <div className="flex items-center justify-between pt-1">
                      <span 
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isCancelled
                            ? 'bg-muted text-muted-foreground'
                            : status.variant === 'available'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : status.variant === 'full'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                      >
                        {isCancelled ? 'Cancelled' : status.text}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
