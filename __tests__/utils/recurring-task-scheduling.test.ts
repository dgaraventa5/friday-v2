/**
 * Recurring Task Interaction Tests
 * 
 * These tests verify that recurring tasks interact correctly with task limits:
 * 1. Recurring tasks count toward daily task limit
 * 2. Non-recurring tasks fill remaining slots
 * 3. Mix of both types respects all constraints
 */

import { assignStartDates } from '@/lib/utils/task-prioritization';
import { Task, CategoryLimits, DailyMaxHours, DailyMaxTasks } from '@/lib/types';
import { getTodayLocal, addDaysToDateString } from '@/lib/utils/date-utils';

// Mock date utilities
jest.mock('@/lib/utils/date-utils', () => ({
  getTodayLocal: jest.fn(() => '2025-11-24'), // Sunday
  parseDateLocal: jest.fn((dateStr: string) => new Date(dateStr)),
  formatDateLocal: jest.fn((date: Date) => date.toISOString().split('T')[0]),
  addDaysToDateString: jest.fn((dateStr: string, days: number) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }),
  getDayOfWeek: jest.fn((dateStr: string) => new Date(dateStr).getDay()),
  compareDateStrings: jest.fn((a: string, b: string) => a.localeCompare(b)),
}));

describe('Recurring Task Scheduling Integration', () => {
  const mockCategoryLimits: CategoryLimits = {
    Work: { weekday: 10, weekend: 2 },
    Home: { weekday: 3, weekend: 6 },
    Health: { weekday: 3, weekend: 2 },
    Personal: { weekday: 2, weekend: 4 },
  };

  const mockDailyMaxHours: DailyMaxHours = {
    weekday: 10,
    weekend: 6,
  };

  const mockDailyMaxTasks: DailyMaxTasks = {
    weekday: 4,
    weekend: 4,
  };

  const createMockTask = (overrides: Partial<Task>): Task => ({
    id: Math.random().toString(),
    user_id: 'test-user',
    title: 'Test Task',
    description: null,
    priority: null,
    is_mit: false,
    completed: false,
    completed_at: null,
    due_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    importance: 'not-important',
    urgency: 'not-urgent',
    estimated_hours: 1,
    start_date: null,
    category: 'Personal',
    recurring_series_id: null,
    is_recurring: false,
    recurring_interval: null,
    recurring_days: null,
    recurring_end_type: null,
    recurring_end_count: null,
    recurring_current_count: 1,
    ...overrides,
  });

  describe('Recurring Tasks Count Toward Limit', () => {
    test('should count recurring tasks toward daily task limit', () => {
      const recurringTasks: Task[] = [
        createMockTask({
          title: 'Morning Exercise',
          is_recurring: true,
          recurring_interval: 'daily',
          recurring_series_id: 'series-1',
          start_date: '2025-11-24', // Today (Sunday)
          due_date: '2025-11-24',
          category: 'Health',
          estimated_hours: 1,
        }),
        createMockTask({
          title: 'Evening Walk',
          is_recurring: true,
          recurring_interval: 'daily',
          recurring_series_id: 'series-2',
          start_date: '2025-11-24',
          due_date: '2025-11-24',
          category: 'Health',
          estimated_hours: 0.5,
        }),
      ];

      const nonRecurringTasks: Task[] = Array.from({ length: 5 }, (_, i) =>
        createMockTask({
          title: `Non-recurring Task ${i + 1}`,
          category: 'Personal',
          estimated_hours: 0.5,
        })
      );

      const allTasks = [...recurringTasks, ...nonRecurringTasks];

      const result = assignStartDates(
        allTasks,
        mockCategoryLimits,
        mockDailyMaxHours,
        mockDailyMaxTasks
      );

      const sundayTasks = result.tasks.filter(t => t.start_date === '2025-11-24');
      
      // Should respect 4-task limit
      // 2 recurring + up to 2 non-recurring = max 4
      expect(sundayTasks.length).toBeLessThanOrEqual(4);
      
      // Should include both recurring tasks
      const sundayRecurring = sundayTasks.filter(t => t.is_recurring);
      expect(sundayRecurring.length).toBe(2);
    });

    test('should fill remaining slots with non-recurring tasks', () => {
      const recurringTasks: Task[] = [
        createMockTask({
          title: 'Daily Standup',
          is_recurring: true,
          recurring_series_id: 'series-1',
          start_date: '2025-11-24',
          due_date: '2025-11-24',
          category: 'Work',
          estimated_hours: 0.5,
        }),
      ];

      const nonRecurringTasks: Task[] = Array.from({ length: 5 }, (_, i) =>
        createMockTask({
          title: `Task ${i + 1}`,
          category: 'Personal',
          estimated_hours: 0.5,
        })
      );

      const allTasks = [...recurringTasks, ...nonRecurringTasks];

      const result = assignStartDates(
        allTasks,
        mockCategoryLimits,
        mockDailyMaxHours,
        mockDailyMaxTasks
      );

      const sundayTasks = result.tasks.filter(t => t.start_date === '2025-11-24');
      const sundayRecurring = sundayTasks.filter(t => t.is_recurring);
      const sundayNonRecurring = sundayTasks.filter(t => !t.is_recurring);
      
      // 1 recurring + up to 3 non-recurring = 4 total
      expect(sundayRecurring.length).toBe(1);
      expect(sundayNonRecurring.length).toBeLessThanOrEqual(3);
      expect(sundayTasks.length).toBeLessThanOrEqual(4);
    });
  });

  describe('Recurring Tasks Block Slots', () => {
    test('should prevent non-recurring tasks when recurring tasks fill limit', () => {
      const recurringTasks: Task[] = Array.from({ length: 4 }, (_, i) =>
        createMockTask({
          title: `Recurring ${i + 1}`,
          is_recurring: true,
          recurring_series_id: `series-${i}`,
          start_date: '2025-11-24',
          due_date: '2025-11-24',
          category: 'Health',
          estimated_hours: 0.5,
        })
      );

      const nonRecurringTasks: Task[] = [
        createMockTask({
          title: 'One-time Task',
          category: 'Personal',
          estimated_hours: 0.5,
        }),
      ];

      const allTasks = [...recurringTasks, ...nonRecurringTasks];

      const result = assignStartDates(
        allTasks,
        mockCategoryLimits,
        mockDailyMaxHours,
        mockDailyMaxTasks
      );

      const sundayTasks = result.tasks.filter(t => t.start_date === '2025-11-24');
      
      // All 4 slots taken by recurring tasks
      expect(sundayTasks.length).toBe(4);
      expect(sundayTasks.every(t => t.is_recurring)).toBe(true);
      
      // Non-recurring task should be scheduled for a later day
      const oneTimeTask = result.tasks.find(t => t.title === 'One-time Task');
      expect(oneTimeTask?.start_date).not.toBe('2025-11-24');
    });
  });

  describe('Hour Limits with Recurring Tasks', () => {
    test('should respect category hour limits with recurring tasks', () => {
      const recurringTasks: Task[] = [
        createMockTask({
          title: 'Morning Workout',
          is_recurring: true,
          recurring_series_id: 'series-1',
          start_date: '2025-11-24',
          due_date: '2025-11-24',
          category: 'Health',
          estimated_hours: 1.5, // Using 1.5 of 2h weekend Health limit
        }),
      ];

      const nonRecurringTasks: Task[] = [
        createMockTask({
          title: 'Doctor Appointment',
          category: 'Health',
          estimated_hours: 1, // Would exceed 2h Health limit
        }),
      ];

      const allTasks = [...recurringTasks, ...nonRecurringTasks];

      const result = assignStartDates(
        allTasks,
        mockCategoryLimits,
        mockDailyMaxHours,
        mockDailyMaxTasks
      );

      const sundayHealthTasks = result.tasks.filter(
        t => t.start_date === '2025-11-24' && t.category === 'Health'
      );

      const totalHealthHours = sundayHealthTasks.reduce(
        (sum, t) => sum + t.estimated_hours, 0
      );
      
      // Should not exceed 2h Health limit
      expect(totalHealthHours).toBeLessThanOrEqual(2);
    });

    test('should respect daily max hours with recurring tasks', () => {
      const recurringTasks: Task[] = Array.from({ length: 3 }, (_, i) =>
        createMockTask({
          title: `Recurring ${i + 1}`,
          is_recurring: true,
          recurring_series_id: `series-${i}`,
          start_date: '2025-11-24',
          due_date: '2025-11-24',
          category: 'Personal',
          estimated_hours: 2, // 3 tasks * 2h = 6h (weekend limit)
        })
      );

      const nonRecurringTasks: Task[] = [
        createMockTask({
          title: 'Extra Task',
          category: 'Personal',
          estimated_hours: 1, // Would exceed 6h daily limit
        }),
      ];

      const allTasks = [...recurringTasks, ...nonRecurringTasks];

      const result = assignStartDates(
        allTasks,
        mockCategoryLimits,
        mockDailyMaxHours,
        mockDailyMaxTasks
      );

      const sundayTasks = result.tasks.filter(t => t.start_date === '2025-11-24');
      const totalHours = sundayTasks.reduce((sum, t) => sum + t.estimated_hours, 0);
      
      // Should not exceed 6h weekend daily limit
      expect(totalHours).toBeLessThanOrEqual(6);
    });
  });

  describe('Priority with Recurring Tasks', () => {
    test('should schedule non-recurring high-priority tasks alongside recurring', () => {
      const recurringTasks: Task[] = [
        createMockTask({
          title: 'Daily Routine',
          is_recurring: true,
          recurring_series_id: 'series-1',
          start_date: '2025-11-24',
          due_date: '2025-11-24',
          category: 'Personal',
          estimated_hours: 1,
          importance: 'not-important',
          urgency: 'not-urgent',
        }),
      ];

      const nonRecurringTasks: Task[] = [
        createMockTask({
          title: 'Urgent Task',
          category: 'Work',
          estimated_hours: 1,
          importance: 'important',
          urgency: 'urgent',
          due_date: '2025-11-24',
        }),
        createMockTask({
          title: 'Low Priority',
          category: 'Personal',
          estimated_hours: 1,
          importance: 'not-important',
          urgency: 'not-urgent',
        }),
      ];

      const allTasks = [...recurringTasks, ...nonRecurringTasks];

      const result = assignStartDates(
        allTasks,
        mockCategoryLimits,
        mockDailyMaxHours,
        mockDailyMaxTasks
      );

      const sundayTasks = result.tasks.filter(t => t.start_date === '2025-11-24');
      
      // Should include the urgent task
      const urgentTask = sundayTasks.find(t => t.title === 'Urgent Task');
      expect(urgentTask).toBeDefined();
      
      // Should include recurring task
      const dailyRoutine = sundayTasks.find(t => t.title === 'Daily Routine');
      expect(dailyRoutine).toBeDefined();
    });
  });

  describe('Real-World Scenario: User Issue', () => {
    test('should handle 2 recurring tasks blocking non-recurring tasks', () => {
      // User's actual scenario:
      // - 2 recurring tasks on Sunday
      // - Task limit was 4 (before user increased it)
      // - But only 2 tasks showing (the recurring ones)
      // - Non-recurring tasks couldn't be scheduled
      
      const recurringTasks: Task[] = [
        createMockTask({
          title: 'Work out',
          is_recurring: true,
          recurring_interval: 'weekly',
          recurring_days: [0], // Sunday
          recurring_series_id: 'workout-series',
          start_date: '2025-11-24',
          due_date: '2025-11-24',
          category: 'Health',
          estimated_hours: 1,
        }),
        createMockTask({
          title: 'Weekly Review',
          is_recurring: true,
          recurring_interval: 'weekly',
          recurring_days: [0], // Sunday
          recurring_series_id: 'review-series',
          start_date: '2025-11-24',
          due_date: '2025-11-24',
          category: 'Personal',
          estimated_hours: 1,
        }),
      ];

      const nonRecurringTasks: Task[] = [
        createMockTask({
          title: 'Dry cleaning',
          category: 'Personal',
          estimated_hours: 1,
        }),
        createMockTask({
          title: 'Groceries',
          category: 'Home',
          estimated_hours: 1.5,
        }),
      ];

      const allTasks = [...recurringTasks, ...nonRecurringTasks];

      // With old limit of 4
      const resultOld = assignStartDates(
        allTasks,
        mockCategoryLimits,
        mockDailyMaxHours,
        { weekday: 4, weekend: 4 }
      );

      const sundayTasksOld = resultOld.tasks.filter(t => t.start_date === '2025-11-24');
      
      // Should schedule all 4 tasks
      expect(sundayTasksOld.length).toBe(4);
      expect(sundayTasksOld.filter(t => t.is_recurring).length).toBe(2);
      expect(sundayTasksOld.filter(t => !t.is_recurring).length).toBe(2);
    });
  });
});

