import { cn } from '@/lib/utils';
import { getLanguageName } from '@/components/LanguageSelector';
import { getExperienceColor } from './calendar-utils';

interface SessionPillProps {
  session: {
    id: string;
    start_time: string;
    session_status: string;
    session_language?: string | null;
    price_override_cents: number | null;
    price_note: string | null;
    experience?: {
      id: string;
      title: string;
    };
  };
  showExperienceTitle?: boolean;
  isPast?: boolean;
  onSessionClick?: (sessionId: string, position: { x: number; y: number }) => void;
}

export function SessionPill({ session, showExperienceTitle = false, isPast = false, onSessionClick }: SessionPillProps) {
  const hasCustomPrice = session.price_override_cents !== null;
  const isBooked = session.session_status === 'booked';
  const isCancelled = session.session_status === 'cancelled';

  // Experience color (only in multi-experience view)
  const useExpColor = showExperienceTitle && session.experience?.id;
  const expColor = useExpColor ? getExperienceColor(session.experience!.id) : null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSessionClick) {
      onSessionClick(session.id, { x: e.clientX, y: e.clientY });
    }
  };

  // Build inline styles for experience-colored pills
  const isDark = typeof window !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  const getInlineStyles = (): React.CSSProperties => {
    if (isCancelled) return {};  // Use Tailwind classes for cancelled

    if (expColor) {
      if (isBooked) {
        return {
          backgroundColor: isDark ? expColor.darkBgSolid : expColor.bgSolid,
          color: isDark ? expColor.darkTextSolid : expColor.textSolid,
          borderLeft: `3px solid ${isDark ? expColor.darkBorder : expColor.border}`,
        };
      }
      // Available — ghost style
      return {
        backgroundColor: isDark ? expColor.darkBgGhost : expColor.bgGhost,
        color: isDark ? expColor.darkTextGhost : expColor.textGhost,
        borderLeft: `3px dashed ${isDark ? expColor.darkBorder : expColor.border}`,
      };
    }

    return {};  // Use Tailwind classes for single-experience view
  };

  // For single-experience view, use Tailwind classes with the improved hierarchy
  const getTailwindClasses = () => {
    if (isCancelled) {
      return 'bg-muted/30 text-muted-foreground/50 line-through';
    }
    if (expColor) {
      // Styled via inline styles, just add base classes
      return cn(
        isBooked ? 'font-medium' : 'font-normal',
      );
    }
    // Single-experience fallback with improved hierarchy
    if (isBooked) {
      return 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-medium border-l-[3px] border-l-primary dark:border-l-primary';
    }
    // Available — ghost, like empty scaffolding
    return 'bg-primary/5 dark:bg-primary/5 text-primary/50 dark:text-primary/40 border-l-[3px] border-l-primary/30 dark:border-l-primary/20 border-dashed';
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left px-1.5 py-0.5 rounded-sm text-xs tracking-[-0.01em] transition-colors cursor-pointer',
        'hover:brightness-[0.97]',
        getTailwindClasses(),
        isPast && !isCancelled && 'opacity-50'
      )}
      style={getInlineStyles()}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate tabular-nums">
          {session.start_time.slice(0, 5)}
          {session.session_language && <span className="ml-1 opacity-70 proportional-nums">· {getLanguageName(session.session_language)}</span>}
          {showExperienceTitle && session.experience && (
            <span className="ml-1 opacity-70 proportional-nums">· {session.experience.title}</span>
          )}
        </span>
        <span className="text-[10px] opacity-60 flex-shrink-0">
          {isBooked ? 'Booked' : isCancelled ? '×' : ''}
        </span>
      </div>
      {hasCustomPrice && session.price_note && (
        <div className="text-[10px] opacity-70 truncate mt-0.5">
          {session.price_note}
        </div>
      )}
    </button>
  );
}
