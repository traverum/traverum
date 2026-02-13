import { cn } from '@/lib/utils';

interface SessionPillProps {
  session: {
    id: string;
    start_time: string;
    session_status: string;
    price_override_cents: number | null;
    price_note: string | null;
    experience?: {
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
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSessionClick) {
      onSessionClick(session.id, { x: e.clientX, y: e.clientY });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left px-2 py-1 rounded text-xs transition-colors cursor-pointer',
        session.session_status === 'available' && 'bg-success/10 hover:bg-success/20 text-success',
        session.session_status === 'booked' && 'bg-primary/10 hover:bg-primary/20 text-primary',
        session.session_status === 'cancelled' && 'bg-muted/50 hover:bg-muted text-muted-foreground line-through',
        isPast && session.session_status !== 'cancelled' && 'opacity-50'
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-medium truncate">
          {session.start_time.slice(0, 5)}
          {showExperienceTitle && session.experience && (
            <span className="ml-1 opacity-70">· {session.experience.title}</span>
          )}
        </span>
        <span className="text-[10px] opacity-80">
          {isBooked ? 'Booked' : session.session_status === 'cancelled' ? 'X' : ''}
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
