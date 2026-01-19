/**
 * Get today's date as YYYY-MM-DD string in local timezone
 */
export function getTodayLocal(): string {
  const now = new Date();
  return formatDateLocal(now);
}

/**
 * Get today's date as YYYY-MM-DD string for a specific timezone
 * This is critical for server-side code to calculate the correct "today"
 * for users in different timezones.
 */
export function getTodayForTimezone(timezone: string): string {
  const now = new Date();
  // Using 'en-CA' locale because it outputs dates in YYYY-MM-DD format
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
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

/**
 * Format a date string (YYYY-MM-DD) for display in local timezone
 * This prevents timezone shift issues when displaying dates
 */
export function formatDateStringForDisplay(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = parseDateLocal(dateStr);
  return date.toLocaleDateString(undefined, options);
}

/**
 * Get the start and end of a day in a specific timezone as ISO UTC strings.
 * This is needed for querying TIMESTAMPTZ columns with timezone awareness.
 *
 * Example: For "2026-01-17" in "America/Los_Angeles" (UTC-8):
 * - start: "2026-01-17T08:00:00.000Z" (midnight PST = 8 AM UTC)
 * - end: "2026-01-18T07:59:59.999Z" (11:59:59 PM PST = 7:59 AM next day UTC)
 */
export function getDayBoundsUTC(dateStr: string, timezone: string): { start: string; end: string } {
  // Parse the date string
  const [year, month, day] = dateStr.split('-').map(Number);

  // Create a date string that represents midnight in the target timezone
  // We use Intl.DateTimeFormat to find the UTC offset for this timezone
  const testDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)); // noon UTC as a safe starting point

  // Get parts in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Calculate the offset by finding when midnight occurs in the target timezone
  // We do this by creating dates and checking what they look like in the target TZ

  // Start with a guess: midnight on the given date in UTC
  let startGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  // Check what date/time this appears as in the target timezone
  const parts = formatter.formatToParts(startGuess);
  const partsObj: Record<string, string> = {};
  for (const part of parts) {
    partsObj[part.type] = part.value;
  }

  // Calculate the timezone offset in milliseconds
  // If startGuess (midnight UTC) shows as a different date/time in target TZ,
  // we need to adjust
  const localHour = parseInt(partsObj.hour || '0');
  const localDay = parseInt(partsObj.day || '0');

  // Adjust to find actual midnight in target timezone
  let offsetHours = 0;
  if (localDay > day || (localDay === 1 && day > 20)) {
    // We're ahead - timezone is positive (east of UTC)
    offsetHours = localHour;
  } else if (localDay < day || (localDay > 20 && day === 1)) {
    // We're behind - timezone is negative (west of UTC)
    offsetHours = localHour - 24;
  } else {
    offsetHours = localHour;
  }

  // Calculate actual midnight and end of day in target timezone as UTC
  const midnightUTC = new Date(Date.UTC(year, month - 1, day, -offsetHours, 0, 0, 0));
  const endOfDayUTC = new Date(Date.UTC(year, month - 1, day, -offsetHours + 23, 59, 59, 999));

  return {
    start: midnightUTC.toISOString(),
    end: endOfDayUTC.toISOString(),
  };
}
