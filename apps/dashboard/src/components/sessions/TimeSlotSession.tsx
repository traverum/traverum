import { cn } from '@/lib/utils';
import type { SessionWithExperience } from '@/hooks/useAllSessions';

interface TimeSlotSessionProps {
  session: SessionWithExperience;
  top: number;
  height: number;
  left: number;
  width: number;
  experience?: { id: string; title: string; duration_minutes: number } | undefined;
  showExperienceTitle?: boolean;
  onClick?: (position: { x: number; y: number }) => void;
  isDragging?: boolean;
  isBeingDragged?: boolean;
  dragPreviewTime?: string;
  onDragStart?: (e: React.MouseEvent, session: SessionWithExperience, top: number) => void;
}

export function TimeSlotSession({
  session,
  top,
  height,
  left,
  width,
  experience,
  showExperienceTitle = false,
  onClick,
  isDragging = false,
  isBeingDragged = false,
  dragPreviewTime,
  onDragStart,
}: TimeSlotSessionProps) {
  const bookingsCount = session.spots_total - session.spots_available;
  const isFull = session.spots_available === 0;
  const isCancelled = session.session_status === 'cancelled';
  
  // Minimum heights for content display
  const minHeight = 28;
  const displayHeight = Math.max(height, minHeight);
  const isCompact = displayHeight < 48;
  const isVeryCompact = displayHeight < 36;

  // Session colors - softer, Google Calendar-like
  const getBackgroundColor = () => {
    if (isCancelled) return 'bg-neutral-200 dark:bg-neutral-700';
    if (isFull) return 'bg-amber-100 dark:bg-amber-900/40';
    return 'bg-teal-100 dark:bg-teal-900/40';
  };

  const getBorderColor = () => {
    if (isCancelled) return 'border-l-neutral-400';
    if (isFull) return 'border-l-amber-500';
    return 'border-l-teal-600';
  };

  const getTextColor = () => {
    if (isCancelled) return 'text-neutral-500 dark:text-neutral-400';
    if (isFull) return 'text-amber-800 dark:text-amber-200';
    return 'text-teal-800 dark:text-teal-200';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag on left click and if not cancelled
    if (e.button !== 0 || isCancelled) return;
    
    // Capture click position immediately
    const clickPosition = { x: e.clientX, y: e.clientY };
    
    // Check if it's a quick click (will be handled as regular click)
    const startTime = Date.now();
    
    const handleMouseUp = () => {
      const duration = Date.now() - startTime;
      // If it's a quick click (< 200ms), treat as click
      if (duration < 200) {
        onClick?.(clickPosition);
      }
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    
    // Start drag after a small delay to distinguish from clicks
    if (onDragStart) {
      const timeoutId = setTimeout(() => {
        onDragStart(e, session, top);
        window.removeEventListener('mouseup', handleMouseUp);
      }, 150);
      
      const cancelTimeout = () => {
        clearTimeout(timeoutId);
        window.removeEventListener('mouseup', cancelTimeout);
      };
      window.addEventListener('mouseup', cancelTimeout);
    }
  };

  return (
    <div
      className={cn(
        'absolute rounded-md pointer-events-auto',
        'border-l-4 overflow-hidden',
        'hover:shadow-lg hover:z-10 transition-all duration-100',
        getBackgroundColor(),
        getBorderColor(),
        isCancelled && 'opacity-70',
        isBeingDragged && 'shadow-xl z-50 ring-2 ring-primary/50 scale-[1.02]',
        isDragging && !isBeingDragged && 'opacity-30',
        !isCancelled && 'cursor-grab active:cursor-grabbing'
      )}
      style={{
        top: `${top + 1}px`, // 1px offset from grid line
        left: `${left}%`,
        width: `calc(${width}% - 4px)`, // Small gap on right
        height: `${displayHeight - 2}px`, // 2px smaller to show grid
        marginLeft: '2px',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={cn(
        'h-full flex flex-col',
        isVeryCompact ? 'px-1.5 py-0.5' : isCompact ? 'px-2 py-1' : 'px-2.5 py-1.5'
      )}>
        {/* Title - always show */}
        <div className={cn(
          'font-semibold truncate leading-tight',
          getTextColor(),
          isVeryCompact ? 'text-[10px]' : isCompact ? 'text-xs' : 'text-sm'
        )}>
          {showExperienceTitle && experience ? experience.title : (dragPreviewTime || session.start_time.slice(0, 5))}
        </div>

        {/* Time - show if not very compact and showing title */}
        {!isVeryCompact && showExperienceTitle && (
          <div className={cn(
            'truncate leading-tight mt-0.5',
            getTextColor(),
            'opacity-80',
            isCompact ? 'text-[10px]' : 'text-xs'
          )}>
            {dragPreviewTime || session.start_time.slice(0, 5)}
            {experience && ` – ${experience.duration_minutes}min`}
          </div>
        )}

        {/* Booking status - show if enough space */}
        {!isCompact && (
          <div className={cn(
            'text-xs mt-auto pt-1',
            getTextColor(),
            'opacity-70'
          )}>
            {isFull ? (
              <span className="font-medium">Full</span>
            ) : (
              <span>{bookingsCount}/{session.spots_total} booked</span>
            )}
          </div>
        )}

        {/* Compact booking indicator */}
        {isCompact && !isVeryCompact && (
          <div className={cn(
            'text-[10px] mt-0.5',
            getTextColor(),
            'opacity-70'
          )}>
            {bookingsCount}/{session.spots_total}
          </div>
        )}
      </div>
    </div>
  );
}
