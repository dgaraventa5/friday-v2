import {
  formatEventTime,
  formatEventTimeRange,
  getTodaysEvents,
  sortEventsByTime,
  calculateBusyHours,
  getEventTimelinePosition,
  getDefaultSlotColor,
} from '@/lib/utils/calendar-utils';
import { CalendarEvent, CalendarEventWithCalendar } from '@/lib/types';

describe('Calendar Utils', () => {
  const createMockEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
    id: Math.random().toString(),
    calendar_id: 'cal-1',
    external_id: 'ext-1',
    title: 'Test Event',
    description: null,
    start_time: '2025-12-15T10:00:00Z',
    end_time: '2025-12-15T11:00:00Z',
    is_all_day: false,
    status: 'busy',
    location: null,
    event_url: null,
    created_at: '2025-12-01T00:00:00Z',
    updated_at: '2025-12-01T00:00:00Z',
    ...overrides,
  });

  const createMockEventWithCalendar = (
    eventOverrides: Partial<CalendarEvent> = {},
    calendarOverrides: Partial<{ id: string; name: string; color: string; slot: string }> = {}
  ): CalendarEventWithCalendar => ({
    ...createMockEvent(eventOverrides),
    calendar: {
      id: 'cal-1',
      name: 'Test Calendar',
      color: '#3B82F6',
      slot: 'personal',
      ...calendarOverrides,
    },
  });

  describe('formatEventTime', () => {
    test('should return "All day" for all-day events', () => {
      const event = createMockEvent({ is_all_day: true });
      expect(formatEventTime(event)).toBe('All day');
    });

    test('should format time for timed events', () => {
      const event = createMockEvent({
        start_time: '2025-12-15T10:00:00Z',
        is_all_day: false,
      });
      const result = formatEventTime(event);
      // Should contain hour and AM/PM
      expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    });

    test('should work with CalendarEventWithCalendar type', () => {
      const event = createMockEventWithCalendar({ is_all_day: true });
      expect(formatEventTime(event)).toBe('All day');
    });
  });

  describe('formatEventTimeRange', () => {
    test('should return "All day" for all-day events', () => {
      const event = createMockEvent({ is_all_day: true });
      expect(formatEventTimeRange(event)).toBe('All day');
    });

    test('should format time range for timed events', () => {
      const event = createMockEvent({
        start_time: '2025-12-15T10:00:00Z',
        end_time: '2025-12-15T11:00:00Z',
        is_all_day: false,
      });
      const result = formatEventTimeRange(event);
      // Should contain start and end times with a separator
      expect(result).toContain('-');
    });
  });

  describe('getTodaysEvents', () => {
    test('should filter events to only today', () => {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

      const events: CalendarEventWithCalendar[] = [
        createMockEventWithCalendar({ start_time: `${todayStr}T10:00:00Z` }),
        createMockEventWithCalendar({ start_time: `${tomorrowStr}T10:00:00Z` }),
      ];

      const result = getTodaysEvents(events);
      expect(result).toHaveLength(1);
    });
  });

  describe('sortEventsByTime', () => {
    test('should put all-day events first', () => {
      const events: CalendarEventWithCalendar[] = [
        createMockEventWithCalendar({ start_time: '2025-12-15T14:00:00Z', is_all_day: false }),
        createMockEventWithCalendar({ start_time: '2025-12-15T00:00:00Z', is_all_day: true }),
        createMockEventWithCalendar({ start_time: '2025-12-15T09:00:00Z', is_all_day: false }),
      ];

      const result = sortEventsByTime(events);
      expect(result[0].is_all_day).toBe(true);
    });

    test('should sort timed events by start time', () => {
      const events: CalendarEventWithCalendar[] = [
        createMockEventWithCalendar({
          id: 'late',
          start_time: '2025-12-15T14:00:00Z',
          is_all_day: false
        }),
        createMockEventWithCalendar({
          id: 'early',
          start_time: '2025-12-15T09:00:00Z',
          is_all_day: false
        }),
        createMockEventWithCalendar({
          id: 'mid',
          start_time: '2025-12-15T11:00:00Z',
          is_all_day: false
        }),
      ];

      const result = sortEventsByTime(events);
      expect(result[0].id).toBe('early');
      expect(result[1].id).toBe('mid');
      expect(result[2].id).toBe('late');
    });

    test('should not mutate original array', () => {
      const events: CalendarEventWithCalendar[] = [
        createMockEventWithCalendar({ id: 'b', start_time: '2025-12-15T14:00:00Z' }),
        createMockEventWithCalendar({ id: 'a', start_time: '2025-12-15T09:00:00Z' }),
      ];

      const result = sortEventsByTime(events);
      expect(events[0].id).toBe('b'); // Original unchanged
      expect(result[0].id).toBe('a'); // Sorted copy
    });
  });

  describe('calculateBusyHours', () => {
    test('should calculate total hours from events', () => {
      const events: CalendarEventWithCalendar[] = [
        createMockEventWithCalendar({
          start_time: '2025-12-15T09:00:00Z',
          end_time: '2025-12-15T10:00:00Z', // 1 hour
          is_all_day: false,
          status: 'busy',
        }),
        createMockEventWithCalendar({
          start_time: '2025-12-15T14:00:00Z',
          end_time: '2025-12-15T15:30:00Z', // 1.5 hours
          is_all_day: false,
          status: 'busy',
        }),
      ];

      const result = calculateBusyHours(events);
      expect(result).toBe(2.5);
    });

    test('should exclude all-day events', () => {
      const events: CalendarEventWithCalendar[] = [
        createMockEventWithCalendar({
          start_time: '2025-12-15T00:00:00Z',
          end_time: '2025-12-16T00:00:00Z',
          is_all_day: true,
          status: 'busy',
        }),
      ];

      const result = calculateBusyHours(events);
      expect(result).toBe(0);
    });

    test('should exclude free events', () => {
      const events: CalendarEventWithCalendar[] = [
        createMockEventWithCalendar({
          start_time: '2025-12-15T09:00:00Z',
          end_time: '2025-12-15T10:00:00Z',
          is_all_day: false,
          status: 'free',
        }),
      ];

      const result = calculateBusyHours(events);
      expect(result).toBe(0);
    });

    test('should handle empty array', () => {
      expect(calculateBusyHours([])).toBe(0);
    });
  });

  describe('getEventTimelinePosition', () => {
    test('should return null for all-day events', () => {
      const event = createMockEvent({ is_all_day: true });
      expect(getEventTimelinePosition(event)).toBe(null);
    });

    test('should return position for timed events within grid', () => {
      // Use local timezone-aware times to ensure the event is within the grid
      const now = new Date();
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0); // 10 AM local
      const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0); // 11 AM local

      const event = createMockEvent({
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        is_all_day: false,
      });

      const result = getEventTimelinePosition(event, 8, 18); // 8 AM to 6 PM grid
      expect(result).not.toBe(null);
      expect(result?.top).toBeDefined();
      expect(result?.height).toBeDefined();
    });

    test('should return null for events outside grid', () => {
      // Use local timezone-aware times to ensure the event is outside the grid
      const now = new Date();
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0); // 6 AM local
      const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0); // 7 AM local

      const event = createMockEvent({
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        is_all_day: false,
      });

      const result = getEventTimelinePosition(event, 8, 18);
      // Event ends before grid starts (7 AM < 8 AM)
      expect(result).toBe(null);
    });
  });

  describe('getDefaultSlotColor', () => {
    test('should return blue for personal slot', () => {
      expect(getDefaultSlotColor('personal')).toBe('#3B82F6');
    });

    test('should return green for work slot', () => {
      expect(getDefaultSlotColor('work')).toBe('#10B981');
    });

    test('should return blue for unknown slot', () => {
      expect(getDefaultSlotColor('unknown')).toBe('#3B82F6');
    });
  });
});
