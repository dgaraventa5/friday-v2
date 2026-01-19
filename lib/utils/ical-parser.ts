import ICAL from 'ical.js';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * Normalize calendar URL by converting webcal:// to https://
 * The webcal:// protocol is just an alias for https:// used by calendar apps
 */
export function normalizeCalendarUrl(url: string): string {
  if (url.startsWith('webcal://')) {
    return url.replace('webcal://', 'https://');
  }
  if (url.startsWith('webcals://')) {
    return url.replace('webcals://', 'https://');
  }
  return url;
}

/**
 * Preprocess iCal data to fix common formatting issues
 * Some calendar providers (like Apple) may produce iCal data with line folding issues
 */
function preprocessICalData(data: string): string {
  // Step 1: Normalize line endings to \n for easier processing
  let normalized = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Step 2: Unfold standard iCal folded lines (CRLF followed by space/tab)
  // RFC 5545: Lines are folded by inserting CRLF + single whitespace
  normalized = normalized.replace(/\n[ \t]/g, '');

  // Step 3: Fix improperly folded lines (lines without : or ; that aren't BEGIN/END)
  const lines = normalized.split('\n');
  const fixedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (line.length === 0) {
      fixedLines.push(line);
      continue;
    }

    // Check if this line looks like a broken continuation:
    // - Doesn't contain ':' or ';' (not a property line)
    // - Doesn't start with space/tab (not a properly folded continuation)
    // - Is not BEGIN: or END: (not a component boundary)
    const looksLikeBrokenContinuation =
      !line.includes(':') &&
      !line.includes(';') &&
      !line.startsWith(' ') &&
      !line.startsWith('\t') &&
      !/^(BEGIN|END):/i.test(line);

    if (looksLikeBrokenContinuation && fixedLines.length > 0) {
      // Append to the previous line (this is a broken continuation)
      fixedLines[fixedLines.length - 1] += ' ' + line;
    } else {
      fixedLines.push(line);
    }
  }

  // Step 4: Convert back to CRLF line endings (iCal standard)
  return fixedLines.join('\r\n');
}

export interface ParsedEvent {
  external_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  status: 'busy' | 'free' | 'tentative';
  location: string | null;
  event_url: string | null;
}

/**
 * Parse an iCal feed and extract events within a date range
 */
export function parseICalFeed(
  icalData: string,
  rangeStart: Date,
  rangeEnd: Date
): ParsedEvent[] {
  const preprocessedData = preprocessICalData(icalData);
  const jcalData = ICAL.parse(preprocessedData);
  const comp = new ICAL.Component(jcalData);
  const events: ParsedEvent[] = [];

  const vevents = comp.getAllSubcomponents('vevent');

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);

    // Handle recurring events
    if (event.isRecurring()) {
      const occurrences = getRecurringOccurrences(event, rangeStart, rangeEnd);
      events.push(...occurrences);
    } else {
      // Single event
      const parsed = parseEvent(event);
      if (parsed && isEventInRange(parsed, rangeStart, rangeEnd)) {
        events.push(parsed);
      }
    }
  }

  return events;
}

/**
 * Parse a single ICAL.Event into our format
 */
function parseEvent(event: ICAL.Event, occurrence?: ICAL.Time): ParsedEvent | null {
  try {
    const startDate = occurrence || event.startDate;
    const endDate = occurrence
      ? startDate.clone()
      : event.endDate || startDate.clone();

    // Calculate duration if using occurrence
    if (occurrence && event.endDate) {
      const duration = event.endDate.subtractDate(event.startDate);
      endDate.addDuration(duration);
    }

    const isAllDay = startDate.isDate;
    const uid = event.uid;
    const summary = event.summary || 'Untitled Event';
    const description = event.description || null;
    const location = event.location || null;

    // Determine status
    let status: 'busy' | 'free' | 'tentative' = 'busy';
    const transp = event.component.getFirstPropertyValue('transp');
    if (transp === 'TRANSPARENT') {
      status = 'free';
    }
    const eventStatus = event.component.getFirstPropertyValue('status');
    if (eventStatus === 'TENTATIVE') {
      status = 'tentative';
    }

    // Generate unique ID for recurring event occurrences
    const externalId = occurrence
      ? `${uid}_${startDate.toICALString()}`
      : uid;

    // Convert to ISO strings
    const startTime = isAllDay
      ? startOfDay(startDate.toJSDate()).toISOString()
      : startDate.toJSDate().toISOString();

    const endTime = isAllDay
      ? endOfDay(endDate.toJSDate()).toISOString()
      : endDate.toJSDate().toISOString();

    return {
      external_id: externalId,
      title: summary,
      description,
      start_time: startTime,
      end_time: endTime,
      is_all_day: isAllDay,
      status,
      location,
      event_url: null, // iCal doesn't typically have URLs
    };
  } catch (error) {
    console.error('Error parsing iCal event:', error);
    return null;
  }
}

/**
 * Get occurrences of a recurring event within a date range
 */
function getRecurringOccurrences(
  event: ICAL.Event,
  rangeStart: Date,
  rangeEnd: Date
): ParsedEvent[] {
  const occurrences: ParsedEvent[] = [];

  try {
    const iterator = event.iterator();
    let next: ICAL.Time | null;
    let count = 0;
    const maxOccurrences = 365; // Limit to prevent infinite loops

    while ((next = iterator.next()) && count < maxOccurrences) {
      const jsDate = next.toJSDate();

      // Skip if before range
      if (jsDate < rangeStart) {
        count++;
        continue;
      }

      // Stop if after range
      if (jsDate > rangeEnd) {
        break;
      }

      const parsed = parseEvent(event, next);
      if (parsed) {
        occurrences.push(parsed);
      }

      count++;
    }
  } catch (error) {
    console.error('Error getting recurring occurrences:', error);
  }

  return occurrences;
}

/**
 * Check if an event falls within a date range
 */
function isEventInRange(event: ParsedEvent, rangeStart: Date, rangeEnd: Date): boolean {
  const eventStart = new Date(event.start_time);
  const eventEnd = new Date(event.end_time);

  // Event overlaps with range if:
  // event starts before range ends AND event ends after range starts
  return eventStart <= rangeEnd && eventEnd >= rangeStart;
}

/**
 * Validate that a URL returns valid iCal data
 */
export async function validateICalUrl(url: string): Promise<{
  valid: boolean;
  error?: string;
  calendarName?: string;
}> {
  try {
    const normalizedUrl = normalizeCalendarUrl(url);

    const response = await fetch(normalizedUrl, {
      headers: {
        'Accept': 'text/calendar',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return {
        valid: false,
        error: `Failed to fetch calendar: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.text();

    // Check if it looks like iCal data
    if (!data.includes('BEGIN:VCALENDAR')) {
      return {
        valid: false,
        error: 'URL does not return valid iCalendar data',
      };
    }

    // Try to parse it
    try {
      const preprocessedData = preprocessICalData(data);
      const jcalData = ICAL.parse(preprocessedData);
      const comp = new ICAL.Component(jcalData);

      // Get calendar name if available
      const calendarName = comp.getFirstPropertyValue('x-wr-calname') ||
        comp.getFirstPropertyValue('name') ||
        'Imported Calendar';

      return {
        valid: true,
        calendarName: String(calendarName),
      };
    } catch (parseError) {
      console.error('[iCal] Parse error:', parseError);
      return {
        valid: false,
        error: 'Failed to parse iCalendar data',
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to fetch calendar',
    };
  }
}

/**
 * Fetch and parse events from an iCal URL
 */
export async function fetchAndParseICalUrl(
  url: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<{
  success: boolean;
  events?: ParsedEvent[];
  error?: string;
}> {
  try {
    const normalizedUrl = normalizeCalendarUrl(url);
    const response = await fetch(normalizedUrl, {
      headers: {
        'Accept': 'text/calendar',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch calendar: ${response.status}`,
      };
    }

    const data = await response.text();

    if (!data.includes('BEGIN:VCALENDAR')) {
      return {
        success: false,
        error: 'Invalid iCalendar data',
      };
    }

    const events = parseICalFeed(data, rangeStart, rangeEnd);

    return {
      success: true,
      events,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch calendar',
    };
  }
}
