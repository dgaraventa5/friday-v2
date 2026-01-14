/**
 * End-to-End Settings Flow Tests
 * 
 * These tests verify the complete user journey:
 * 1. User loads dashboard with initial settings
 * 2. User changes settings and saves
 * 3. User navigates back to dashboard
 * 4. New settings are reflected in task scheduling
 */

import { assignStartDates } from '@/lib/utils/task-prioritization';
import { Task, CategoryLimits, DailyMaxHours, DailyMaxTasks } from '@/lib/types';

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

describe('Settings Flow E2E', () => {
  const mockCategoryLimits: CategoryLimits = {
    Work: { weekday: 10, weekend: 2 },
    Home: { weekday: 3, weekend: 6 },
    Health: { weekday: 1, weekend: 2 },
    Personal: { weekday: 2, weekend: 4 },
  };

  const mockDailyMaxHours: DailyMaxHours = {
    weekday: 12,
    weekend: 6,
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

  describe('Initial State with Default Settings', () => {
    test('should schedule 4 tasks on weekend with default task limit of 4', () => {
      const initialDailyMaxTasks: DailyMaxTasks = { weekday: 4, weekend: 4 };
      
      const tasks: Task[] = Array.from({ length: 6 }, (_, i) => 
        createMockTask({ 
          title: `Task ${i + 1}`, 
          category: 'Personal', 
          estimated_hours: 0.5 
        })
      );

      const result = assignStartDates(
        tasks,
        mockCategoryLimits,
        mockDailyMaxHours,
        initialDailyMaxTasks
      );

      const sundayTasks = result.tasks.filter(t => t.start_date === '2025-11-24');
      
      // Should only schedule 4 tasks on Sunday (default limit)
      expect(sundayTasks.length).toBeLessThanOrEqual(4);
    });
  });

  describe('After Settings Update', () => {
    test('should schedule more tasks after increasing weekend task limit', () => {
      // Step 1: Initial schedule with 4-task limit
      const initialDailyMaxTasks: DailyMaxTasks = { weekday: 4, weekend: 4 };
      
      const tasks: Task[] = Array.from({ length: 8 }, (_, i) => 
        createMockTask({ 
          title: `Task ${i + 1}`, 
          category: 'Personal', 
          estimated_hours: 0.5 
        })
      );

      const initialResult = assignStartDates(
        tasks,
        mockCategoryLimits,
        mockDailyMaxHours,
        initialDailyMaxTasks
      );

      const initialSundayTasks = initialResult.tasks.filter(t => t.start_date === '2025-11-24');
      
      // Step 2: User updates settings to 6 tasks on weekend
      const updatedDailyMaxTasks: DailyMaxTasks = { weekday: 4, weekend: 6 };
      
      const updatedResult = assignStartDates(
        tasks, // Same tasks, rescheduling
        mockCategoryLimits,
        mockDailyMaxHours,
        updatedDailyMaxTasks
      );

      const updatedSundayTasks = updatedResult.tasks.filter(t => t.start_date === '2025-11-24');
      
      // Should allow up to 6 tasks now (respecting hour limits)
      expect(updatedSundayTasks.length).toBeGreaterThan(initialSundayTasks.length);
      expect(updatedSundayTasks.length).toBeLessThanOrEqual(6);
    });

    test('should respect increased hour limits', () => {
      // Use different categories to avoid hitting category limits (Personal weekend limit is 4h)
      const tasks: Task[] = Array.from({ length: 8 }, (_, i) =>
        createMockTask({
          title: `Task ${i + 1}`,
          category: i < 4 ? 'Personal' : 'Home', // Mix categories to avoid category limit
          estimated_hours: 1
        })
      );

      // Initial: 6h weekend limit
      const initialResult = assignStartDates(
        tasks,
        mockCategoryLimits,
        mockDailyMaxHours,
        { weekday: 10, weekend: 10 } // High task limit to test hour limit
      );

      const initialSundayTasks = initialResult.tasks.filter(t => t.start_date === '2025-11-24');
      const initialHours = initialSundayTasks.reduce((sum, t) => sum + t.estimated_hours, 0);

      // Should not exceed 6h (weekend daily max)
      expect(initialHours).toBeLessThanOrEqual(6);

      // Updated: 10h weekend limit
      const increasedDailyMaxHours: DailyMaxHours = {
        weekday: 12,
        weekend: 10, // Increased from 6
      };

      const updatedResult = assignStartDates(
        tasks,
        mockCategoryLimits,
        increasedDailyMaxHours,
        { weekday: 10, weekend: 10 }
      );

      const updatedSundayTasks = updatedResult.tasks.filter(t => t.start_date === '2025-11-24');
      const updatedHours = updatedSundayTasks.reduce((sum, t) => sum + t.estimated_hours, 0);

      // Should allow more hours now (category limits: Personal=4h, Home=6h = 10h total)
      expect(updatedHours).toBeGreaterThan(initialHours);
      expect(updatedHours).toBeLessThanOrEqual(10);
    });
  });

  describe('Settings Persistence', () => {
    test('should use new settings consistently across operations', () => {
      const newDailyMaxTasks: DailyMaxTasks = { weekday: 6, weekend: 8 };
      
      const tasks: Task[] = Array.from({ length: 10 }, (_, i) => 
        createMockTask({ 
          title: `Task ${i + 1}`, 
          category: 'Personal', 
          estimated_hours: 0.5 
        })
      );

      // First schedule
      const result1 = assignStartDates(
        tasks,
        mockCategoryLimits,
        mockDailyMaxHours,
        newDailyMaxTasks
      );

      // Second schedule (simulating refresh)
      const result2 = assignStartDates(
        tasks,
        mockCategoryLimits,
        mockDailyMaxHours,
        newDailyMaxTasks
      );

      const sunday1 = result1.tasks.filter(t => t.start_date === '2025-11-24');
      const sunday2 = result2.tasks.filter(t => t.start_date === '2025-11-24');
      
      // Should produce consistent results
      expect(sunday1.length).toBe(sunday2.length);
    });
  });

  describe('Null/Undefined Handling', () => {
    test('should fallback to defaults when daily_max_tasks is null', () => {
      const tasks: Task[] = [createMockTask({ title: 'Test', estimated_hours: 1 })];
      
      // Simulate null from database (before migration)
      const dailyMaxTasks = null as any;
      const fallback = dailyMaxTasks || { weekday: 4, weekend: 4 };
      
      const result = assignStartDates(
        tasks,
        mockCategoryLimits,
        mockDailyMaxHours,
        fallback
      );

      expect(result.tasks[0].start_date).toBeTruthy();
    });

    test('should fallback to defaults when daily_max_tasks is undefined', () => {
      const tasks: Task[] = [createMockTask({ title: 'Test', estimated_hours: 1 })];
      
      // Simulate undefined from database
      const dailyMaxTasks = undefined as any;
      const fallback = dailyMaxTasks || { weekday: 4, weekend: 4 };
      
      const result = assignStartDates(
        tasks,
        mockCategoryLimits,
        mockDailyMaxHours,
        fallback
      );

      expect(result.tasks[0].start_date).toBeTruthy();
    });

    test('should handle malformed daily_max_tasks object', () => {
      const tasks: Task[] = [createMockTask({ title: 'Test', estimated_hours: 1 })];
      
      const malformedValues = [
        {}, // Empty object
        { weekday: 4 }, // Missing weekend
        { weekend: 4 }, // Missing weekday
        { weekday: '4', weekend: 4 }, // Wrong type
      ];

      malformedValues.forEach(malformed => {
        const isValid = 
          malformed &&
          typeof malformed === 'object' &&
          'weekday' in malformed &&
          'weekend' in malformed &&
          typeof (malformed as any).weekday === 'number' &&
          typeof (malformed as any).weekend === 'number';

        const effectiveValue = isValid ? (malformed as DailyMaxTasks) : { weekday: 4, weekend: 4 };
        
        const result = assignStartDates(
          tasks,
          mockCategoryLimits,
          mockDailyMaxHours,
          effectiveValue
        );

        expect(result.tasks[0].start_date).toBeTruthy();
      });
    });
  });

  describe('Real-World Scenario: User Issue', () => {
    test('should show more than 2 tasks on Sunday when limits allow', () => {
      // Replicate user's scenario:
      // - Sunday (weekend)
      // - Daily max tasks: 4
      // - 6 hours of capacity
      // - Only seeing 2 tasks (the bug)
      
      const userCategoryLimits: CategoryLimits = {
        Work: { weekday: 10, weekend: 2 },
        Home: { weekday: 3, weekend: 6 },
        Health: { weekday: 1, weekend: 2 },
        Personal: { weekday: 2, weekend: 4 },
      };

      const userDailyMaxHours: DailyMaxHours = {
        weekday: 12,
        weekend: 6,
      };

      const userDailyMaxTasks: DailyMaxTasks = {
        weekday: 4,
        weekend: 4,
      };

      const tasks: Task[] = [
        createMockTask({ title: 'Work out', category: 'Health', estimated_hours: 1 }),
        createMockTask({ title: 'Dry cleaning', category: 'Personal', estimated_hours: 1 }),
        createMockTask({ title: 'Groceries', category: 'Home', estimated_hours: 1.5 }),
        createMockTask({ title: 'Cook dinner', category: 'Home', estimated_hours: 1 }),
        createMockTask({ title: 'Read book', category: 'Personal', estimated_hours: 1 }),
      ];

      const result = assignStartDates(
        tasks,
        userCategoryLimits,
        userDailyMaxHours,
        userDailyMaxTasks
      );

      const sundayTasks = result.tasks.filter(t => t.start_date === '2025-11-24');
      const totalHours = sundayTasks.reduce((sum, t) => sum + t.estimated_hours, 0);
      
      console.log('Sunday tasks scheduled:', sundayTasks.length);
      console.log('Total hours:', totalHours);
      console.log('Tasks:', sundayTasks.map(t => ({ title: t.title, category: t.category, hours: t.estimated_hours })));
      
      // With 4-task limit and 6-hour capacity, should schedule more than 2 tasks
      expect(sundayTasks.length).toBeGreaterThan(2);
      expect(sundayTasks.length).toBeLessThanOrEqual(4);
      expect(totalHours).toBeLessThanOrEqual(6);
    });
  });
});

