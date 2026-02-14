import { useMemo, useRef, useEffect } from 'react';
import { format, isToday as checkIsToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SessionWithExperience } from '@/hooks/useAllSessions';
import type { CalendarRequest } from '@/hooks/useCalendarRequests';
import { useDragSession } from '@/hooks/useDragSession';
import { TimeSlotSession } from './TimeSlotSession';
import {
  START_HOUR, HOURS, HOUR_HEIGHT, MINUTE_HEIGHT,
  TIME_LABELS, yToTime,
} from './calendar-utils';

interface DayTimeViewProps {
  date: Date;
  sessions: SessionWithExperience[];
  requests?: CalendarRequest[];
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
  experiences,
  onTimeSlotClick,
  onSessionClick,
  onRequestBadgeClick,
  showExperienceTitle = true,
  onSessionUpdate,
}: DayTimeViewProps) {
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
      const scrollTo = showCurrentTime
        ? Math.max(0, currentTimeTop - 120)
        : (9 - START_HOUR) * HOUR_HEIGHT;
      scrollRef.current.scrollTop = scrollTo;
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

    // Calculate positions for overlapping sessions (side-by-side)
    groups.forEach((group) => {
      const width = (100 - 2) / group.length;
      group.forEach((session, index) => {
        session.left = 1 + (width * index);
        session.width = width - 0.5;
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
          <div className="text-xs text-muted-foreground/60 mt-1">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
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
              className="mt-1.5 inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-normal bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40"
            >
              {requests.length} {requests.length === 1 ? 'request' : 'requests'}
            </button>
          )}
        </div>
      </div>

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
