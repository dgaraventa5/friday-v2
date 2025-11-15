/**
 * Get today's date as YYYY-MM-DD string in local timezone
 */
export function getTodayLocal(): string {
  const now = new Date();
  return formatDateLocal(now);
}

/**
 * Format a Date object as YYYY-MM-DD string in local timezone
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string into Date object at midnight local time
 */
export function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Compare two date strings (YYYY-MM-DD format)
 * Returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDateStrings(date1: string, date2: string): number {
  if (date1 < date2) return -1;
  if (date1 > date2) return 1;
  return 0;
}

/**
 * Check if two date strings represent the same day
 */
export function isSameDateString(date1: string, date2: string): boolean {
  return date1 === date2;
}

/**
 * Add days to a date string and return new date string in local timezone
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const date = parseDateLocal(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateLocal(date);
}

/**
 * Get day of week (0-6, Sunday = 0) for a date string
 */
export function getDayOfWeek(dateStr: string): number {
  const date = parseDateLocal(dateStr);
  return date.getDay();
}
