import { CalendarEvent, CalendarEventWithCalendar } from '../types';
import { format, parseISO, isSameDay } from 'date-fns';

/**
 * Format event time for display
 * Returns "All day" for all-day events, or formatted time like "10 AM" or "2:30 PM"
 */
export function formatEventTime(event: CalendarEvent | CalendarEventWithCalendar): string {
  if (event.is_all_day) {
    return 'All day';
  }

  const startTime = parseISO(event.start_time);
  return format(startTime, 'h:mm a');
}

/**
 * Format event time range for display
 * Returns "All day" for all-day events, or "10 AM - 11 AM" format
 */
export function formatEventTimeRange(event: CalendarEvent | CalendarEventWithCalendar): string {
  if (event.is_all_day) {
    return 'All day';
  }

  const startTime = parseISO(event.start_time);
  const endTime = parseISO(event.end_time);

  const startFormat = startTime.getMinutes() === 0 ? 'h a' : 'h:mm a';
  const endFormat = endTime.getMinutes() === 0 ? 'h a' : 'h:mm a';

  return `${format(startTime, startFormat)} - ${format(endTime, endFormat)}`;
}

/**
 * Get today's events from a list of events
 */
export function getTodaysEvents(events: CalendarEventWithCalendar[]): CalendarEventWithCalendar[] {
  const now = new Date();
  return events.filter(event => {
    const eventStart = parseISO(event.start_time);
    return isSameDay(eventStart, now);
  });
}

/**
 * Sort events by start time
 */
export function sortEventsByTime(events: CalendarEventWithCalendar[]): CalendarEventWithCalendar[] {
  return [...events].sort((a, b) => {
    // All-day events come first
    if (a.is_all_day && !b.is_all_day) return -1;
    if (!a.is_all_day && b.is_all_day) return 1;

    // Then sort by start time
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });
}

/**
 * Calculate busy hours from events
 * Returns total hours that events span (excluding all-day events)
 */
export function calculateBusyHours(events: CalendarEventWithCalendar[]): number {
  let totalMinutes = 0;

  for (const event of events) {
    if (event.is_all_day || event.status === 'free') {
      continue;
    }

    const start = parseISO(event.start_time);
    const end = parseISO(event.end_time);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    totalMinutes += durationMinutes;
  }

  return Math.round(totalMinutes / 60 * 10) / 10; // Round to 1 decimal
}

/**
 * Get event position and height for timeline display
 * Returns CSS values for positioning events on a time grid
 */
export function getEventTimelinePosition(
  event: CalendarEvent | CalendarEventWithCalendar,
  startHour: number = 8,
  endHour: number = 18
): { top: string; height: string } | null {
  if (event.is_all_day) {
    return null;
  }

  const start = parseISO(event.start_time);
  const end = parseISO(event.end_time);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  const gridStartMinutes = startHour * 60;
  const gridEndMinutes = endHour * 60;
  const gridTotalMinutes = gridEndMinutes - gridStartMinutes;

  // Clamp to grid bounds
  const clampedStart = Math.max(startMinutes, gridStartMinutes);
  const clampedEnd = Math.min(endMinutes, gridEndMinutes);

  if (clampedStart >= clampedEnd) {
    return null; // Event outside grid
  }

  const topPercent = ((clampedStart - gridStartMinutes) / gridTotalMinutes) * 100;
  const heightPercent = ((clampedEnd - clampedStart) / gridTotalMinutes) * 100;

  return {
    top: `${topPercent}%`,
    height: `${Math.max(heightPercent, 2)}%`, // Minimum 2% height for visibility
  };
}

/**
 * Generate a hex color from a string (for consistent calendar colors)
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
  ];

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get the default color for a calendar slot
 */
export function getDefaultSlotColor(slot: string): string {
  switch (slot) {
    case 'personal':
      return '#3B82F6'; // blue
    case 'work':
      return '#10B981'; // green
    default:
      return '#3B82F6';
  }
}
