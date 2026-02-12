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
