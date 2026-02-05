import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SessionPillProps {
  session: {
    id: string;
    start_time: string;
    spots_total: number;
    spots_available: number;
    session_status: string;
    price_override_cents: number | null;
    price_note: string | null;
    experience?: {
      title: string;
    };
  };
  showExperienceTitle?: boolean;
}

export function SessionPill({ session, showExperienceTitle = false }: SessionPillProps) {
  const navigate = useNavigate();
  const bookingsCount = session.spots_total - session.spots_available;
  const hasCustomPrice = session.price_override_cents !== null;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/supplier/sessions/${session.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left px-2 py-1 rounded text-xs transition-colors cursor-pointer',
        session.session_status === 'available' && 'bg-success/10 hover:bg-success/20 text-success',
        session.session_status === 'full' && 'bg-warning/10 hover:bg-warning/20 text-warning',
        session.session_status === 'cancelled' && 'bg-muted/50 hover:bg-muted text-muted-foreground line-through'
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
          {bookingsCount}/{session.spots_total}
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
