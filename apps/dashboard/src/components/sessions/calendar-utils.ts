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
  { // Sage
    bgSolid: 'rgb(200, 220, 195)', bgGhost: 'rgba(200, 220, 195, 0.18)',
    border: 'rgb(120, 150, 110)', textSolid: 'rgb(55, 75, 48)', textGhost: 'rgb(90, 115, 80)',
    dot: 'rgb(120, 150, 110)',
    darkBgSolid: 'rgba(120, 150, 110, 0.35)', darkBgGhost: 'rgba(120, 150, 110, 0.10)',
    darkBorder: 'rgb(140, 170, 130)', darkTextSolid: 'rgb(190, 215, 180)', darkTextGhost: 'rgb(155, 180, 145)',
    darkDot: 'rgb(140, 170, 130)',
  },
  { // Slate Blue
    bgSolid: 'rgb(190, 210, 225)', bgGhost: 'rgba(190, 210, 225, 0.18)',
    border: 'rgb(100, 135, 165)', textSolid: 'rgb(45, 70, 95)', textGhost: 'rgb(80, 110, 140)',
    dot: 'rgb(100, 135, 165)',
    darkBgSolid: 'rgba(100, 135, 165, 0.35)', darkBgGhost: 'rgba(100, 135, 165, 0.10)',
    darkBorder: 'rgb(125, 160, 190)', darkTextSolid: 'rgb(185, 210, 230)', darkTextGhost: 'rgb(145, 175, 200)',
    darkDot: 'rgb(125, 160, 190)',
  },
  { // Terracotta
    bgSolid: 'rgb(225, 195, 180)', bgGhost: 'rgba(225, 195, 180, 0.18)',
    border: 'rgb(180, 115, 85)', textSolid: 'rgb(105, 55, 35)', textGhost: 'rgb(155, 95, 70)',
    dot: 'rgb(180, 115, 85)',
    darkBgSolid: 'rgba(180, 115, 85, 0.35)', darkBgGhost: 'rgba(180, 115, 85, 0.10)',
    darkBorder: 'rgb(200, 140, 110)', darkTextSolid: 'rgb(230, 195, 175)', darkTextGhost: 'rgb(195, 155, 135)',
    darkDot: 'rgb(200, 140, 110)',
  },
  { // Goldenrod
    bgSolid: 'rgb(230, 215, 175)', bgGhost: 'rgba(230, 215, 175, 0.18)',
    border: 'rgb(185, 155, 75)', textSolid: 'rgb(100, 80, 30)', textGhost: 'rgb(145, 120, 55)',
    dot: 'rgb(185, 155, 75)',
    darkBgSolid: 'rgba(185, 155, 75, 0.35)', darkBgGhost: 'rgba(185, 155, 75, 0.10)',
    darkBorder: 'rgb(200, 175, 100)', darkTextSolid: 'rgb(230, 215, 180)', darkTextGhost: 'rgb(195, 175, 130)',
    darkDot: 'rgb(200, 175, 100)',
  },
  { // Plum
    bgSolid: 'rgb(210, 195, 215)', bgGhost: 'rgba(210, 195, 215, 0.18)',
    border: 'rgb(140, 110, 150)', textSolid: 'rgb(75, 50, 85)', textGhost: 'rgb(120, 90, 130)',
    dot: 'rgb(140, 110, 150)',
    darkBgSolid: 'rgba(140, 110, 150, 0.35)', darkBgGhost: 'rgba(140, 110, 150, 0.10)',
    darkBorder: 'rgb(165, 135, 175)', darkTextSolid: 'rgb(210, 195, 220)', darkTextGhost: 'rgb(175, 155, 185)',
    darkDot: 'rgb(165, 135, 175)',
  },
  { // Ocean
    bgSolid: 'rgb(185, 215, 220)', bgGhost: 'rgba(185, 215, 220, 0.18)',
    border: 'rgb(85, 140, 155)', textSolid: 'rgb(40, 80, 90)', textGhost: 'rgb(70, 120, 135)',
    dot: 'rgb(85, 140, 155)',
    darkBgSolid: 'rgba(85, 140, 155, 0.35)', darkBgGhost: 'rgba(85, 140, 155, 0.10)',
    darkBorder: 'rgb(110, 165, 180)', darkTextSolid: 'rgb(185, 215, 225)', darkTextGhost: 'rgb(140, 180, 195)',
    darkDot: 'rgb(110, 165, 180)',
  },
  { // Clay
    bgSolid: 'rgb(220, 200, 185)', bgGhost: 'rgba(220, 200, 185, 0.18)',
    border: 'rgb(165, 120, 90)', textSolid: 'rgb(90, 60, 40)', textGhost: 'rgb(140, 100, 75)',
    dot: 'rgb(165, 120, 90)',
    darkBgSolid: 'rgba(165, 120, 90, 0.35)', darkBgGhost: 'rgba(165, 120, 90, 0.10)',
    darkBorder: 'rgb(185, 145, 115)', darkTextSolid: 'rgb(225, 205, 190)', darkTextGhost: 'rgb(185, 160, 140)',
    darkDot: 'rgb(185, 145, 115)',
  },
  { // Dusty Rose
    bgSolid: 'rgb(220, 195, 200)', bgGhost: 'rgba(220, 195, 200, 0.18)',
    border: 'rgb(165, 110, 120)', textSolid: 'rgb(95, 50, 60)', textGhost: 'rgb(140, 90, 100)',
    dot: 'rgb(165, 110, 120)',
    darkBgSolid: 'rgba(165, 110, 120, 0.35)', darkBgGhost: 'rgba(165, 110, 120, 0.10)',
    darkBorder: 'rgb(185, 135, 145)', darkTextSolid: 'rgb(225, 200, 205)', darkTextGhost: 'rgb(185, 150, 160)',
    darkDot: 'rgb(185, 135, 145)',
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
