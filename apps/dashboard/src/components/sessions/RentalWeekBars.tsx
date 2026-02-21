import { useNavigate } from 'react-router-dom';
import { getExperienceColor, formatEuropeanDate } from './calendar-utils';
import type { BarSegment } from './calendar-utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface RentalWeekBarsProps {
  segments: BarSegment[];
}

export function RentalWeekBars({ segments }: RentalWeekBarsProps) {
  const navigate = useNavigate();

  if (segments.length === 0) return null;

  const isDark = typeof window !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        rowGap: 2,
      }}
    >
      {segments.map((seg) => {
        const expColor = getExperienceColor(seg.rental.experience.id);

        const borderRadius = seg.isStart && seg.isEnd
          ? '4px'
          : seg.isStart
            ? '4px 0 0 4px'
            : seg.isEnd
              ? '0 4px 4px 0'
              : '0';

        return (
          <Popover key={`${seg.rentalId}-${seg.startCol}`}>
            <PopoverTrigger asChild>
              <div
                className="flex items-center truncate pointer-events-auto"
                style={{
                  gridColumn: `${seg.startCol} / span ${seg.span}`,
                  gridRow: seg.row + 1,
                  height: 22,
                  lineHeight: '22px',
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '0 6px',
                  backgroundColor: isDark ? expColor.darkBgSolid : expColor.bgSolid,
                  color: isDark ? expColor.darkTextSolid : expColor.textSolid,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' as const,
                  cursor: 'pointer',
                  borderRadius,
                  transition: 'filter 150ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.88)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
              >
                {seg.isStart && (
                  <span className="truncate">{seg.rental.experience.title}</span>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              className="w-auto min-w-[200px] p-4"
            >
              <p className="text-sm font-medium tracking-[-0.01em]">{seg.rental.experience.title}</p>
              <p className="text-xs text-muted-foreground mt-1.5">
                {seg.rental.guestName} · {seg.rental.participants} {seg.rental.participants === 1 ? 'unit' : 'units'}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                {formatEuropeanDate(seg.rental.rentalStartDate)} → {formatEuropeanDate(seg.rental.rentalEndDate)}
              </p>
              <button
                type="button"
                className="text-xs text-primary hover:text-primary/80 font-medium tracking-[-0.01em] transition-colors mt-3"
                onClick={() => navigate('/supplier/bookings?tab=upcoming')}
              >
                View booking →
              </button>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
