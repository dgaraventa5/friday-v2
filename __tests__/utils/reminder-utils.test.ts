import {
  isReminderScheduledForDate,
  getTodaysReminders,
  getRecurrenceLabel,
  formatTimeLabel,
  getDayOfWeekName,
  getNthWeekdayLabel,
} from '@/lib/utils/reminder-utils';
import { Reminder, ReminderCompletion, ReminderWithStatus } from '@/lib/types';

// Mock date utilities to ensure consistent test results
jest.mock('@/lib/utils/date-utils', () => ({
  getTodayLocal: jest.fn(() => '2025-12-13'), // Saturday
  parseDateLocal: jest.fn((dateStr: string) => new Date(dateStr + 'T00:00:00')),
  getDayOfWeek: jest.fn((dateStr: string) => new Date(dateStr).getDay()),
}));

describe('Reminder Utils', () => {
  const createMockReminder = (overrides: Partial<Reminder>): Reminder => ({
    id: Math.random().toString(),
    user_id: 'test-user',
    title: 'Test Reminder',
    time_label: null,
    recurrence_type: 'daily',
    recurrence_interval: 1,
    recurrence_days: null,
    monthly_type: null,
    monthly_week_position: null,
    end_type: 'never',
    end_count: null,
    current_count: 0,
    is_active: true,
    created_at: '2025-12-01T10:00:00Z',
    updated_at: '2025-12-01T10:00:00Z',
    ...overrides,
  });

  const createMockCompletion = (overrides: Partial<ReminderCompletion>): ReminderCompletion => ({
    id: Math.random().toString(),
    reminder_id: 'test-reminder',
    completion_date: '2025-12-13',
    status: 'completed',
    completed_at: '2025-12-13T10:00:00Z',
    ...overrides,
  });

  describe('isReminderScheduledForDate', () => {
    describe('Daily Recurrence', () => {
      test('should match every day for daily interval 1', () => {
        const reminder = createMockReminder({
          recurrence_type: 'daily',
          recurrence_interval: 1,
          created_at: '2025-12-01T10:00:00Z',
        });

        expect(isReminderScheduledForDate(reminder, '2025-12-01')).toBe(true);
        expect(isReminderScheduledForDate(reminder, '2025-12-02')).toBe(true);
        expect(isReminderScheduledForDate(reminder, '2025-12-13')).toBe(true);
      });

      test('should match every other day for daily interval 2', () => {
        const reminder = createMockReminder({
          recurrence_type: 'daily',
          recurrence_interval: 2,
          created_at: '2025-12-01T10:00:00Z',
        });

        expect(isReminderScheduledForDate(reminder, '2025-12-01')).toBe(true);
        expect(isReminderScheduledForDate(reminder, '2025-12-02')).toBe(false);
        expect(isReminderScheduledForDate(reminder, '2025-12-03')).toBe(true);
        expect(isReminderScheduledForDate(reminder, '2025-12-04')).toBe(false);
      });

      test('should match every 3rd day for daily interval 3', () => {
        const reminder = createMockReminder({
          recurrence_type: 'daily',
          recurrence_interval: 3,
          created_at: '2025-12-01T10:00:00Z',
        });

        expect(isReminderScheduledForDate(reminder, '2025-12-01')).toBe(true);
        expect(isReminderScheduledForDate(reminder, '2025-12-02')).toBe(false);
        expect(isReminderScheduledForDate(reminder, '2025-12-03')).toBe(false);
        expect(isReminderScheduledForDate(reminder, '2025-12-04')).toBe(true);
      });

      test('should not match dates before creation', () => {
        const reminder = createMockReminder({
          recurrence_type: 'daily',
          recurrence_interval: 1,
          created_at: '2025-12-10T10:00:00Z',
        });

        expect(isReminderScheduledForDate(reminder, '2025-12-09')).toBe(false);
        expect(isReminderScheduledForDate(reminder, '2025-12-10')).toBe(true);
      });
    });

    describe('Weekly Recurrence', () => {
      test('should match specific days of the week', () => {
        const reminder = createMockReminder({
          recurrence_type: 'weekly',
          recurrence_interval: 1,
          recurrence_days: [1, 3, 5], // Mon, Wed, Fri
          created_at: '2025-12-01T10:00:00Z',
        });

        // 2025-12-08 is Monday
        expect(isReminderScheduledForDate(reminder, '2025-12-08')).toBe(true);
        // 2025-12-09 is Tuesday
        expect(isReminderScheduledForDate(reminder, '2025-12-09')).toBe(false);
        // 2025-12-10 is Wednesday
        expect(isReminderScheduledForDate(reminder, '2025-12-10')).toBe(true);
        // 2025-12-12 is Friday
        expect(isReminderScheduledForDate(reminder, '2025-12-12')).toBe(true);
      });

      test('should handle bi-weekly recurrence', () => {
        const reminder = createMockReminder({
          recurrence_type: 'weekly',
          recurrence_interval: 2,
          recurrence_days: [1], // Monday
          created_at: '2025-12-01T10:00:00Z', // Monday
        });

        // 2025-12-01 is Monday - first week
        expect(isReminderScheduledForDate(reminder, '2025-12-01')).toBe(true);
        // 2025-12-08 is Monday - second week (should not match)
        expect(isReminderScheduledForDate(reminder, '2025-12-08')).toBe(false);
        // 2025-12-15 is Monday - third week (should match)
        expect(isReminderScheduledForDate(reminder, '2025-12-15')).toBe(true);
      });

      test('should return false if no days specified', () => {
        const reminder = createMockReminder({
          recurrence_type: 'weekly',
          recurrence_interval: 1,
          recurrence_days: [],
        });

        expect(isReminderScheduledForDate(reminder, '2025-12-13')).toBe(false);
      });
    });

    describe('Monthly Recurrence', () => {
      test('should match specific day of month', () => {
        const reminder = createMockReminder({
          recurrence_type: 'monthly',
          recurrence_interval: 1,
          monthly_type: 'day_of_month',
          recurrence_days: [15],
          created_at: '2025-12-01T10:00:00Z',
        });

        expect(isReminderScheduledForDate(reminder, '2025-12-15')).toBe(true);
        expect(isReminderScheduledForDate(reminder, '2025-12-14')).toBe(false);
        expect(isReminderScheduledForDate(reminder, '2025-12-16')).toBe(false);
      });

      test('should match nth weekday of month', () => {
        // Second Saturday of December 2025 is 12/13
        const reminder = createMockReminder({
          recurrence_type: 'monthly',
          recurrence_interval: 1,
          monthly_type: 'nth_weekday',
          recurrence_days: [6], // Saturday
          monthly_week_position: 2, // Second
          created_at: '2025-12-01T10:00:00Z',
        });

        // 2025-12-13 is the 2nd Saturday
        expect(isReminderScheduledForDate(reminder, '2025-12-13')).toBe(true);
        // 2025-12-06 is the 1st Saturday
        expect(isReminderScheduledForDate(reminder, '2025-12-06')).toBe(false);
      });

      test('should match last weekday of month', () => {
        const reminder = createMockReminder({
          recurrence_type: 'monthly',
          recurrence_interval: 1,
          monthly_type: 'nth_weekday',
          recurrence_days: [0], // Sunday
          monthly_week_position: -1, // Last
          created_at: '2025-12-01T10:00:00Z',
        });

        // 2025-12-28 is the last Sunday of December
        expect(isReminderScheduledForDate(reminder, '2025-12-28')).toBe(true);
        // 2025-12-21 is not the last Sunday
        expect(isReminderScheduledForDate(reminder, '2025-12-21')).toBe(false);
      });
    });

    describe('Inactive and Ended Reminders', () => {
      test('should not match inactive reminders', () => {
        const reminder = createMockReminder({
          is_active: false,
          recurrence_type: 'daily',
          recurrence_interval: 1,
        });

        expect(isReminderScheduledForDate(reminder, '2025-12-13')).toBe(false);
      });

      test('should not match reminders that have ended (after N occurrences)', () => {
        const reminder = createMockReminder({
          recurrence_type: 'daily',
          recurrence_interval: 1,
          end_type: 'after',
          end_count: 5,
          current_count: 5, // Already completed 5 times
        });

        expect(isReminderScheduledForDate(reminder, '2025-12-13')).toBe(false);
      });

      test('should match reminders that have not yet reached end count', () => {
        const reminder = createMockReminder({
          recurrence_type: 'daily',
          recurrence_interval: 1,
          end_type: 'after',
          end_count: 5,
          current_count: 3, // Only 3 of 5 completed
          created_at: '2025-12-01T10:00:00Z',
        });

        expect(isReminderScheduledForDate(reminder, '2025-12-13')).toBe(true);
      });
    });
  });

  describe('getTodaysReminders', () => {
    test('should return reminders scheduled for today with their status', () => {
      const reminders: Reminder[] = [
        createMockReminder({
          id: 'reminder-1',
          title: 'Daily Reminder',
          recurrence_type: 'daily',
          recurrence_interval: 1,
          created_at: '2025-12-01T10:00:00Z',
        }),
      ];

      const completions: ReminderCompletion[] = [
        createMockCompletion({
          reminder_id: 'reminder-1',
          completion_date: '2025-12-13',
          status: 'completed',
        }),
      ];

      const result = getTodaysReminders(reminders, completions);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('reminder-1');
      expect(result[0].todayStatus).toBe('completed');
    });

    test('should return incomplete status when no completion exists', () => {
      const reminders: Reminder[] = [
        createMockReminder({
          id: 'reminder-1',
          recurrence_type: 'daily',
          recurrence_interval: 1,
          created_at: '2025-12-01T10:00:00Z',
        }),
      ];

      const result = getTodaysReminders(reminders, []);

      expect(result).toHaveLength(1);
      expect(result[0].todayStatus).toBe('incomplete');
    });

    test('should return skipped status for skipped reminders', () => {
      const reminders: Reminder[] = [
        createMockReminder({
          id: 'reminder-1',
          recurrence_type: 'daily',
          recurrence_interval: 1,
          created_at: '2025-12-01T10:00:00Z',
        }),
      ];

      const completions: ReminderCompletion[] = [
        createMockCompletion({
          reminder_id: 'reminder-1',
          completion_date: '2025-12-13',
          status: 'skipped',
        }),
      ];

      const result = getTodaysReminders(reminders, completions);

      expect(result).toHaveLength(1);
      expect(result[0].todayStatus).toBe('skipped');
    });

    test('should filter out reminders not scheduled for today', () => {
      const reminders: Reminder[] = [
        createMockReminder({
          id: 'reminder-1',
          recurrence_type: 'weekly',
          recurrence_interval: 1,
          recurrence_days: [1], // Monday only, today is Saturday
          created_at: '2025-12-01T10:00:00Z',
        }),
      ];

      const result = getTodaysReminders(reminders, []);

      expect(result).toHaveLength(0);
    });

    test('should sort by time_label first, then by title', () => {
      const reminders: Reminder[] = [
        createMockReminder({
          id: 'reminder-3',
          title: 'Zebra',
          time_label: null,
          recurrence_type: 'daily',
          recurrence_interval: 1,
          created_at: '2025-12-01T10:00:00Z',
        }),
        createMockReminder({
          id: 'reminder-1',
          title: 'Morning Task',
          time_label: '08:00:00',
          recurrence_type: 'daily',
          recurrence_interval: 1,
          created_at: '2025-12-01T10:00:00Z',
        }),
        createMockReminder({
          id: 'reminder-2',
          title: 'Afternoon Task',
          time_label: '14:00:00',
          recurrence_type: 'daily',
          recurrence_interval: 1,
          created_at: '2025-12-01T10:00:00Z',
        }),
        createMockReminder({
          id: 'reminder-4',
          title: 'Alpha',
          time_label: null,
          recurrence_type: 'daily',
          recurrence_interval: 1,
          created_at: '2025-12-01T10:00:00Z',
        }),
      ];

      const result = getTodaysReminders(reminders, []);

      // Time-labeled reminders first (sorted by time)
      expect(result[0].title).toBe('Morning Task');
      expect(result[1].title).toBe('Afternoon Task');
      // Then no-time reminders (sorted by title)
      expect(result[2].title).toBe('Alpha');
      expect(result[3].title).toBe('Zebra');
    });

    test('should only consider completions for today', () => {
      const reminders: Reminder[] = [
        createMockReminder({
          id: 'reminder-1',
          recurrence_type: 'daily',
          recurrence_interval: 1,
          created_at: '2025-12-01T10:00:00Z',
        }),
      ];

      const completions: ReminderCompletion[] = [
        createMockCompletion({
          reminder_id: 'reminder-1',
          completion_date: '2025-12-12', // Yesterday, not today
          status: 'completed',
        }),
      ];

      const result = getTodaysReminders(reminders, completions);

      expect(result).toHaveLength(1);
      expect(result[0].todayStatus).toBe('incomplete'); // Yesterday's completion doesn't count
    });
  });

  describe('getRecurrenceLabel', () => {
    test('should return "Daily" for interval 1', () => {
      const reminder = createMockReminder({
        recurrence_type: 'daily',
        recurrence_interval: 1,
      });

      expect(getRecurrenceLabel(reminder)).toBe('Daily');
    });

    test('should return "Every N days" for interval > 1', () => {
      const reminder = createMockReminder({
        recurrence_type: 'daily',
        recurrence_interval: 3,
      });

      expect(getRecurrenceLabel(reminder)).toBe('Every 3 days');
    });

    test('should return weekly label with days', () => {
      const reminder = createMockReminder({
        recurrence_type: 'weekly',
        recurrence_interval: 1,
        recurrence_days: [1, 3, 5], // Mon, Wed, Fri
      });

      expect(getRecurrenceLabel(reminder)).toBe('Weekly on Mon, Wed, Fri');
    });

    test('should return bi-weekly label with days', () => {
      const reminder = createMockReminder({
        recurrence_type: 'weekly',
        recurrence_interval: 2,
        recurrence_days: [1], // Monday
      });

      expect(getRecurrenceLabel(reminder)).toBe('Every 2 weeks on Mon');
    });

    test('should return monthly day-of-month label', () => {
      const reminder = createMockReminder({
        recurrence_type: 'monthly',
        recurrence_interval: 1,
        monthly_type: 'day_of_month',
        recurrence_days: [15],
      });

      expect(getRecurrenceLabel(reminder)).toBe('Monthly on the 15th');
    });

    test('should return monthly nth-weekday label', () => {
      const reminder = createMockReminder({
        recurrence_type: 'monthly',
        recurrence_interval: 1,
        monthly_type: 'nth_weekday',
        recurrence_days: [1], // Monday
        monthly_week_position: 2, // Second
      });

      expect(getRecurrenceLabel(reminder)).toBe('Monthly on the second Monday');
    });

    test('should return monthly last-weekday label', () => {
      const reminder = createMockReminder({
        recurrence_type: 'monthly',
        recurrence_interval: 1,
        monthly_type: 'nth_weekday',
        recurrence_days: [5], // Friday
        monthly_week_position: -1, // Last
      });

      expect(getRecurrenceLabel(reminder)).toBe('Monthly on the last Friday');
    });
  });

  describe('formatTimeLabel', () => {
    test('should format morning time correctly', () => {
      expect(formatTimeLabel('08:30:00')).toBe('8:30 AM');
    });

    test('should format afternoon time correctly', () => {
      expect(formatTimeLabel('14:00:00')).toBe('2:00 PM');
    });

    test('should format midnight correctly', () => {
      expect(formatTimeLabel('00:00:00')).toBe('12:00 AM');
    });

    test('should format noon correctly', () => {
      expect(formatTimeLabel('12:00:00')).toBe('12:00 PM');
    });

    test('should handle HH:MM format without seconds', () => {
      expect(formatTimeLabel('09:15')).toBe('9:15 AM');
    });

    test('should return null for null input', () => {
      expect(formatTimeLabel(null)).toBe(null);
    });

    test('should return null for invalid time string', () => {
      expect(formatTimeLabel('invalid')).toBe(null);
    });
  });

  describe('getDayOfWeekName', () => {
    test('should return full day names by default', () => {
      expect(getDayOfWeekName(0)).toBe('Sunday');
      expect(getDayOfWeekName(1)).toBe('Monday');
      expect(getDayOfWeekName(6)).toBe('Saturday');
    });

    test('should return short day names when specified', () => {
      expect(getDayOfWeekName(0, true)).toBe('Sun');
      expect(getDayOfWeekName(1, true)).toBe('Mon');
      expect(getDayOfWeekName(6, true)).toBe('Sat');
    });
  });

  describe('getNthWeekdayLabel', () => {
    test('should return ordinal position labels', () => {
      expect(getNthWeekdayLabel(1)).toBe('first');
      expect(getNthWeekdayLabel(2)).toBe('second');
      expect(getNthWeekdayLabel(3)).toBe('third');
      expect(getNthWeekdayLabel(4)).toBe('fourth');
    });

    test('should return "last" for -1', () => {
      expect(getNthWeekdayLabel(-1)).toBe('last');
    });
  });

  describe('Completion State Handling', () => {
    test('should handle multiple reminders with mixed statuses', () => {
      const reminders: Reminder[] = [
        createMockReminder({
          id: 'reminder-1',
          title: 'Completed',
          recurrence_type: 'daily',
          recurrence_interval: 1,
          created_at: '2025-12-01T10:00:00Z',
        }),
        createMockReminder({
          id: 'reminder-2',
          title: 'Skipped',
          recurrence_type: 'daily',
          recurrence_interval: 1,
          created_at: '2025-12-01T10:00:00Z',
        }),
        createMockReminder({
          id: 'reminder-3',
          title: 'Incomplete',
          recurrence_type: 'daily',
          recurrence_interval: 1,
          created_at: '2025-12-01T10:00:00Z',
        }),
      ];

      const completions: ReminderCompletion[] = [
        createMockCompletion({
          reminder_id: 'reminder-1',
          completion_date: '2025-12-13',
          status: 'completed',
        }),
        createMockCompletion({
          reminder_id: 'reminder-2',
          completion_date: '2025-12-13',
          status: 'skipped',
        }),
      ];

      const result = getTodaysReminders(reminders, completions);

      expect(result).toHaveLength(3);
      expect(result.find(r => r.id === 'reminder-1')?.todayStatus).toBe('completed');
      expect(result.find(r => r.id === 'reminder-2')?.todayStatus).toBe('skipped');
      expect(result.find(r => r.id === 'reminder-3')?.todayStatus).toBe('incomplete');
    });

    test('should handle completions for non-existent reminders gracefully', () => {
      const reminders: Reminder[] = [
        createMockReminder({
          id: 'reminder-1',
          recurrence_type: 'daily',
          recurrence_interval: 1,
          created_at: '2025-12-01T10:00:00Z',
        }),
      ];

      const completions: ReminderCompletion[] = [
        createMockCompletion({
          reminder_id: 'deleted-reminder',
          completion_date: '2025-12-13',
          status: 'completed',
        }),
      ];

      const result = getTodaysReminders(reminders, completions);

      expect(result).toHaveLength(1);
      expect(result[0].todayStatus).toBe('incomplete');
    });
  });
});
