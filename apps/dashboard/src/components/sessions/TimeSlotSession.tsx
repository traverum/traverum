import { cn } from '@/lib/utils';
import type { SessionWithExperience } from '@/hooks/useAllSessions';
import { isSessionUpcoming } from '@/lib/date-utils';
import { getExperienceColor } from './calendar-utils';

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
  const isBooked = session.session_status === 'booked';
  const isCancelled = session.session_status === 'cancelled';
  const isPast = !isSessionUpcoming(session.session_date, session.start_time);
  
  // Minimum heights for content display
  const minHeight = 28;
  const displayHeight = Math.max(height, minHeight);
  const isCompact = displayHeight < 48;
  const isVeryCompact = displayHeight < 36;

  // ── Color system ──────────────────────────────────────────────────────────
  // Multi-experience view: experience color is the identity, booked/available
  // is communicated through fill weight (solid vs ghost).
  // Single-experience view: simpler blue/teal scheme since there's nothing to
  // distinguish.
  const useExperienceColors = showExperienceTitle && experience;
  const expColor = useExperienceColors
    ? getExperienceColor(experience.id)
    : null;

  const getStyles = () => {
    // Cancelled — desaturated, minimal presence regardless of mode
    if (isCancelled) {
      return {
        bg: 'rgba(160, 160, 160, 0.15)',
        border: 'rgba(160, 160, 160, 0.4)',
        text: 'rgb(140, 140, 140)',
        darkBg: 'rgba(120, 120, 120, 0.12)',
        darkBorder: 'rgba(120, 120, 120, 0.3)',
        darkText: 'rgb(120, 120, 120)',
        borderStyle: 'solid' as const,
      };
    }

    if (expColor) {
      // Multi-experience: use experience palette
      return isBooked ? {
        bg: expColor.bgSolid,
        border: expColor.border,
        text: expColor.textSolid,
        darkBg: expColor.darkBgSolid,
        darkBorder: expColor.darkBorder,
        darkText: expColor.darkTextSolid,
        borderStyle: 'solid' as const,
      } : {
        bg: expColor.bgGhost,
        border: expColor.border,
        text: expColor.textGhost,
        darkBg: expColor.darkBgGhost,
        darkBorder: expColor.darkBorder,
        darkText: expColor.darkTextGhost,
        borderStyle: 'dashed' as const,
      };
    }

    // Single-experience fallback
    return isBooked ? {
      bg: 'rgb(191, 219, 254)',       // blue-200
      border: 'rgb(59, 130, 246)',     // blue-500
      text: 'rgb(30, 64, 175)',        // blue-800
      darkBg: 'rgba(59, 130, 246, 0.30)',
      darkBorder: 'rgb(96, 165, 250)',
      darkText: 'rgb(191, 219, 254)',
      borderStyle: 'solid' as const,
    } : {
      bg: 'rgba(153, 246, 228, 0.18)',  // teal ghost
      border: 'rgb(13, 148, 136)',       // teal-600
      text: 'rgb(17, 94, 89)',           // teal-800
      darkBg: 'rgba(20, 184, 166, 0.10)',
      darkBorder: 'rgb(45, 212, 191)',
      darkText: 'rgb(153, 246, 228)',
      borderStyle: 'dashed' as const,
    };
  };

  const styles = getStyles();

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

  // Detect dark mode via CSS custom property check
  const isDarkMode = typeof window !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  const bgColor = isDarkMode ? styles.darkBg : styles.bg;
  const borderColor = isDarkMode ? styles.darkBorder : styles.border;
  const textColor = isDarkMode ? styles.darkText : styles.text;

  return (
    <div
      className={cn(
        'absolute rounded-sm pointer-events-auto overflow-hidden',
        'hover:brightness-[0.97] hover:z-10 transition-all duration-100',
        isCancelled && 'opacity-40',
        !isCancelled && isPast && 'opacity-50',
        isBeingDragged && 'shadow-lg z-50 ring-2 ring-primary/50 scale-[1.01]',
        isDragging && !isBeingDragged && 'opacity-30',
        !isCancelled && !isBooked && 'cursor-grab active:cursor-grabbing',
        (isCancelled || isBooked) && 'cursor-pointer'
      )}
      style={{
        top: `${top + 1}px`,
        left: `${left}%`,
        width: `calc(${width}% - 4px)`,
        height: `${displayHeight - 2}px`,
        marginLeft: '2px',
        backgroundColor: bgColor,
        borderLeft: `4px ${styles.borderStyle} ${borderColor}`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={cn(
        'h-full flex flex-col',
        isVeryCompact ? 'px-1.5 py-0.5' : isCompact ? 'px-2 py-1' : 'px-2.5 py-1.5'
      )}>
        {/* Title - always show */}
        <div
          className={cn(
            'font-medium truncate leading-tight tracking-[-0.01em]',
            isCancelled && 'line-through',
            isVeryCompact ? 'text-[10px]' : isCompact ? 'text-xs' : 'text-[13px]'
          )}
          style={{ color: textColor }}
        >
          {showExperienceTitle && experience ? experience.title : (dragPreviewTime || session.start_time.slice(0, 5))}
        </div>

        {/* Time - show if not very compact and showing title */}
        {!isVeryCompact && showExperienceTitle && (
          <div
            className={cn(
              'truncate leading-tight mt-0.5 opacity-75 tabular-nums tracking-[-0.01em]',
              isCompact ? 'text-[10px]' : 'text-xs'
            )}
            style={{ color: textColor }}
          >
            {dragPreviewTime || session.start_time.slice(0, 5)}
            {experience && ` – ${experience.duration_minutes}min`}
          </div>
        )}

        {/* Booking status - show if enough space */}
        {!isCompact && (
          <div
            className="text-xs mt-auto pt-1 opacity-60"
            style={{ color: textColor }}
          >
            {isBooked ? 'Booked' : isCancelled ? 'Cancelled' : 'Open'}
          </div>
        )}

        {/* Compact booking indicator */}
        {isCompact && !isVeryCompact && (
          <div
            className="text-[10px] mt-0.5 opacity-60"
            style={{ color: textColor }}
          >
            {isBooked ? 'Booked' : isCancelled ? '—' : 'Open'}
          </div>
        )}
      </div>
    </div>
  );
}
