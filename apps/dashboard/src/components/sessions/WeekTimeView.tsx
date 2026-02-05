import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday as checkIsToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SessionWithExperience } from '@/hooks/useAllSessions';
import { TimeSlotSession } from './TimeSlotSession';
import { supabase } from '@/integrations/supabase/client';

interface WeekTimeViewProps {
  currentDate: Date;
  sessionsByDate: Record<string, SessionWithExperience[]>;
  experiences: Array<{ id: string; title: string; duration_minutes: number; max_participants?: number; price_cents?: number }>;
  onTimeSlotClick: (date: Date, time: string, position?: { x: number; y: number }) => void;
  onSessionClick?: (sessionId: string) => void;
  showExperienceTitle?: boolean;
  onSessionUpdate?: () => void;
}

// Business hours focus (7am to 11pm)
const START_HOUR = 7;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
const HOUR_HEIGHT = 64; // Taller for better readability
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;

export function WeekTimeView({
  currentDate,
  sessionsByDate,
  experiences,
  onTimeSlotClick,
  onSessionClick,
  showExperienceTitle = false,
  onSessionUpdate,
}: WeekTimeViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Drag state
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    session: SessionWithExperience | null;
    originalTop: number;
    currentTop: number;
    newTime: string | null;
  }>({
    isDragging: false,
    session: null,
    originalTop: 0,
    currentTop: 0,
    newTime: null,
  });

  // Get experience map for duration lookup
  const experienceMap = useMemo(() => {
    return new Map(experiences.map(e => [e.id, e]));
  }, [experiences]);

  // Convert Y position to time
  const yToTime = useCallback((y: number): string => {
    const totalMinutes = (y / MINUTE_HEIGHT) + (START_HOUR * 60);
    // Round to nearest 15 minutes
    const roundedMinutes = Math.round(totalMinutes / 15) * 15;
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;
    
    // Clamp to valid hours
    const clampedHours = Math.max(START_HOUR, Math.min(22, hours));
    
    return `${clampedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }, []);

  // Convert time to Y position
  const timeToY = useCallback((time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return ((hours - START_HOUR) * 60 + minutes) * MINUTE_HEIGHT;
  }, []);

  // Start dragging
  const handleDragStart = useCallback((
    e: React.MouseEvent,
    session: SessionWithExperience,
    originalTop: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragState({
      isDragging: true,
      session,
      originalTop,
      currentTop: originalTop,
      newTime: session.start_time.slice(0, 5),
    });
  }, []);

  // Handle mouse move during drag
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!gridRef.current || !scrollRef.current) return;
      
      // Use scroll container's rect and add scroll offset for accurate positioning
      const scrollRect = scrollRef.current.getBoundingClientRect();
      const relativeY = e.clientY - scrollRect.top + scrollRef.current.scrollTop;
      
      // Calculate new time
      const newTime = yToTime(Math.max(0, relativeY));
      const newTop = timeToY(newTime);
      
      setDragState(prev => ({
        ...prev,
        currentTop: newTop,
        newTime,
      }));
    };

    const handleMouseUp = async () => {
      if (dragState.session && dragState.newTime && dragState.newTime !== dragState.session.start_time.slice(0, 5)) {
        try {
          const { error } = await supabase
            .from('experience_sessions')
            .update({ start_time: `${dragState.newTime}:00` })
            .eq('id', dragState.session.id);

          if (error) throw error;
          onSessionUpdate?.();
        } catch (err) {
          console.error('Failed to update session time:', err);
        }
      }
      
      setDragState({
        isDragging: false,
        session: null,
        originalTop: 0,
        currentTop: 0,
        newTime: null,
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDragState({
          isDragging: false,
          session: null,
          originalTop: 0,
          currentTop: 0,
          newTime: null,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [dragState.isDragging, dragState.session, dragState.newTime, yToTime, timeToY, onSessionUpdate]);

  // Current time for the red indicator line
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeTop = ((currentHour - START_HOUR) * 60 + currentMinute) * MINUTE_HEIGHT;
  const showCurrentTime = currentHour >= START_HOUR && currentHour < END_HOUR;

  // Scroll to current time or 9am on mount
  useEffect(() => {
    if (scrollRef.current) {
      const scrollTo = showCurrentTime 
        ? Math.max(0, currentTimeTop - 120)
        : (9 - START_HOUR) * HOUR_HEIGHT; // Default to 9am
      scrollRef.current.scrollTop = scrollTo;
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

      // Calculate positions for each group (side-by-side)
      groups.forEach((group) => {
        const margin = 4; // px margin on each side
        const gap = 2; // px gap between overlapping
        const width = (100 - 2) / group.length; // Small margin
        group.forEach((session, index) => {
          session.left = 1 + (width * index);
          session.width = width - 0.5;
        });
      });

      grouped[dateKey] = positionedSessions;
    });

    return grouped;
  }, [weekDays, sessionsByDate, experienceMap]);

  const handleTimeSlotClick = (e: React.MouseEvent, day: Date, hour: number) => {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    const position = { x: e.clientX, y: e.clientY };
    onTimeSlotClick(day, time, position);
  };

  return (
    <div className="rounded-lg overflow-hidden bg-background">
      {/* Fixed header with day names */}
      <div className="flex bg-background sticky top-0 z-10">
        {/* Empty corner for time column */}
        <div className="w-16 flex-shrink-0" />
        
        {/* Day headers */}
        {weekDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const isToday = checkIsToday(day);

          return (
            <div
              key={dateKey}
              className="flex-1 py-2 text-center"
            >
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                {format(day, 'EEE')}
              </div>
              <div className={cn(
                'text-xl font-medium mt-1',
                isToday 
                  ? 'w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto'
                  : 'text-foreground'
              )}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
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
                {/* Time label aligned to top of each hour slot */}
                <span className="absolute -top-2 right-3 text-[11px] text-muted-foreground/70 font-normal">
                  {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
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
                  {/* Hour line - subtle */}
                  <div 
                    className="h-px" 
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.06)' }}
                  />
                  {/* Half hour line - very subtle */}
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
                    borderRight: dayIndex < 6 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none'
                  }}
                >
                  {/* Clickable hour slots */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="cursor-pointer hover:bg-primary/5 transition-colors duration-75"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      onClick={(e) => handleTimeSlotClick(e, day, hour)}
                    />
                  ))}

                  {/* Sessions layer */}
                  <div className="absolute inset-0 pointer-events-none">
                    {daySessions.map((session) => {
                      const isBeingDragged = dragState.isDragging && dragState.session?.id === session.id;
                      const displayTop = isBeingDragged ? dragState.currentTop : session.top;
                      
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
                          onClick={() => onSessionClick?.(session.id)}
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
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shadow-sm" />
                      <div className="flex-1 h-[2px] bg-red-500" />
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
