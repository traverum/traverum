import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { format, isToday as checkIsToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SessionWithExperience } from '@/hooks/useAllSessions';
import { TimeSlotSession } from './TimeSlotSession';
import { supabase } from '@/integrations/supabase/client';

interface DayTimeViewProps {
  date: Date;
  sessions: SessionWithExperience[];
  experiences: Array<{ id: string; title: string; duration_minutes: number; max_participants?: number; price_cents?: number }>;
  onTimeSlotClick: (date: Date, time: string, position?: { x: number; y: number }) => void;
  onSessionClick?: (sessionId: string, position?: { x: number; y: number }) => void;
  showExperienceTitle?: boolean;
  onSessionUpdate?: () => void;
}

// Business hours focus (7am to 11pm)
const START_HOUR = 7;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
const HOUR_HEIGHT = 64; // Match week view
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;

export function DayTimeView({
  date,
  sessions,
  experiences,
  onTimeSlotClick,
  onSessionClick,
  showExperienceTitle = true,
  onSessionUpdate,
}: DayTimeViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isToday = checkIsToday(date);

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
    const roundedMinutes = Math.round(totalMinutes / 15) * 15;
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;
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
  const showCurrentTime = isToday && currentHour >= START_HOUR && currentHour < END_HOUR;

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

  const handleTimeSlotClick = (e: React.MouseEvent, hour: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const minuteOffset = Math.floor((clickY / HOUR_HEIGHT) * 60);
    const roundedMinutes = Math.round(minuteOffset / 15) * 15; // Round to nearest 15 min
    const adjustedMinutes = roundedMinutes >= 60 ? 0 : roundedMinutes;
    const adjustedHour = roundedMinutes >= 60 ? hour + 1 : hour;
    
    const time = `${adjustedHour.toString().padStart(2, '0')}:${adjustedMinutes.toString().padStart(2, '0')}`;
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
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            {format(date, 'EEEE')}
          </div>
          <div className={cn(
            'text-xl font-medium mt-1',
            isToday 
              ? 'w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto'
              : 'text-foreground'
          )}>
            {format(date, 'd')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
          </div>
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
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="relative"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="absolute -top-2 right-3 text-[11px] text-muted-foreground/70 font-normal">
                  {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
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
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.06)' }}
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
                onClick={(e) => handleTimeSlotClick(e, hour)}
              />
            ))}

            {/* Sessions layer */}
            <div className="absolute inset-0 pointer-events-none">
              {positionedSessions.map((session) => {
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
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shadow-sm" />
                <div className="flex-1 h-[2px] bg-red-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
