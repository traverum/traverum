import { format, addDays, isToday, isTomorrow, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionPill } from './SessionPill';
import type { Session } from '@/hooks/useExperienceSessions';

interface SessionsListViewProps {
  sessionsByDate: Record<string, Session[]>;
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
  onAddSession?: (date: Date) => void;
  showExperienceTitle?: boolean;
}

export function SessionsListView({
  sessionsByDate,
  currentMonth,
  onMonthChange,
  onAddSession,
  showExperienceTitle = false,
}: SessionsListViewProps) {
  // If currentMonth is provided, show the full month view
  // Otherwise, show the next 7 days (legacy mode)
  const isMonthView = !!currentMonth && !!onMonthChange;

  const today = new Date();
  
  let daysToShow: Date[];
  
  if (isMonthView) {
    const monthStart = startOfMonth(currentMonth!);
    const monthEnd = endOfMonth(currentMonth!);
    daysToShow = eachDayOfInterval({ start: monthStart, end: monthEnd });
  } else {
    daysToShow = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }

  const formatDayLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE');
  };

  return (
    <div className="space-y-3">
      {/* Month navigation (only in month view) */}
      {isMonthView && (
        <div className="bg-card rounded-xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {format(currentMonth!, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onMonthChange!(new Date(currentMonth!.getFullYear(), currentMonth!.getMonth() - 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onMonthChange!(new Date())}
              >
                Today
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onMonthChange!(new Date(currentMonth!.getFullYear(), currentMonth!.getMonth() + 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {daysToShow.map((day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const sessions = sessionsByDate[dateKey] || [];

        // In month view, skip days with no sessions
        if (isMonthView && sessions.length === 0) {
          return null;
        }

        return (
          <div key={dateKey} className="bg-card rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">{formatDayLabel(day)}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(day, 'dd/MM/yyyy')}
                </p>
              </div>
              {sessions.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {sessions.map((session) => (
                <SessionPill
                  key={session.id}
                  session={session}
                  showExperienceTitle={showExperienceTitle}
                />
              ))}

              {onAddSession && (
                <button
                  onClick={() => onAddSession(day)}
                  className="w-full text-sm text-primary py-2 hover:bg-primary/5 rounded transition-colors"
                >
                  + Add Session
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Empty state for month view */}
      {isMonthView && Object.keys(sessionsByDate).length === 0 && (
        <div className="bg-card rounded-xl p-8 shadow-sm text-center">
          <p className="text-muted-foreground">No sessions this month</p>
        </div>
      )}
    </div>
  );
}
