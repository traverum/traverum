import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import type { SessionWithExperience } from '@/hooks/useAllSessions';
import { yToTime, timeToY } from '@/components/sessions/calendar-utils';

export interface DragState {
  isDragging: boolean;
  session: SessionWithExperience | null;
  originalTop: number;
  currentTop: number;
  newTime: string | null;
}

export interface PendingMove {
  sessionId: string;
  newTime: string;
  newTop: number;
}

const INITIAL_DRAG_STATE: DragState = {
  isDragging: false,
  session: null,
  originalTop: 0,
  currentTop: 0,
  newTime: null,
};

interface UseDragSessionOptions {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onSessionUpdate?: () => void;
}

export function useDragSession({ scrollRef, onSessionUpdate }: UseDragSessionOptions) {
  const [dragState, setDragState] = useState<DragState>(INITIAL_DRAG_STATE);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  // Stable ref for the callback so the effect doesn't re-register on every render
  const onSessionUpdateRef = useRef(onSessionUpdate);
  onSessionUpdateRef.current = onSessionUpdate;

  // Ref for intermediate drag tracking — avoids re-renders on every mouse pixel
  const dragRef = useRef({
    session: null as SessionWithExperience | null,
    originalTime: '',
    lastSnappedTime: '',
  });

  // Timer ref for clearing pendingMove
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Clean up pending timer on unmount
  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  }, []);

  const handleDragStart = useCallback((
    e: React.MouseEvent,
    session: SessionWithExperience,
    originalTop: number
  ) => {
    // Block drag for booked or cancelled sessions — moving a booked session
    // silently reschedules a paid guest. That should never happen casually.
    if (session.session_status === 'booked' || session.session_status === 'cancelled') {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const time = session.start_time.slice(0, 5);
    dragRef.current = { session, originalTime: time, lastSnappedTime: time };

    setDragState({
      isDragging: true,
      session,
      originalTop,
      currentTop: originalTop,
      newTime: time,
    });
  }, []);

  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return;

      const scrollRect = scrollEl.getBoundingClientRect();
      const relativeY = e.clientY - scrollRect.top + scrollEl.scrollTop;
      const newTime = yToTime(Math.max(0, relativeY));

      // Only trigger a re-render when the snapped time actually changes
      if (newTime !== dragRef.current.lastSnappedTime) {
        dragRef.current.lastSnappedTime = newTime;
        const newTop = timeToY(newTime);
        setDragState(prev => ({ ...prev, currentTop: newTop, newTime }));
      }
    };

    const handleMouseUp = async () => {
      const { session, originalTime } = dragRef.current;
      const newTime = dragRef.current.lastSnappedTime;

      // Reset drag visuals immediately for responsive UI
      dragRef.current = { session: null, originalTime: '', lastSnappedTime: '' };
      setDragState(INITIAL_DRAG_STATE);

      if (!session || !newTime || newTime === originalTime) return;

      // Keep session at new position optimistically until data refetches
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      setPendingMove({ sessionId: session.id, newTime, newTop: timeToY(newTime) });

      try {
        const { error } = await supabase
          .from('experience_sessions')
          .update({ start_time: `${newTime}:00` })
          .eq('id', session.id);

        if (error) throw error;

        // Refetch to get updated data from server
        onSessionUpdateRef.current?.();

        // Show undo toast
        const experienceTitle = session.experience?.title || 'Session';
        toast({
          title: `Moved to ${newTime}`,
          description: experienceTitle,
          action: (
            <ToastAction altText="Undo" onClick={async () => {
              try {
                await supabase
                  .from('experience_sessions')
                  .update({ start_time: `${originalTime}:00` })
                  .eq('id', session.id);
                onSessionUpdateRef.current?.();
              } catch {
                toast({ title: 'Failed to undo', variant: 'destructive' });
              }
            }}>
              Undo
            </ToastAction>
          ),
        });
      } catch (err) {
        console.error('Failed to move session:', err);
        toast({ title: 'Failed to move session', variant: 'destructive' });
        // Refetch to revert visual state
        onSessionUpdateRef.current?.();
      } finally {
        // Clear pending move after data should have refreshed
        pendingTimerRef.current = setTimeout(() => setPendingMove(null), 800);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dragRef.current = { session: null, originalTime: '', lastSnappedTime: '' };
        setDragState(INITIAL_DRAG_STATE);
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
  }, [dragState.isDragging, scrollRef]);

  return { dragState, pendingMove, handleDragStart };
}
