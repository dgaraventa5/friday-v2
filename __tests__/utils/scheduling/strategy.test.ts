import { scheduleTasksGreedy, findSlotForTask, handleUnscheduledTask } from '@/lib/utils/scheduling/strategy';
import { SchedulingContext } from '@/lib/utils/scheduling/context';
import { SchedulingOptions } from '@/lib/utils/scheduling/types';
import { Task, TaskWithScore, CategoryLimits, DailyMaxHours, DailyMaxTasks } from '@/lib/types';

describe('Scheduling Strategy', () => {
  // Test data
  const categoryLimits: CategoryLimits = {
    Work: { weekday: 6, weekend: 2 },
    Personal: { weekday: 3, weekend: 4 },
  };

  const dailyMaxHours: DailyMaxHours = {
    weekday: 8,
    weekend: 6,
  };

  const dailyMaxTasks: DailyMaxTasks = {
    weekday: 4,
    weekend: 4,
  };

  const todayStr = '2024-01-15'; // Monday

  const createOptions = (overrides: Partial<SchedulingOptions> = {}): SchedulingOptions => ({
    todayStr,
    lookAheadDays: 14,
    categoryLimits,
    dailyMaxHours,
    dailyMaxTasks,
    ...overrides,
  });

  const createTask = (overrides: Partial<TaskWithScore> = {}): TaskWithScore => ({
    id: 'task-1',
    user_id: 'user-1',
    title: 'Test Task',
    description: null,
    is_completed: false,
    priority: 'medium',
    urgency: 'medium',
    energy_level: 'medium',
    due_date: null,
    start_date: null,
    estimated_hours: 2,
    category: 'Work',
    recurring: null,
    dependencies: null,
    completed_at: null,
    pinned: false,
    is_all_day: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    priorityScore: 100,
    quadrant: 'not-urgent-important',
    ...overrides,
  });

  describe('findSlotForTask', () => {
    it('should find slot on first available day', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const task = createTask({ estimated_hours: 2, category: 'Work' });
      const options = createOptions();

      const result = findSlotForTask(task, context, options);

      expect(result.date).toBe('2024-01-15'); // Today
      expect(result.warning).toBeNull();
    });

    it('should skip full days and find next available', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const options = createOptions();

      // Fill today with 4 tasks (weekday limit)
      for (let i = 0; i < 4; i++) {
        context.reserveCapacity('2024-01-15', createTask({ id: `task-${i}`, estimated_hours: 1 }));
      }

      const task = createTask({ estimated_hours: 2, category: 'Work' });
      const result = findSlotForTask(task, context, options);

      expect(result.date).toBe('2024-01-16'); // Next day
      expect(result.warning).toBeNull();
    });

    it('should respect due date and stop searching at due date', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const options = createOptions();

      // Fill days 0-2
      for (let i = 0; i < 3; i++) {
        const dateStr = `2024-01-${15 + i}`;
        for (let j = 0; j < 4; j++) {
          context.reserveCapacity(dateStr, createTask({ id: `task-${i}-${j}`, estimated_hours: 1 }));
        }
      }

      // Task due on day 3 (2024-01-18)
      const task = createTask({ estimated_hours: 2, category: 'Work', due_date: '2024-01-18' });
      const result = findSlotForTask(task, context, options);

      expect(result.date).toBe('2024-01-18'); // Due date (day 3)
      expect(result.warning).toBeNull();
    });

    it('should search beyond due date if no slot found before', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const options = createOptions();

      // Fill days 0-3 (including due date)
      for (let i = 0; i < 4; i++) {
        const dateStr = `2024-01-${15 + i}`;
        for (let j = 0; j < 4; j++) {
          context.reserveCapacity(dateStr, createTask({ id: `task-${i}-${j}`, estimated_hours: 1 }));
        }
      }

      // Task due on day 3 (2024-01-18)
      const task = createTask({ estimated_hours: 2, category: 'Work', due_date: '2024-01-18' });
      const result = findSlotForTask(task, context, options);

      expect(result.date).toBe('2024-01-19'); // Day after due date
      expect(result.warning).toContain('scheduled after due date');
      expect(result.warning).toContain('2024-01-19');
    });

    it('should handle overdue tasks', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const options = createOptions();

      // Task due yesterday
      const task = createTask({ estimated_hours: 2, category: 'Work', due_date: '2024-01-14' });
      const result = findSlotForTask(task, context, options);

      expect(result.date).toBe('2024-01-15'); // Today (first available)
      expect(result.warning).toBeNull();
    });

    it('should return null when no capacity available', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const options = createOptions({ lookAheadDays: 2 }); // Only look 2 days ahead

      // Fill all days in the lookahead window
      for (let i = 0; i < 2; i++) {
        const dateStr = `2024-01-${15 + i}`;
        for (let j = 0; j < 4; j++) {
          context.reserveCapacity(dateStr, createTask({ id: `task-${i}-${j}`, estimated_hours: 1 }));
        }
      }

      const task = createTask({ estimated_hours: 2, category: 'Work' });
      const result = findSlotForTask(task, context, options);

      expect(result.date).toBeNull();
      expect(result.warning).toBeNull();
    });

    it('should respect category limits', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const options = createOptions();

      // Fill Work category on 2024-01-15 (6 hours weekday limit)
      context.reserveCapacity('2024-01-15', createTask({ estimated_hours: 6, category: 'Work' }));

      // Try to add more Work
      const task = createTask({ estimated_hours: 2, category: 'Work' });
      const result = findSlotForTask(task, context, options);

      expect(result.date).toBe('2024-01-16'); // Next day
      expect(result.warning).toBeNull();
    });

    it('should respect daily hour limits', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const options = createOptions();

      // Fill most of daily hours on 2024-01-15 (8 hours weekday limit)
      context.reserveCapacity('2024-01-15', createTask({ estimated_hours: 7, category: 'Work' }));

      // Try to add 2 more hours (would exceed 8-hour limit)
      const task = createTask({ estimated_hours: 2, category: 'Personal' });
      const result = findSlotForTask(task, context, options);

      expect(result.date).toBe('2024-01-16'); // Next day
      expect(result.warning).toBeNull();
    });
  });

  describe('handleUnscheduledTask', () => {
    it('should return null for task without due date', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const task = createTask({ estimated_hours: 2, category: 'Work', due_date: null });
      const options = createOptions();

      const result = handleUnscheduledTask(task, context, options);

      expect(result.date).toBeNull();
      expect(result.warning).toContain('could not be scheduled');
      expect(result.warning).toContain(task.title);
    });

    it('should schedule on due date if task count allows', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const task = createTask({ estimated_hours: 2, category: 'Work', due_date: '2024-01-20' });
      const options = createOptions();

      // Due date has only 2 tasks (under 4-task limit)
      context.reserveCapacity('2024-01-20', createTask({ id: 'existing-1', estimated_hours: 1 }));
      context.reserveCapacity('2024-01-20', createTask({ id: 'existing-2', estimated_hours: 1 }));

      const result = handleUnscheduledTask(task, context, options);

      expect(result.date).toBe('2024-01-20');
      expect(result.warning).toContain('may exceed capacity limits');
    });

    it('should find next available day if due date is full', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const task = createTask({ estimated_hours: 2, category: 'Work', due_date: '2024-01-20' });
      const options = createOptions();

      // Fill due date with 4 tasks (weekday limit)
      for (let i = 0; i < 4; i++) {
        context.reserveCapacity('2024-01-20', createTask({ id: `task-${i}`, estimated_hours: 1 }));
      }

      const result = handleUnscheduledTask(task, context, options);

      expect(result.date).toBe('2024-01-21'); // Next day after due date
      expect(result.warning).toContain('due date 2024-01-20 was full');
    });

    it('should not force schedule non-overdue tasks if no capacity anywhere', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const task = createTask({ estimated_hours: 2, category: 'Work', due_date: '2024-01-20' });
      const options = createOptions();

      // Fill all days in lookahead window with 4 tasks each
      for (let i = 0; i < 14; i++) {
        const dateStr = `2024-01-${15 + i}`;
        for (let j = 0; j < 4; j++) {
          context.reserveCapacity(dateStr, createTask({ id: `task-${i}-${j}`, estimated_hours: 1 }));
        }
      }

      const result = handleUnscheduledTask(task, context, options);

      // New behavior: Don't force schedule non-overdue tasks
      expect(result.date).toBeNull();
      expect(result.warning).toContain('could not be scheduled');
      expect(result.warning).toContain('2024-01-20');
    });

    it('should force schedule overdue tasks to today', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const task = createTask({ estimated_hours: 2, category: 'Work', due_date: '2024-01-10' }); // Past due
      const options = createOptions();

      // Fill today with 4 tasks to exceed limit
      for (let j = 0; j < 4; j++) {
        context.reserveCapacity('2024-01-15', createTask({ id: `existing-${j}`, estimated_hours: 1 }));
      }

      const result = handleUnscheduledTask(task, context, options);

      // Overdue tasks are forced to today, not the past due date
      expect(result.date).toBe('2024-01-15'); // Today
      expect(result.warning).toContain('overdue');
      expect(result.warning).toContain('exceeds');
    });
  });

  describe('scheduleTasksGreedy', () => {
    it('should schedule single task', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const tasks = [createTask({ id: 'task-1', estimated_hours: 2, category: 'Work' })];
      const options = createOptions();

      const result = scheduleTasksGreedy(tasks, context, options);

      expect(result.scheduled).toHaveLength(1);
      expect(result.scheduled[0].start_date).toBe('2024-01-15'); // Today
      expect(result.warnings).toHaveLength(0);
    });

    it('should schedule multiple tasks', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const tasks = [
        createTask({ id: 'task-1', estimated_hours: 2, category: 'Work', priorityScore: 100 }),
        createTask({ id: 'task-2', estimated_hours: 1, category: 'Personal', priorityScore: 90 }),
        createTask({ id: 'task-3', estimated_hours: 2, category: 'Work', priorityScore: 80 }),
      ];
      const options = createOptions();

      const result = scheduleTasksGreedy(tasks, context, options);

      expect(result.scheduled).toHaveLength(3);
      // All should fit on same day (5 hours total < 8-hour limit, 3 tasks < 4-task limit)
      expect(result.scheduled[0].start_date).toBe('2024-01-15');
      expect(result.scheduled[1].start_date).toBe('2024-01-15');
      expect(result.scheduled[2].start_date).toBe('2024-01-15');
      expect(result.warnings).toHaveLength(0);
    });

    it('should respect task count limits and spread across days', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const tasks = [
        createTask({ id: 'task-1', estimated_hours: 1, priorityScore: 100 }),
        createTask({ id: 'task-2', estimated_hours: 1, priorityScore: 90 }),
        createTask({ id: 'task-3', estimated_hours: 1, priorityScore: 80 }),
        createTask({ id: 'task-4', estimated_hours: 1, priorityScore: 70 }),
        createTask({ id: 'task-5', estimated_hours: 1, priorityScore: 60 }),
      ];
      const options = createOptions();

      const result = scheduleTasksGreedy(tasks, context, options);

      expect(result.scheduled).toHaveLength(5);
      // First 4 tasks on 2024-01-15, 5th task on 2024-01-16
      const day1Tasks = result.scheduled.filter(t => t.start_date === '2024-01-15');
      const day2Tasks = result.scheduled.filter(t => t.start_date === '2024-01-16');
      expect(day1Tasks).toHaveLength(4);
      expect(day2Tasks).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle tasks with due dates', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const tasks = [
        createTask({ id: 'task-1', estimated_hours: 2, due_date: '2024-01-20', priorityScore: 100 }),
      ];
      const options = createOptions();

      const result = scheduleTasksGreedy(tasks, context, options);

      expect(result.scheduled).toHaveLength(1);
      expect(result.scheduled[0].start_date).toBe('2024-01-15'); // Today (earliest slot)
      expect(result.warnings).toHaveLength(0);
    });

    it('should use fallback for overdue tasks only', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const options = createOptions({ lookAheadDays: 1 }); // Very short lookahead

      // Fill the lookahead window
      for (let j = 0; j < 4; j++) {
        context.reserveCapacity('2024-01-15', createTask({ id: `existing-${j}`, estimated_hours: 1 }));
      }

      const tasks = [
        createTask({ id: 'task-1', estimated_hours: 2, due_date: '2024-01-10' }), // Overdue
      ];

      const result = scheduleTasksGreedy(tasks, context, options);

      expect(result.scheduled).toHaveLength(1);
      expect(result.scheduled[0].start_date).toBe('2024-01-15'); // Forced to today
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('overdue');
    });

    it('should leave tasks without due date unscheduled if no capacity', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const options = createOptions({ lookAheadDays: 1 });

      // Fill the lookahead window
      for (let j = 0; j < 4; j++) {
        context.reserveCapacity('2024-01-15', createTask({ id: `existing-${j}`, estimated_hours: 1 }));
      }

      const tasks = [
        createTask({ id: 'task-1', estimated_hours: 2, due_date: null }),
      ];

      const result = scheduleTasksGreedy(tasks, context, options);

      expect(result.scheduled).toHaveLength(1);
      expect(result.scheduled[0].start_date).toBeNull(); // Unscheduled
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('could not be scheduled');
    });

    it('should leave non-overdue tasks with due dates unscheduled if no capacity', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const options = createOptions({ lookAheadDays: 1 });

      // Fill the lookahead window
      for (let j = 0; j < 4; j++) {
        context.reserveCapacity('2024-01-15', createTask({ id: `existing-${j}`, estimated_hours: 1 }));
      }

      const tasks = [
        createTask({ id: 'task-1', estimated_hours: 2, due_date: '2024-01-20' }), // Future due date
      ];

      const result = scheduleTasksGreedy(tasks, context, options);

      expect(result.scheduled).toHaveLength(1);
      expect(result.scheduled[0].start_date).toBeNull(); // Not force-scheduled
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('could not be scheduled');
      expect(result.warnings[0]).toContain('2024-01-20');
    });

    it('should accumulate warnings for multiple problematic tasks', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const options = createOptions({ lookAheadDays: 1 });

      // Fill the lookahead window
      for (let j = 0; j < 4; j++) {
        context.reserveCapacity('2024-01-15', createTask({ id: `existing-${j}`, estimated_hours: 1 }));
      }

      const tasks = [
        createTask({ id: 'task-1', estimated_hours: 2, due_date: '2024-01-20' }),
        createTask({ id: 'task-2', estimated_hours: 1, due_date: null }),
      ];

      const result = scheduleTasksGreedy(tasks, context, options);

      expect(result.scheduled).toHaveLength(2);
      expect(result.warnings).toHaveLength(2);
    });

    it('should update context capacity for scheduled tasks', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const tasks = [
        createTask({ id: 'task-1', estimated_hours: 2, category: 'Work' }),
        createTask({ id: 'task-2', estimated_hours: 3, category: 'Work' }),
      ];
      const options = createOptions();

      scheduleTasksGreedy(tasks, context, options);

      // Check that capacity was reserved
      expect(context.getTaskCount('2024-01-15')).toBe(2);
      expect(context.getCategoryHours('2024-01-15', 'Work')).toBe(5);
      expect(context.getTotalHours('2024-01-15')).toBe(5);
    });

    it('should handle empty task list', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const options = createOptions();

      const result = scheduleTasksGreedy([], context, options);

      expect(result.scheduled).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
