/**
 * Helper utilities for date calculations across the FlexFit application.
 */

/**
 * Calculates the floating-point hours remaining until a target ISO timestamp.
 */
export function hoursUntil(iso: string, now = new Date()): number {
  return (new Date(iso).getTime() - now.getTime()) / 36e5;
}

/**
 * Returns today's date formatted as ISO date string (YYYY-MM-DD).
 */
export function todayIsoDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Adds a specified number of days to an ISO date string and returns YYYY-MM-DD.
 */
export function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
