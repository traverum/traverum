import { format, parseISO, isBefore, isAfter, differenceInCalendarDays } from 'date-fns';
import type { CalendarRental } from '@/hooks/useCalendarRentals';

/** Converts yyyy-MM-dd to dd.MM.yyyy */
export function formatEuropeanDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd.MM.yyyy');
}

// Shared calendar constants and utilities

/** Business hours: 7am to 11pm */
export const START_HOUR = 7;
export const END_HOUR = 23;
export const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
export const HOUR_HEIGHT = 64;
export const MINUTE_HEIGHT = HOUR_HEIGHT / 60;

/** Pre-computed time labels — avoids creating Date objects on every render */
export const TIME_LABELS: string[] = HOURS.map(hour =>
  `${hour.toString().padStart(2, '0')}:00`
);

/** Convert Y pixel position (relative to grid top) to a time string snapped to 15-minute intervals */
export function yToTime(y: number): string {
  const totalMinutes = (y / MINUTE_HEIGHT) + (START_HOUR * 60);
  const roundedMinutes = Math.round(totalMinutes / 15) * 15;
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  const clampedHours = Math.max(START_HOUR, Math.min(22, hours));
  return `${clampedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/** Convert a time string (HH:MM) to Y pixel position */
export function timeToY(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return ((hours - START_HOUR) * 60 + minutes) * MINUTE_HEIGHT;
}

// ─── Experience Color System ─────────────────────────────────────────────────
// Deterministic color per experience ID. Zero config, works immediately.
// Each color has light/dark mode variants for: solid fill (booked), ghost fill
// (available), border accent, and readable text.

interface ExperienceColorSet {
  /** Solid background for booked sessions */
  bgSolid: string;
  /** Very light / ghost background for available sessions */
  bgGhost: string;
  /** Left border accent */
  border: string;
  /** Readable text on solid bg */
  textSolid: string;
  /** Readable text on ghost bg */
  textGhost: string;
  /** Small dot color for dropdowns/legends */
  dot: string;

  // Dark mode
  darkBgSolid: string;
  darkBgGhost: string;
  darkBorder: string;
  darkTextSolid: string;
  darkTextGhost: string;
  darkDot: string;
}

const EXPERIENCE_PALETTE: ExperienceColorSet[] = [
  { // Olive — the Traverum color
    bgSolid: 'rgb(200, 212, 188)', bgGhost: 'rgba(200, 212, 188, 0.18)',
    border: 'rgb(95, 110, 75)', textSolid: 'rgb(52, 62, 40)', textGhost: 'rgb(82, 95, 68)',
    dot: 'rgb(95, 110, 75)',
    darkBgSolid: 'rgba(95, 110, 75, 0.32)', darkBgGhost: 'rgba(95, 110, 75, 0.10)',
    darkBorder: 'rgb(130, 148, 108)', darkTextSolid: 'rgb(192, 208, 178)', darkTextGhost: 'rgb(148, 165, 132)',
    darkDot: 'rgb(130, 148, 108)',
  },
  { // Terracotta — warm earth orange
    bgSolid: 'rgb(225, 198, 182)', bgGhost: 'rgba(225, 198, 182, 0.18)',
    border: 'rgb(175, 115, 82)', textSolid: 'rgb(102, 55, 32)', textGhost: 'rgb(148, 95, 68)',
    dot: 'rgb(175, 115, 82)',
    darkBgSolid: 'rgba(175, 115, 82, 0.32)', darkBgGhost: 'rgba(175, 115, 82, 0.10)',
    darkBorder: 'rgb(198, 142, 108)', darkTextSolid: 'rgb(228, 198, 178)', darkTextGhost: 'rgb(190, 152, 128)',
    darkDot: 'rgb(198, 142, 108)',
  },
  { // Gold — muted amber
    bgSolid: 'rgb(228, 216, 178)', bgGhost: 'rgba(228, 216, 178, 0.18)',
    border: 'rgb(178, 148, 68)', textSolid: 'rgb(98, 78, 28)', textGhost: 'rgb(138, 115, 52)',
    dot: 'rgb(178, 148, 68)',
    darkBgSolid: 'rgba(178, 148, 68, 0.32)', darkBgGhost: 'rgba(178, 148, 68, 0.10)',
    darkBorder: 'rgb(198, 172, 95)', darkTextSolid: 'rgb(228, 215, 178)', darkTextGhost: 'rgb(188, 170, 125)',
    darkDot: 'rgb(198, 172, 95)',
  },
  { // Sage — soft green, lighter than olive
    bgSolid: 'rgb(195, 215, 200)', bgGhost: 'rgba(195, 215, 200, 0.18)',
    border: 'rgb(95, 135, 108)', textSolid: 'rgb(42, 68, 52)', textGhost: 'rgb(75, 112, 88)',
    dot: 'rgb(95, 135, 108)',
    darkBgSolid: 'rgba(95, 135, 108, 0.32)', darkBgGhost: 'rgba(95, 135, 108, 0.10)',
    darkBorder: 'rgb(128, 165, 138)', darkTextSolid: 'rgb(188, 212, 195)', darkTextGhost: 'rgb(145, 172, 152)',
    darkDot: 'rgb(128, 165, 138)',
  },
  { // Walnut — deep warm brown
    bgSolid: 'rgb(218, 202, 188)', bgGhost: 'rgba(218, 202, 188, 0.18)',
    border: 'rgb(118, 85, 58)', textSolid: 'rgb(72, 48, 30)', textGhost: 'rgb(108, 82, 58)',
    dot: 'rgb(118, 85, 58)',
    darkBgSolid: 'rgba(118, 85, 58, 0.32)', darkBgGhost: 'rgba(118, 85, 58, 0.10)',
    darkBorder: 'rgb(152, 118, 88)', darkTextSolid: 'rgb(218, 202, 185)', darkTextGhost: 'rgb(175, 155, 135)',
    darkDot: 'rgb(152, 118, 88)',
  },
  { // Moss — earthy yellow-green
    bgSolid: 'rgb(212, 215, 188)', bgGhost: 'rgba(212, 215, 188, 0.18)',
    border: 'rgb(118, 122, 72)', textSolid: 'rgb(62, 65, 35)', textGhost: 'rgb(98, 102, 58)',
    dot: 'rgb(118, 122, 72)',
    darkBgSolid: 'rgba(118, 122, 72, 0.32)', darkBgGhost: 'rgba(118, 122, 72, 0.10)',
    darkBorder: 'rgb(148, 155, 98)', darkTextSolid: 'rgb(208, 212, 185)', darkTextGhost: 'rgb(162, 168, 128)',
    darkDot: 'rgb(148, 155, 98)',
  },
  { // Sienna — warm reddish-brown
    bgSolid: 'rgb(222, 198, 192)', bgGhost: 'rgba(222, 198, 192, 0.18)',
    border: 'rgb(158, 105, 88)', textSolid: 'rgb(92, 48, 38)', textGhost: 'rgb(138, 88, 72)',
    dot: 'rgb(158, 105, 88)',
    darkBgSolid: 'rgba(158, 105, 88, 0.32)', darkBgGhost: 'rgba(158, 105, 88, 0.10)',
    darkBorder: 'rgb(182, 132, 112)', darkTextSolid: 'rgb(225, 198, 188)', darkTextGhost: 'rgb(182, 148, 135)',
    darkDot: 'rgb(182, 132, 112)',
  },
  { // Stone — warm neutral gray
    bgSolid: 'rgb(215, 210, 202)', bgGhost: 'rgba(215, 210, 202, 0.18)',
    border: 'rgb(128, 118, 105)', textSolid: 'rgb(68, 62, 52)', textGhost: 'rgb(108, 100, 88)',
    dot: 'rgb(128, 118, 105)',
    darkBgSolid: 'rgba(128, 118, 105, 0.32)', darkBgGhost: 'rgba(128, 118, 105, 0.10)',
    darkBorder: 'rgb(158, 148, 132)', darkTextSolid: 'rgb(212, 206, 198)', darkTextGhost: 'rgb(170, 162, 148)',
    darkDot: 'rgb(158, 148, 132)',
  },
];

/** Simple hash function for stable color assignment */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a deterministic color set for an experience ID.
 * Same ID always returns the same color. Zero config.
 */
export function getExperienceColor(experienceId: string): ExperienceColorSet {
  const index = hashString(experienceId) % EXPERIENCE_PALETTE.length;
  return EXPERIENCE_PALETTE[index];
}

/** Get just the dot color for legends/dropdowns */
export function getExperienceDotColor(experienceId: string): string {
  return getExperienceColor(experienceId).dot;
}

// ─── Multi-Day Rental Bar Layout ────────────────────────────────────────────
// Pure functions for splitting rentals into per-week segments and packing
// them into rows using a greedy first-fit algorithm.

export interface BarSegment {
  rentalId: string;
  rental: CalendarRental;
  startCol: number;  // 1-based for CSS grid
  span: number;      // number of columns to span
  row: number;       // assigned by packSegmentsIntoRows
  isStart: boolean;  // rental truly starts in this week
  isEnd: boolean;    // rental truly ends in this week
}

/**
 * Convert one rental into a bar segment for a given week.
 * Returns null if the rental doesn't overlap this week.
 * rentalEndDate is inclusive (last active day of the rental).
 */
export function splitRentalIntoSegment(
  rental: CalendarRental,
  weekDays: Date[],
): Omit<BarSegment, 'row'> | null {
  const weekStartStr = format(weekDays[0], 'yyyy-MM-dd');
  const weekEndStr = format(weekDays[6], 'yyyy-MM-dd');

  if (rental.rentalStartDate > weekEndStr || rental.rentalEndDate < weekStartStr) {
    return null;
  }

  const rentalStart = parseISO(rental.rentalStartDate);
  const rentalEnd = parseISO(rental.rentalEndDate);

  const isStart = !isBefore(rentalStart, weekDays[0]);
  const isEnd = !isAfter(rentalEnd, weekDays[6]);

  const startCol = isStart
    ? weekDays.findIndex(d => format(d, 'yyyy-MM-dd') === rental.rentalStartDate) + 1
    : 1;

  const endColExclusive = isEnd
    ? weekDays.findIndex(d => format(d, 'yyyy-MM-dd') === rental.rentalEndDate) + 2
    : 8;

  const span = endColExclusive - startCol;
  if (span <= 0) return null;

  return {
    rentalId: rental.bookingId,
    rental,
    startCol,
    span,
    isStart,
    isEnd,
  };
}

/**
 * Greedy first-fit row packing. Sort by startCol ASC, span DESC (wider first).
 * For each segment, find lowest row where all spanned columns are free.
 */
export function packSegmentsIntoRows(
  segments: Omit<BarSegment, 'row'>[],
): BarSegment[] {
  const sorted = [...segments].sort(
    (a, b) => a.startCol - b.startCol || b.span - a.span,
  );

  const occupied: Set<number>[] = Array.from({ length: 8 }, () => new Set());
  const packed: BarSegment[] = [];

  for (const seg of sorted) {
    let row = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let free = true;
      for (let c = seg.startCol; c < seg.startCol + seg.span; c++) {
        if (occupied[c]?.has(row)) { free = false; break; }
      }
      if (free) break;
      row++;
    }

    for (let c = seg.startCol; c < seg.startCol + seg.span; c++) {
      occupied[c]?.add(row);
    }
    packed.push({ ...seg, row });
  }

  return packed;
}

/** Number of visual rows needed after packing. */
export function getPackedRowCount(segments: BarSegment[]): number {
  if (segments.length === 0) return 0;
  return Math.max(...segments.map(s => s.row)) + 1;
}

/** Compute day-of-rental info: "Day X of Y". End date is inclusive. */
export function getRentalDayContext(
  rental: CalendarRental,
  date: Date,
): { dayNumber: number; totalDays: number } {
  const start = parseISO(rental.rentalStartDate);
  const end = parseISO(rental.rentalEndDate);
  const totalDays = differenceInCalendarDays(end, start) + 1;
  const dayNumber = differenceInCalendarDays(date, start) + 1;
  return { dayNumber, totalDays };
}
