import { cn } from '@/lib/utils';
import { SessionPill } from './SessionPill';
import { isToday, isPast, startOfDay, isSameMonth } from 'date-fns';
import { AvailabilityRule, isDateAvailable, getUnavailableReason } from '@/lib/availability';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CalendarDayProps {
  date: Date;
  sessions: Array<{
    id: string;
    start_time: string;
    spots_total: number;
    spots_available: number;
    session_status: string;
    price_override_cents: number | null;
    price_note: string | null;
    experience?: {
      id: string;
      title: string;
    };
  }>;
  totalSessionCount?: number;
  currentMonth: Date;
  onAddSession: (date: Date) => void;
  onDayClick?: (date: Date) => void;
  showExperienceTitle?: boolean;
  availabilityRules?: AvailabilityRule[];
}

export function CalendarDay({ 
  date, 
  sessions, 
  totalSessionCount,
  currentMonth, 
  onAddSession,
  onDayClick,
  showExperienceTitle = false,
  availabilityRules = [],
}: CalendarDayProps) {
  const displayedSessions = sessions.slice(0, 3);
  const actualTotal = totalSessionCount ?? sessions.length;
  const today = isToday(date);
  const pastDate = isPast(startOfDay(date)) && !today;
  const inCurrentMonth = isSameMonth(date, currentMonth);

  // Check availability
  const isAvailable = availabilityRules.length === 0 || isDateAvailable(date, availabilityRules);
  const unavailableReason = !isAvailable ? getUnavailableReason(date, availabilityRules) : null;

  const handleDayClick = () => {
    if (onDayClick) {
      onDayClick(date);
    }
  };

  const dayContent = (
    <div
      onClick={handleDayClick}
      className={cn(
        'bg-background min-h-[120px] p-2 relative cursor-pointer hover:bg-accent/50 transition-colors',
        today && 'bg-primary/5',
        pastDate && 'opacity-50',
        !inCurrentMonth && 'opacity-40',
        !isAvailable && !pastDate && inCurrentMonth && 'bg-muted/30'
      )}
    >
      {/* Date Number */}
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            'text-sm font-medium',
            today && 'w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center'
          )}
        >
          {date.getDate()}
        </div>
        {/* Unavailable indicator */}
        {!isAvailable && !pastDate && inCurrentMonth && (
          <span className="text-[10px] text-muted-foreground font-medium">Closed</span>
        )}
      </div>

      {/* Sessions for this day */}
      <div className="space-y-1 mt-2">
        {displayedSessions.map((session) => (
          <SessionPill
            key={session.id}
            session={session}
            showExperienceTitle={showExperienceTitle}
          />
        ))}
        {actualTotal > 3 && (
          <div className="text-xs text-muted-foreground mt-1">
            +{actualTotal - 3} more
          </div>
        )}
      </div>
    </div>
  );

  // Wrap with tooltip if unavailable
  if (!isAvailable && !pastDate && inCurrentMonth && unavailableReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {dayContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>{unavailableReason}</p>
            <p className="text-muted-foreground mt-1">You can still add sessions</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return dayContent;
}
