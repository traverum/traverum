import { useMemo, useRef, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday as checkIsToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SessionWithExperience } from '@/hooks/useAllSessions';
import type { CalendarRequest } from '@/hooks/useCalendarRequests';
import type { CalendarRental } from '@/hooks/useCalendarRentals';
import { useDragSession } from '@/hooks/useDragSession';
import { TimeSlotSession } from './TimeSlotSession';
import { RentalWeekBars } from './RentalWeekBars';
import {
  START_HOUR, HOURS, HOUR_HEIGHT, MINUTE_HEIGHT,
  TIME_LABELS, yToTime,
  splitRentalIntoSegment, packSegmentsIntoRows,
} from './calendar-utils';

interface WeekTimeViewProps {
  currentDate: Date;
  sessionsByDate: Record<string, SessionWithExperience[]>;
  requestsByDate?: Record<string, CalendarRequest[]>;
  rentals?: CalendarRental[];
  experiences: Array<{ id: string; title: string; duration_minutes: number; max_participants?: number; price_cents?: number }>;
  onTimeSlotClick: (date: Date, time: string, position?: { x: number; y: number }) => void;
  onSessionClick?: (sessionId: string, position?: { x: number; y: number }) => void;
  onRequestBadgeClick?: (dateKey: string, position: { x: number; y: number }) => void;
  showExperienceTitle?: boolean;
  onSessionUpdate?: () => void;
}

export function WeekTimeView({
  currentDate,
  sessionsByDate,
  requestsByDate = {},
  rentals = [],
  experiences,
  onTimeSlotClick,
  onSessionClick,
  onRequestBadgeClick,
  showExperienceTitle = false,
  onSessionUpdate,
}: WeekTimeViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

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
  const showCurrentTime = currentHour >= START_HOUR && currentHour < 23;

  // Scroll to current time or 9am on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, []);

  // Group sessions by day and calculate positions
  const sessionsByDayAndTime = useMemo(() => {
    const grouped: Record<string, Array<SessionWithExperience & { top: number; height: number; left: number; width: number }>> = {};

    weekDays.forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const daySessions = sessionsByDate[dateKey] || [];

      // Calculate positions for each session
      const positionedSessions = daySessions.map((session) => {
        const [hours, minutes] = session.start_time.split(':').map(Number);
        const experience = experienceMap.get(session.experience_id);
        const durationMinutes = experience?.duration_minutes || 60;

        // Adjust for start hour offset
        const top = ((hours - START_HOUR) * 60 + minutes) * MINUTE_HEIGHT;
        const height = durationMinutes * MINUTE_HEIGHT;

        return {
          ...session,
          top,
          height,
          left: 0,
          width: 100,
        };
      }).filter(s => s.top >= 0); // Only show sessions within visible hours

      // Sort by start time
      positionedSessions.sort((a, b) => a.top - b.top);

      // Group overlapping sessions
      const groups: Array<Array<typeof positionedSessions[0]>> = [];

      positionedSessions.forEach((session) => {
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

      grouped[dateKey] = positionedSessions;
    });

    return grouped;
  }, [weekDays, sessionsByDate, experienceMap]);

  // Compute packed bar segments for the all-day section
  const weekBarSegments = useMemo(() => {
    if (rentals.length === 0) return [];
    const segments = rentals
      .map(r => splitRentalIntoSegment(r, weekDays))
      .filter((s): s is Exclude<typeof s, null> => s !== null);
    return packSegmentsIntoRows(segments);
  }, [rentals, weekDays]);

  // Click time slot — snap to nearest 15min using Y position
  const handleTimeSlotClick = (e: React.MouseEvent, day: Date) => {
    if (!scrollRef.current) return;
    const scrollRect = scrollRef.current.getBoundingClientRect();
    const relativeY = e.clientY - scrollRect.top + scrollRef.current.scrollTop;
    const time = yToTime(Math.max(0, relativeY));
    const position = { x: e.clientX, y: e.clientY };
    onTimeSlotClick(day, time, position);
  };

  return (
    <div className="rounded-lg overflow-hidden bg-background">
      {/* Single scroll container — header is sticky inside it so vertical lines align */}
      <div
        ref={scrollRef}
        className="overflow-y-auto overflow-x-hidden"
        style={{ maxHeight: 'calc(100vh - 200px)', minHeight: '500px' }}
      >
        {/* Sticky header: day names + all-day bars */}
        <div className="bg-background sticky top-0 z-10">
          {/* Day headers */}
          <div className="flex border-b border-border">
            <div className="w-16 flex-shrink-0" />
            {weekDays.map((day, dayIndex) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const isToday = checkIsToday(day);
              const dayRequests = requestsByDate[dateKey] || [];

              return (
                <div
                  key={dateKey}
                  className="flex-1 py-2 text-center"
                  style={{
                    borderRight: dayIndex < 6 ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
                  }}
                >
                  <div className="text-[11px] text-muted-foreground/60 uppercase tracking-wider font-normal">
                    {format(day, 'EEE')}
                  </div>
                  <div className={cn(
                    'mt-1 tabular-nums',
                    isToday
                      ? 'w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-sm font-medium'
                      : 'text-lg font-normal text-foreground/80'
                  )}>
                    {format(day, 'd')}
                  </div>
                  {dayRequests.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        onRequestBadgeClick?.(dateKey, { x: rect.left, y: rect.bottom + 4 });
                      }}
                      className="mt-1 inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-normal bg-warning/10 text-warning hover:bg-warning/20 transition-colors dark:bg-warning/15 dark:text-warning dark:hover:bg-warning/25"
                    >
                      {dayRequests.length} {dayRequests.length === 1 ? 'request' : 'requests'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* All-day rental bars */}
          {weekBarSegments.length > 0 && (
            <div className="flex border-b border-border">
              <div className="w-16 flex-shrink-0 flex items-start pt-2">
                <span className="text-[10px] text-muted-foreground/40 px-2 leading-none">
                  all-day
                </span>
              </div>
              <div className="flex-1 py-1.5">
                <RentalWeekBars segments={weekBarSegments} />
              </div>
            </div>
          )}
        </div>

        {/* Time grid */}
        <div className="flex relative">
          {/* Time labels column */}
          <div className="w-16 flex-shrink-0">
            {HOURS.map((hour, index) => (
              <div
                key={hour}
                className="relative"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                {/* Time label aligned to top of each hour slot */}
                <span className="absolute -top-2 right-3 text-[11px] text-muted-foreground/50 font-normal tabular-nums">
                  {TIME_LABELS[index]}
                </span>
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div ref={gridRef} className="flex-1 flex relative">
            {/* Horizontal grid lines layer (behind sessions) */}
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

            {/* Day columns */}
            {weekDays.map((day, dayIndex) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const isToday = checkIsToday(day);
              const daySessions = sessionsByDayAndTime[dateKey] || [];

              return (
                <div
                  key={dateKey}
                  className="flex-1 relative"
                  style={{
                    borderRight: dayIndex < 6 ? '1px solid rgba(0, 0, 0, 0.06)' : 'none'
                  }}
                >
                  {/* Clickable hour slots */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="cursor-pointer hover:bg-primary/5 transition-colors duration-75"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      onClick={(e) => handleTimeSlotClick(e, day)}
                    />
                  ))}

                  {/* Sessions layer */}
                  <div className="absolute inset-0 pointer-events-none">
                    {daySessions.map((session) => {
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
                  {isToday && showCurrentTime && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                      style={{ top: `${currentTimeTop}px` }}
                    >
                      <div className="w-2 h-2 rounded-full bg-primary -ml-1" />
                      <div className="flex-1 h-px bg-primary" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
