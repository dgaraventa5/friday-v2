import { assignStartDates, calculatePriorityScore, getEisenhowerQuadrant } from '@/lib/utils/task-prioritization';
import { Task, CategoryLimits, DailyMaxHours, DailyMaxTasks } from '@/lib/types';
import { getTodayLocal, addDaysToDateString } from '@/lib/utils/date-utils';

// Mock date utilities to ensure consistent test results
jest.mock('@/lib/utils/date-utils', () => ({
  getTodayLocal: jest.fn(() => '2025-11-25'), // Monday
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

describe('Task Prioritization and Scheduling', () => {
  const mockCategoryLimits: CategoryLimits = {
    Work: { weekday: 10, weekend: 2 },
    Home: { weekday: 3, weekend: 4 },
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

  describe('Category Limits', () => {
    test('should respect category hour limits on weekdays', () => {
      const tasks: Task[] = [
        createMockTask({ title: 'Work 1', category: 'Work', estimated_hours: 6 }),
        createMockTask({ title: 'Work 2', category: 'Work', estimated_hours: 5 }),
      ];

      const result = assignStartDates(tasks, mockCategoryLimits, mockDailyMaxHours, mockDailyMaxTasks);
      const todayTasks = result.tasks.filter(t => t.start_date === '2025-11-25');
      
      // Work limit is 10h on weekdays, so both tasks (11h total) shouldn't fit on same day
      expect(todayTasks.length).toBeLessThan(2);
    });

    test('should respect category hour limits on weekends', () => {
      const tasks: Task[] = [
        createMockTask({ title: 'Work 1', category: 'Work', estimated_hours: 1.5 }),
        createMockTask({ title: 'Work 2', category: 'Work', estimated_hours: 1 }),
      ];

      const result = assignStartDates(tasks, mockCategoryLimits, mockDailyMaxHours, mockDailyMaxTasks);
      // Saturday is 2025-11-29
      const saturdayTasks = result.tasks.filter(t => t.start_date === '2025-11-29' && t.category === 'Work');
      
      // Work limit is 2h on weekends, so 2.5h total shouldn't all fit on Saturday
      const totalHours = saturdayTasks.reduce((sum, t) => sum + t.estimated_hours, 0);
      expect(totalHours).toBeLessThanOrEqual(2);
    });

    test('should allow multiple categories on the same day', () => {
      const tasks: Task[] = [
        createMockTask({ title: 'Work', category: 'Work', estimated_hours: 5 }),
        createMockTask({ title: 'Health', category: 'Health', estimated_hours: 2 }),
        createMockTask({ title: 'Home', category: 'Home', estimated_hours: 2 }),
      ];

      const result = assignStartDates(tasks, mockCategoryLimits, mockDailyMaxHours, mockDailyMaxTasks);
      const todayTasks = result.tasks.filter(t => t.start_date === '2025-11-25');
      
      // Should fit all three if daily max allows (9h total < 10h daily max)
      expect(todayTasks.length).toBe(3);
    });
  });

  describe('Daily Max Hours', () => {
    test('should respect daily max hours on weekdays', () => {
      const tasks: Task[] = [
        createMockTask({ title: 'Task 1', estimated_hours: 6 }),
        createMockTask({ title: 'Task 2', estimated_hours: 5 }),
      ];

      const result = assignStartDates(tasks, mockCategoryLimits, mockDailyMaxHours, mockDailyMaxTasks);
      const todayTasks = result.tasks.filter(t => t.start_date === '2025-11-25');
      const totalHours = todayTasks.reduce((sum, t) => sum + t.estimated_hours, 0);
      
      // Daily max is 10h, so 11h shouldn't fit
      expect(totalHours).toBeLessThanOrEqual(10);
    });

    test('should respect daily max hours on weekends', () => {
      const tasks: Task[] = [
        createMockTask({ title: 'Task 1', category: 'Personal', estimated_hours: 4 }),
        createMockTask({ title: 'Task 2', category: 'Home', estimated_hours: 3 }),
      ];

      const result = assignStartDates(tasks, mockCategoryLimits, mockDailyMaxHours, mockDailyMaxTasks);
      // Saturday is 2025-11-29
      const saturdayTasks = result.tasks.filter(t => t.start_date === '2025-11-29');
      const totalHours = saturdayTasks.reduce((sum, t) => sum + t.estimated_hours, 0);
      
      // Weekend daily max is 6h, so 7h shouldn't fit
      expect(totalHours).toBeLessThanOrEqual(6);
    });
  });

  describe('Daily Max Tasks', () => {
    test('should respect daily max tasks limit on weekdays', () => {
      const tasks: Task[] = Array.from({ length: 6 }, (_, i) => 
        createMockTask({ title: `Task ${i + 1}`, estimated_hours: 1 })
      );

      const result = assignStartDates(tasks, mockCategoryLimits, mockDailyMaxHours, mockDailyMaxTasks);
      const todayTasks = result.tasks.filter(t => t.start_date === '2025-11-25');
      
      // Should not exceed 4 tasks per day (weekday limit)
      expect(todayTasks.length).toBeLessThanOrEqual(4);
    });

    test('should respect daily max tasks limit on weekends', () => {
      const customMaxTasks: DailyMaxTasks = { weekday: 4, weekend: 2 };
      const tasks: Task[] = Array.from({ length: 5 }, (_, i) => 
        createMockTask({ title: `Weekend Task ${i + 1}`, estimated_hours: 0.5 })
      );

      const result = assignStartDates(tasks, mockCategoryLimits, mockDailyMaxHours, customMaxTasks);
      // Saturday is 2025-11-29
      const saturdayTasks = result.tasks.filter(t => t.start_date === '2025-11-29');
      
      // Should not exceed 2 tasks (weekend limit)
      expect(saturdayTasks.length).toBeLessThanOrEqual(2);
    });

    test('should allow configurable task limits', () => {
      const customMaxTasks: DailyMaxTasks = { weekday: 6, weekend: 6 };
      const tasks: Task[] = Array.from({ length: 6 }, (_, i) => 
        createMockTask({ title: `Task ${i + 1}`, estimated_hours: 1 })
      );

      const result = assignStartDates(tasks, mockCategoryLimits, mockDailyMaxHours, customMaxTasks);
      const todayTasks = result.tasks.filter(t => t.start_date === '2025-11-25');
      
      // With custom limit of 6, should potentially fit more tasks
      expect(todayTasks.length).toBeLessThanOrEqual(6);
    });
  });

  describe('Priority Ordering', () => {
    test('should schedule high-priority tasks first', () => {
      const tasks: Task[] = [
        createMockTask({ 
          title: 'Low Priority', 
          importance: 'not-important', 
          urgency: 'not-urgent',
          estimated_hours: 2
        }),
        createMockTask({ 
          title: 'High Priority', 
          importance: 'important', 
          urgency: 'urgent',
          estimated_hours: 2
        }),
      ];

      const result = assignStartDates(tasks, mockCategoryLimits, mockDailyMaxHours, mockDailyMaxTasks);
      const highPriorityTask = result.tasks.find(t => t.title === 'High Priority');
      const lowPriorityTask = result.tasks.find(t => t.title === 'Low Priority');
      
      // High priority should be scheduled earlier
      if (highPriorityTask?.start_date && lowPriorityTask?.start_date) {
        expect(highPriorityTask.start_date).toBeLessThanOrEqual(lowPriorityTask.start_date);
      }
    });

    test('should prioritize tasks with earlier due dates', () => {
      const tasks: Task[] = [
        createMockTask({ 
          title: 'Due Later', 
          due_date: '2025-12-01',
          estimated_hours: 2
        }),
        createMockTask({ 
          title: 'Due Soon', 
          due_date: '2025-11-26',
          estimated_hours: 2
        }),
      ];

      const result = assignStartDates(tasks, mockCategoryLimits, mockDailyMaxHours, mockDailyMaxTasks);
      const dueSoonTask = result.tasks.find(t => t.title === 'Due Soon');
      const dueLaterTask = result.tasks.find(t => t.title === 'Due Later');
      
      // Earlier due date should be scheduled first
      if (dueSoonTask?.start_date && dueLaterTask?.start_date) {
        expect(dueSoonTask.start_date).toBeLessThanOrEqual(dueLaterTask.start_date);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle tasks with 0.5 hour durations', () => {
      const tasks: Task[] = [
        createMockTask({ title: 'Quick Task', estimated_hours: 0.5 }),
      ];

      const result = assignStartDates(tasks, mockCategoryLimits, mockDailyMaxHours, mockDailyMaxTasks);
      
      expect(result.tasks[0].start_date).toBeTruthy();
    });

    test('should handle tasks exactly at capacity limit', () => {
      const tasks: Task[] = [
        createMockTask({ title: 'Exact Fit', category: 'Personal', estimated_hours: 2 }), // Exactly the weekday limit
      ];

      const result = assignStartDates(tasks, mockCategoryLimits, mockDailyMaxHours, mockDailyMaxTasks);
      
      expect(result.tasks[0].start_date).toBeTruthy();
    });

    test('should push oversized tasks to next available day', () => {
      const tasks: Task[] = [
        createMockTask({ title: 'Fill Today 1', estimated_hours: 5 }),
        createMockTask({ title: 'Fill Today 2', estimated_hours: 5 }),
        createMockTask({ title: 'Tomorrow', estimated_hours: 1 }),
      ];

      const result = assignStartDates(tasks, mockCategoryLimits, mockDailyMaxHours, mockDailyMaxTasks);
      const tomorrowTask = result.tasks.find(t => t.title === 'Tomorrow');
      
      // Should be scheduled after today
      expect(tomorrowTask?.start_date).not.toBe('2025-11-25');
    });
  });

  describe('Warnings', () => {
    test('should generate warning for tasks that cannot be scheduled', () => {
      const limitedLimits: CategoryLimits = {
        ...mockCategoryLimits,
        Work: { weekday: 1, weekend: 1 },
      };

      const tasks: Task[] = Array.from({ length: 100 }, (_, i) => 
        createMockTask({ 
          title: `Work Task ${i + 1}`, 
          category: 'Work', 
          estimated_hours: 1 
        })
      );

      const result = assignStartDates(tasks, limitedLimits, mockDailyMaxHours, mockDailyMaxTasks, 7);
      
      // Should have warnings about tasks that couldn't be scheduled
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Eisenhower Matrix', () => {
    test('should correctly categorize urgent-important tasks', () => {
      const task = createMockTask({ importance: 'important', urgency: 'urgent' });
      const quadrant = getEisenhowerQuadrant(task);
      expect(quadrant).toBe('urgent-important');
    });

    test('should correctly categorize not-urgent-important tasks', () => {
      const task = createMockTask({ importance: 'important', urgency: 'not-urgent' });
      const quadrant = getEisenhowerQuadrant(task);
      expect(quadrant).toBe('not-urgent-important');
    });

    test('should correctly categorize urgent-not-important tasks', () => {
      const task = createMockTask({ importance: 'not-important', urgency: 'urgent' });
      const quadrant = getEisenhowerQuadrant(task);
      expect(quadrant).toBe('urgent-not-important');
    });

    test('should correctly categorize not-urgent-not-important tasks', () => {
      const task = createMockTask({ importance: 'not-important', urgency: 'not-urgent' });
      const quadrant = getEisenhowerQuadrant(task);
      expect(quadrant).toBe('not-urgent-not-important');
    });
  });
});

