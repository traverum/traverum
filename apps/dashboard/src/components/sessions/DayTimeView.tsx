import { useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday as checkIsToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SessionWithExperience } from '@/hooks/useAllSessions';
import type { CalendarRequest } from '@/hooks/useCalendarRequests';
import type { CalendarRental } from '@/hooks/useCalendarRentals';
import { useDragSession } from '@/hooks/useDragSession';
import { TimeSlotSession } from './TimeSlotSession';
import {
  START_HOUR, HOURS, HOUR_HEIGHT, MINUTE_HEIGHT,
  TIME_LABELS, yToTime, getExperienceColor, getRentalDayContext,
  formatEuropeanDate,
} from './calendar-utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface DayTimeViewProps {
  date: Date;
  sessions: SessionWithExperience[];
  requests?: CalendarRequest[];
  rentals?: CalendarRental[];
  experiences: Array<{ id: string; title: string; duration_minutes: number; max_participants?: number; price_cents?: number }>;
  onTimeSlotClick: (date: Date, time: string, position?: { x: number; y: number }) => void;
  onSessionClick?: (sessionId: string, position?: { x: number; y: number }) => void;
  onRequestBadgeClick?: (dateKey: string, position: { x: number; y: number }) => void;
  showExperienceTitle?: boolean;
  onSessionUpdate?: () => void;
}

export function DayTimeView({
  date,
  sessions,
  requests = [],
  rentals = [],
  experiences,
  onTimeSlotClick,
  onSessionClick,
  onRequestBadgeClick,
  showExperienceTitle = true,
  onSessionUpdate,
}: DayTimeViewProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isToday = checkIsToday(date);

  // Shared drag hook — handles perf, undo, optimistic state
  const { dragState, pendingMove, handleDragStart } = useDragSession({
    scrollRef,
    onSessionUpdate,
  });

  // Get experience map for duration lookup
  const experienceMap = useMemo(() => {
    return new Map(experiences.map(e => [e.id, e]));
  }, [experiences]);

  // Current time for the red indicator line
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeTop = ((currentHour - START_HOUR) * 60 + currentMinute) * MINUTE_HEIGHT;
  const showCurrentTime = isToday && currentHour >= START_HOUR && currentHour < 23;

  // Scroll to current time or 9am on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, []);

  // Calculate positions for sessions
  const positionedSessions = useMemo(() => {
    const positioned = sessions.map((session) => {
      const [hours, minutes] = session.start_time.split(':').map(Number);
      const experience = experienceMap.get(session.experience_id);
      const durationMinutes = experience?.duration_minutes || 60;

      const top = ((hours - START_HOUR) * 60 + minutes) * MINUTE_HEIGHT;
      const height = Math.max(durationMinutes * MINUTE_HEIGHT, 24); // Min height for visibility

      return {
        ...session,
        top,
        height,
        left: 0,
        width: 100,
      };
    }).filter(s => s.top >= 0);

    // Sort by start time
    positioned.sort((a, b) => a.top - b.top);

    // Group overlapping sessions
    const groups: Array<Array<typeof positioned[0]>> = [];

    positioned.forEach((session) => {
      let added = false;

      for (const group of groups) {
        const overlaps = group.some((s) => {
          const sEnd = s.top + s.height;
          const sessionEnd = session.top + session.height;
          return (
            (session.top >= s.top && session.top < sEnd) ||
            (sessionEnd > s.top && sessionEnd <= sEnd) ||
            (session.top <= s.top && sessionEnd >= sEnd)
          );
        });

        if (overlaps) {
          group.push(session);
          added = true;
          break;
        }
      }

      if (!added) {
        groups.push([session]);
      }
    });

    groups.forEach((group) => {
      const width = 100 / group.length;
      group.forEach((session, index) => {
        session.left = width * index;
        session.width = width;
      });
    });

    return positioned;
  }, [sessions, experienceMap]);

  // Click time slot — snap to nearest 15min using Y position
  const handleTimeSlotClick = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    const scrollRect = scrollRef.current.getBoundingClientRect();
    const relativeY = e.clientY - scrollRect.top + scrollRef.current.scrollTop;
    const time = yToTime(Math.max(0, relativeY));
    const position = { x: e.clientX, y: e.clientY };
    onTimeSlotClick(date, time, position);
  };

  return (
    <div className="rounded-lg overflow-hidden bg-background">
      {/* Day header */}
      <div className="flex bg-background sticky top-0 z-10">
        {/* Empty corner for time column */}
        <div className="w-16 flex-shrink-0" />

        {/* Day header */}
        <div className="flex-1 py-2 text-center">
          <div className="text-[11px] text-muted-foreground/60 uppercase tracking-wider font-normal">
            {format(date, 'EEEE')}
          </div>
          <div className={cn(
            'mt-1 tabular-nums',
            isToday
              ? 'w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-sm font-medium'
              : 'text-lg font-normal text-foreground/80'
          )}>
            {format(date, 'd')}
          </div>
          {requests.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const dateKey = format(date, 'yyyy-MM-dd');
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                onRequestBadgeClick?.(dateKey, { x: rect.left, y: rect.bottom + 4 });
              }}
              className="mt-1.5 inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-normal bg-warning/10 text-warning hover:bg-warning/20 transition-colors dark:bg-warning/15 dark:text-warning dark:hover:bg-warning/25"
            >
              {requests.length} {requests.length === 1 ? 'request' : 'requests'}
            </button>
          )}
        </div>
      </div>

      {/* All-day rental bars */}
      {rentals.length > 0 && (() => {
        const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayRentals = rentals.filter(r => r.rentalStartDate <= dateKey && r.rentalEndDate > dateKey);
        if (dayRentals.length === 0) return null;
        return (
          <div className="flex border-b border-border">
            <div className="w-16 flex-shrink-0 flex items-start pt-2">
              <span className="text-[10px] text-muted-foreground/40 px-2 leading-none">
                all-day
              </span>
            </div>
            <div className="flex-1 py-1.5 space-y-0.5">
              {dayRentals.map(rental => {
                const expColor = getExperienceColor(rental.experience.id);
                const { dayNumber, totalDays } = getRentalDayContext(rental, date);
                return (
                  <Popover key={rental.bookingId}>
                    <PopoverTrigger asChild>
                      <div
                        className="flex items-center truncate"
                        style={{
                          height: 22,
                          lineHeight: '22px',
                          fontSize: 12,
                          fontWeight: 500,
                          padding: '0 6px',
                          backgroundColor: isDark ? expColor.darkBgSolid : expColor.bgSolid,
                          color: isDark ? expColor.darkTextSolid : expColor.textSolid,
                          borderRadius: 4,
                          cursor: 'pointer',
                          transition: 'filter 150ms ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.88)'; }}
                        onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
                      >
                        <span className="truncate">
                          {rental.experience.title} — Day {dayNumber} of {totalDays}
                        </span>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      side="bottom"
                      align="start"
                      className="w-auto min-w-[200px] p-4"
                    >
                      <p className="text-sm font-medium tracking-[-0.01em]">{rental.experience.title}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {rental.guestName} · {rental.participants} {rental.participants === 1 ? 'unit' : 'units'}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                        {formatEuropeanDate(rental.rentalStartDate)} → {formatEuropeanDate(rental.rentalEndDate)}
                      </p>
                      <button
                        type="button"
                        className="text-xs text-primary hover:text-primary/80 font-medium tracking-[-0.01em] transition-colors mt-3"
                        onClick={() => navigate('/supplier/bookings?tab=upcoming')}
                      >
                        View booking →
                      </button>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Scrollable time grid */}
      <div
        ref={scrollRef}
        className="overflow-y-auto overflow-x-hidden"
        style={{ maxHeight: 'calc(100vh - 200px)', minHeight: '500px' }}
      >
        <div className="flex relative">
          {/* Time labels column */}
          <div className="w-16 flex-shrink-0">
            {HOURS.map((hour, index) => (
              <div
                key={hour}
                className="relative"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="absolute -top-2 right-3 text-[11px] text-muted-foreground/50 font-normal tabular-nums">
                  {TIME_LABELS[index]}
                </span>
              </div>
            ))}
          </div>

          {/* Main time grid */}
          <div ref={gridRef} className="flex-1 relative">
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              {HOURS.map((hour, index) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0"
                  style={{ top: `${index * HOUR_HEIGHT}px` }}
                >
                  {/* Hour line */}
                  <div
                    className="h-px"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)' }}
                  />
                  {/* Half hour line */}
                  <div
                    className="h-px"
                    style={{
                      marginTop: `${HOUR_HEIGHT / 2 - 1}px`,
                      backgroundColor: 'rgba(0, 0, 0, 0.03)'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Clickable hour slots */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="cursor-pointer hover:bg-primary/5 transition-colors duration-75"
                style={{ height: `${HOUR_HEIGHT}px` }}
                onClick={handleTimeSlotClick}
              />
            ))}

            {/* Sessions layer */}
            <div className="absolute inset-0 pointer-events-none">
              {positionedSessions.map((session) => {
                const isBeingDragged = dragState.isDragging && dragState.session?.id === session.id;
                const isPendingMove = pendingMove?.sessionId === session.id;
                const displayTop = isBeingDragged
                  ? dragState.currentTop
                  : isPendingMove
                    ? pendingMove.newTop
                    : session.top;

                return (
                  <TimeSlotSession
                    key={session.id}
                    session={session}
                    top={displayTop}
                    height={session.height}
                    left={session.left}
                    width={session.width}
                    experience={experienceMap.get(session.experience_id)}
                    showExperienceTitle={showExperienceTitle}
                    onClick={(pos) => onSessionClick?.(session.id, pos)}
                    isDragging={dragState.isDragging}
                    isBeingDragged={isBeingDragged}
                    dragPreviewTime={isBeingDragged ? dragState.newTime || undefined : undefined}
                    onDragStart={handleDragStart}
                  />
                );
              })}
            </div>

            {/* Current time indicator */}
            {showCurrentTime && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                style={{ top: `${currentTimeTop}px` }}
              >
                <div className="w-2 h-2 rounded-full bg-primary -ml-1" />
                <div className="flex-1 h-px bg-primary" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
