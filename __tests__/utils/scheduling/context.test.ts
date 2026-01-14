import { SchedulingContext } from '@/lib/utils/scheduling/context';
import { Task, CategoryLimits, DailyMaxHours, DailyMaxTasks } from '@/lib/types';

describe('SchedulingContext', () => {
  // Test data
  const categoryLimits: CategoryLimits = {
    Work: { weekday: 6, weekend: 2 },
    Personal: { weekday: 3, weekend: 4 },
    Health: { weekday: 2, weekend: 2 },
  };

  const dailyMaxHours: DailyMaxHours = {
    weekday: 8,
    weekend: 6,
  };

  const dailyMaxTasks: DailyMaxTasks = {
    weekday: 4,
    weekend: 4,
  };

  const createTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'task-1',
    user_id: 'user-1',
    title: 'Test Task',
    description: null,
    is_completed: false,
    priority: 'medium',
    urgency: 'medium',
    energy_level: 'medium',
    due_date: null,
    start_date: '2024-01-15',
    estimated_hours: 2,
    category: 'Work',
    recurring: null,
    dependencies: null,
    completed_at: null,
    pinned: false,
    is_all_day: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  });

  describe('Initialization', () => {
    it('should initialize with empty capacity', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      expect(context.getTaskCount('2024-01-15')).toBe(0);
      expect(context.getCategoryHours('2024-01-15', 'Work')).toBe(0);
      expect(context.getTotalHours('2024-01-15')).toBe(0);
    });

    it('should store configuration correctly', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      expect(context.getMaxTasksForDate('2024-01-15')).toBe(4); // Monday = weekday
      expect(context.getCategoryLimit('2024-01-15', 'Work')).toBe(6);
      expect(context.getDailyLimit('2024-01-15')).toBe(8);
    });
  });

  describe('Weekday vs Weekend Detection', () => {
    it('should correctly identify weekdays', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      // 2024-01-15 is Monday
      expect(context.getMaxTasksForDate('2024-01-15')).toBe(dailyMaxTasks.weekday);
      expect(context.getDailyLimit('2024-01-15')).toBe(dailyMaxHours.weekday);
      expect(context.getCategoryLimit('2024-01-15', 'Work')).toBe(categoryLimits.Work.weekday);
    });

    it('should correctly identify weekends', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      // 2024-01-20 is Saturday
      expect(context.getMaxTasksForDate('2024-01-20')).toBe(dailyMaxTasks.weekend);
      expect(context.getDailyLimit('2024-01-20')).toBe(dailyMaxHours.weekend);
      expect(context.getCategoryLimit('2024-01-20', 'Work')).toBe(categoryLimits.Work.weekend);
    });
  });

  describe('Seed with Existing Tasks', () => {
    it('should seed capacity from existing tasks', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const tasks = [
        createTask({ id: 'task-1', start_date: '2024-01-15', estimated_hours: 2, category: 'Work' }),
        createTask({ id: 'task-2', start_date: '2024-01-15', estimated_hours: 3, category: 'Work' }),
        createTask({ id: 'task-3', start_date: '2024-01-16', estimated_hours: 1, category: 'Personal' }),
      ];

      context.seedWithExistingTasks(tasks);

      // Check 2024-01-15
      expect(context.getTaskCount('2024-01-15')).toBe(2);
      expect(context.getCategoryHours('2024-01-15', 'Work')).toBe(5);
      expect(context.getTotalHours('2024-01-15')).toBe(5);

      // Check 2024-01-16
      expect(context.getTaskCount('2024-01-16')).toBe(1);
      expect(context.getCategoryHours('2024-01-16', 'Personal')).toBe(1);
      expect(context.getTotalHours('2024-01-16')).toBe(1);
    });

    it('should ignore tasks without start_date', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const tasks = [
        createTask({ id: 'task-1', start_date: null, estimated_hours: 2 }),
      ];

      context.seedWithExistingTasks(tasks);

      expect(context.getTaskCount('2024-01-15')).toBe(0);
    });
  });

  describe('Reserve Capacity', () => {
    it('should reserve capacity for a task', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const task = createTask({ start_date: '2024-01-15', estimated_hours: 2, category: 'Work' });
      context.reserveCapacity('2024-01-15', task);

      expect(context.getTaskCount('2024-01-15')).toBe(1);
      expect(context.getCategoryHours('2024-01-15', 'Work')).toBe(2);
      expect(context.getTotalHours('2024-01-15')).toBe(2);
    });

    it('should accumulate capacity for multiple tasks', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const task1 = createTask({ start_date: '2024-01-15', estimated_hours: 2, category: 'Work' });
      const task2 = createTask({ start_date: '2024-01-15', estimated_hours: 3, category: 'Work' });

      context.reserveCapacity('2024-01-15', task1);
      context.reserveCapacity('2024-01-15', task2);

      expect(context.getTaskCount('2024-01-15')).toBe(2);
      expect(context.getCategoryHours('2024-01-15', 'Work')).toBe(5);
      expect(context.getTotalHours('2024-01-15')).toBe(5);
    });

    it('should handle multiple categories on same day', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const task1 = createTask({ start_date: '2024-01-15', estimated_hours: 2, category: 'Work' });
      const task2 = createTask({ start_date: '2024-01-15', estimated_hours: 1, category: 'Personal' });

      context.reserveCapacity('2024-01-15', task1);
      context.reserveCapacity('2024-01-15', task2);

      expect(context.getTaskCount('2024-01-15')).toBe(2);
      expect(context.getCategoryHours('2024-01-15', 'Work')).toBe(2);
      expect(context.getCategoryHours('2024-01-15', 'Personal')).toBe(1);
      expect(context.getTotalHours('2024-01-15')).toBe(3);
    });

    it('should handle uncategorized tasks', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const task = createTask({ start_date: '2024-01-15', estimated_hours: 2, category: null });
      context.reserveCapacity('2024-01-15', task);

      expect(context.getTaskCount('2024-01-15')).toBe(1);
      expect(context.getCategoryHours('2024-01-15', 'uncategorized')).toBe(2);
      expect(context.getTotalHours('2024-01-15')).toBe(2);
    });
  });

  describe('Release Capacity', () => {
    it('should release capacity for a task', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const task = createTask({ start_date: '2024-01-15', estimated_hours: 2, category: 'Work' });
      context.reserveCapacity('2024-01-15', task);
      context.releaseTaskCapacity(task);

      expect(context.getTaskCount('2024-01-15')).toBe(0);
      expect(context.getCategoryHours('2024-01-15', 'Work')).toBe(0);
      expect(context.getTotalHours('2024-01-15')).toBe(0);
    });

    it('should handle releasing from multiple tasks', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const task1 = createTask({ id: 'task-1', start_date: '2024-01-15', estimated_hours: 2, category: 'Work' });
      const task2 = createTask({ id: 'task-2', start_date: '2024-01-15', estimated_hours: 3, category: 'Work' });

      context.reserveCapacity('2024-01-15', task1);
      context.reserveCapacity('2024-01-15', task2);
      context.releaseTaskCapacity(task1);

      expect(context.getTaskCount('2024-01-15')).toBe(1);
      expect(context.getCategoryHours('2024-01-15', 'Work')).toBe(3);
      expect(context.getTotalHours('2024-01-15')).toBe(3);
    });

    it('should not go negative when releasing', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const task = createTask({ start_date: '2024-01-15', estimated_hours: 2, category: 'Work' });
      context.releaseTaskCapacity(task);

      expect(context.getTaskCount('2024-01-15')).toBe(0);
      expect(context.getCategoryHours('2024-01-15', 'Work')).toBe(0);
      expect(context.getTotalHours('2024-01-15')).toBe(0);
    });

    it('should handle task without start_date', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const task = createTask({ start_date: null, estimated_hours: 2, category: 'Work' });

      // Should not throw
      expect(() => context.releaseTaskCapacity(task)).not.toThrow();
    });
  });

  describe('Can Fit Task', () => {
    it('should allow task when all constraints satisfied', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const task = createTask({ estimated_hours: 2, category: 'Work' });
      const result = context.canFitTask('2024-01-15', task);

      expect(result.canFit).toBe(true);
      expect(result.taskCount).toBe(0);
      expect(result.categoryHours).toBe(0);
      expect(result.totalHours).toBe(0);
      expect(result.reasons).toBeUndefined();
    });

    it('should reject when task count limit reached', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      // Add 4 tasks (weekday limit)
      for (let i = 0; i < 4; i++) {
        context.reserveCapacity('2024-01-15', createTask({ id: `task-${i}`, estimated_hours: 1 }));
      }

      const newTask = createTask({ estimated_hours: 1, category: 'Work' });
      const result = context.canFitTask('2024-01-15', newTask);

      expect(result.canFit).toBe(false);
      expect(result.taskCount).toBe(4);
      expect(result.reasons).toContain('Task count (4/4)');
    });

    it('should reject when category limit exceeded', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      // Reserve 5 hours of Work (weekday limit is 6)
      context.reserveCapacity('2024-01-15', createTask({ estimated_hours: 5, category: 'Work' }));

      // Try to add 2 more hours (would exceed 6-hour limit)
      const newTask = createTask({ estimated_hours: 2, category: 'Work' });
      const result = context.canFitTask('2024-01-15', newTask);

      expect(result.canFit).toBe(false);
      expect(result.categoryHours).toBe(5);
      expect(result.reasons?.some(r => r.includes('Category hours'))).toBe(true);
    });

    it('should reject when daily hour limit exceeded', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      // Reserve 7 hours total (weekday limit is 8)
      context.reserveCapacity('2024-01-15', createTask({ estimated_hours: 7, category: 'Work' }));

      // Try to add 2 more hours (would exceed 8-hour limit)
      const newTask = createTask({ estimated_hours: 2, category: 'Personal' });
      const result = context.canFitTask('2024-01-15', newTask);

      expect(result.canFit).toBe(false);
      expect(result.totalHours).toBe(7);
      expect(result.reasons?.some(r => r.includes('Daily hours'))).toBe(true);
    });

    it('should handle weekend limits correctly', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      // 2024-01-20 is Saturday
      // Add 2 hours of Work (weekend limit is 2)
      context.reserveCapacity('2024-01-20', createTask({ estimated_hours: 2, category: 'Work' }));

      // Try to add 1 more hour (would exceed weekend limit)
      const newTask = createTask({ estimated_hours: 1, category: 'Work' });
      const result = context.canFitTask('2024-01-20', newTask);

      expect(result.canFit).toBe(false);
      expect(result.categoryLimit).toBe(2); // Weekend limit
    });

    it('should return multiple constraint violations', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      // Fill up the day completely
      for (let i = 0; i < 4; i++) {
        context.reserveCapacity('2024-01-15', createTask({ id: `task-${i}`, estimated_hours: 2, category: 'Work' }));
      }

      // Try to add another task (violates task count AND category hours AND daily hours)
      const newTask = createTask({ estimated_hours: 2, category: 'Work' });
      const result = context.canFitTask('2024-01-15', newTask);

      expect(result.canFit).toBe(false);
      expect(result.reasons?.length).toBeGreaterThan(1);
    });

    it('should handle uncategorized tasks with default limits', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const task = createTask({ estimated_hours: 2, category: null });
      const result = context.canFitTask('2024-01-15', task);

      expect(result.canFit).toBe(true);
      expect(result.categoryLimit).toBe(8); // Uses daily max as default
    });
  });

  describe('Get Debug Info', () => {
    it('should return complete debug information', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      context.reserveCapacity('2024-01-15', createTask({ estimated_hours: 2, category: 'Work' }));
      context.reserveCapacity('2024-01-15', createTask({ estimated_hours: 1, category: 'Personal' }));

      const debug = context.getDebugInfo('2024-01-15');

      expect(debug.taskCount).toBe(2);
      expect(debug.totalHours).toBe(3);
      expect(debug.categoryHours.get('Work')).toBe(2);
      expect(debug.categoryHours.get('Personal')).toBe(1);
      expect(debug.maxTasks).toBe(4);
      expect(debug.dailyLimit).toBe(8);
    });

    it('should return empty debug info for unused date', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const debug = context.getDebugInfo('2024-01-15');

      expect(debug.taskCount).toBe(0);
      expect(debug.totalHours).toBe(0);
      expect(debug.categoryHours.size).toBe(0);
    });
  });
});
