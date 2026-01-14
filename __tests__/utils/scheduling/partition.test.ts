import { partitionTasks, deduplicateRecurringTasks } from '@/lib/utils/scheduling/partition';
import { Task } from '@/lib/types';

describe('Task Partitioning', () => {
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

  describe('partitionTasks', () => {
    it('should partition completed tasks', () => {
      const tasks = [
        createTask({ id: 'task-1', completed: true }),
        createTask({ id: 'task-2', completed: false }),
      ];

      const result = partitionTasks(tasks, '2024-01-15');

      expect(result.completed).toHaveLength(1);
      expect(result.completed[0].id).toBe('task-1');
      expect(result.toSchedule).toHaveLength(1);
    });

    it('should partition recurring tasks', () => {
      const tasks = [
        createTask({ id: 'task-1', is_recurring: true }),
        createTask({ id: 'task-2', is_recurring: false }),
      ];

      const result = partitionTasks(tasks, '2024-01-15');

      expect(result.recurring).toHaveLength(1);
      expect(result.recurring[0].id).toBe('task-1');
      expect(result.toSchedule).toHaveLength(1);
    });

    it('should partition pinned tasks for today', () => {
      const todayStr = '2024-01-15';
      const tasks = [
        createTask({ id: 'task-1', pinned_date: todayStr }),
        createTask({ id: 'task-2', pinned_date: '2024-01-14' }),
        createTask({ id: 'task-3', pinned_date: null }),
      ];

      const result = partitionTasks(tasks, todayStr);

      expect(result.pinned).toHaveLength(1);
      expect(result.pinned[0].id).toBe('task-1');
      expect(result.toSchedule).toHaveLength(2);
    });

    it('should partition tasks to schedule', () => {
      const tasks = [
        createTask({ id: 'task-1', completed: false, is_recurring: false, pinned_date: null }),
      ];

      const result = partitionTasks(tasks, '2024-01-15');

      expect(result.toSchedule).toHaveLength(1);
      expect(result.toSchedule[0].id).toBe('task-1');
    });

    it('should handle all task types in one partition', () => {
      const todayStr = '2024-01-15';
      const tasks = [
        createTask({ id: 'completed', completed: true }),
        createTask({ id: 'recurring', is_recurring: true }),
        createTask({ id: 'pinned', pinned_date: todayStr }),
        createTask({ id: 'to-schedule', completed: false, is_recurring: false, pinned_date: null }),
      ];

      const result = partitionTasks(tasks, todayStr);

      expect(result.completed).toHaveLength(1);
      expect(result.recurring).toHaveLength(1);
      expect(result.pinned).toHaveLength(1);
      expect(result.toSchedule).toHaveLength(1);

      expect(result.completed[0].id).toBe('completed');
      expect(result.recurring[0].id).toBe('recurring');
      expect(result.pinned[0].id).toBe('pinned');
      expect(result.toSchedule[0].id).toBe('to-schedule');
    });

    it('should handle empty task list', () => {
      const result = partitionTasks([], '2024-01-15');

      expect(result.completed).toHaveLength(0);
      expect(result.recurring).toHaveLength(0);
      expect(result.pinned).toHaveLength(0);
      expect(result.toSchedule).toHaveLength(0);
    });

    it('should prioritize completed over other categories', () => {
      const todayStr = '2024-01-15';
      const tasks = [
        createTask({ id: 'task-1', completed: true, is_recurring: true }),
        createTask({ id: 'task-2', completed: true, pinned_date: todayStr }),
      ];

      const result = partitionTasks(tasks, todayStr);

      // Completed takes precedence
      expect(result.completed).toHaveLength(2);
      expect(result.recurring).toHaveLength(0);
      expect(result.pinned).toHaveLength(0);
    });

    it('should prioritize recurring over pinned for incomplete tasks', () => {
      const todayStr = '2024-01-15';
      const tasks = [
        createTask({ id: 'task-1', completed: false, is_recurring: true, pinned_date: todayStr }),
      ];

      const result = partitionTasks(tasks, todayStr);

      // Recurring takes precedence over pinned
      expect(result.recurring).toHaveLength(1);
      expect(result.pinned).toHaveLength(0);
    });
  });

  describe('deduplicateRecurringTasks', () => {
    it('should remove duplicate recurring tasks on same date', () => {
      const tasks = [
        createTask({
          id: 'task-1',
          title: 'Daily Task',
          start_date: '2024-01-15',
          recurring_series_id: 'series-1',
          created_at: '2024-01-01T10:00:00Z',
        }),
        createTask({
          id: 'task-2',
          title: 'Daily Task',
          start_date: '2024-01-15',
          recurring_series_id: 'series-1',
          created_at: '2024-01-01T10:00:01Z', // Created 1 second later
        }),
      ];

      const result = deduplicateRecurringTasks(tasks);

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].id).toBe('task-1'); // Older one kept
      expect(result.duplicatesFound).toHaveLength(1);
    });

    it('should keep tasks on different dates', () => {
      const tasks = [
        createTask({
          id: 'task-1',
          start_date: '2024-01-15',
          recurring_series_id: 'series-1',
        }),
        createTask({
          id: 'task-2',
          start_date: '2024-01-16',
          recurring_series_id: 'series-1',
        }),
      ];

      const result = deduplicateRecurringTasks(tasks);

      expect(result.tasks).toHaveLength(2);
      expect(result.duplicatesFound).toHaveLength(0);
    });

    it('should keep tasks with different series IDs', () => {
      const tasks = [
        createTask({
          id: 'task-1',
          start_date: '2024-01-15',
          recurring_series_id: 'series-1',
        }),
        createTask({
          id: 'task-2',
          start_date: '2024-01-15',
          recurring_series_id: 'series-2',
        }),
      ];

      const result = deduplicateRecurringTasks(tasks);

      expect(result.tasks).toHaveLength(2);
      expect(result.duplicatesFound).toHaveLength(0);
    });

    it('should keep older task when duplicates found', () => {
      const tasks = [
        createTask({
          id: 'newer',
          start_date: '2024-01-15',
          recurring_series_id: 'series-1',
          created_at: '2024-01-02T00:00:00Z',
        }),
        createTask({
          id: 'older',
          start_date: '2024-01-15',
          recurring_series_id: 'series-1',
          created_at: '2024-01-01T00:00:00Z',
        }),
      ];

      const result = deduplicateRecurringTasks(tasks);

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].id).toBe('older');
    });

    it('should handle tasks without start_date', () => {
      const tasks = [
        createTask({
          id: 'task-1',
          start_date: null,
          recurring_series_id: 'series-1',
        }),
        createTask({
          id: 'task-2',
          start_date: null,
          recurring_series_id: 'series-1',
        }),
      ];

      const result = deduplicateRecurringTasks(tasks);

      // Can't deduplicate without start_date, keeps both
      expect(result.tasks).toHaveLength(2);
      expect(result.duplicatesFound).toHaveLength(0);
    });

    it('should handle tasks without recurring_series_id', () => {
      const tasks = [
        createTask({
          id: 'task-1',
          start_date: '2024-01-15',
          recurring_series_id: null,
        }),
        createTask({
          id: 'task-2',
          start_date: '2024-01-15',
          recurring_series_id: null,
        }),
      ];

      const result = deduplicateRecurringTasks(tasks);

      // Can't deduplicate without recurring_series_id, keeps both
      expect(result.tasks).toHaveLength(2);
      expect(result.duplicatesFound).toHaveLength(0);
    });

    it('should handle multiple duplicates', () => {
      const tasks = [
        createTask({
          id: 'task-1',
          start_date: '2024-01-15',
          recurring_series_id: 'series-1',
          created_at: '2024-01-01T10:00:00Z',
        }),
        createTask({
          id: 'task-2',
          start_date: '2024-01-15',
          recurring_series_id: 'series-1',
          created_at: '2024-01-01T10:00:01Z',
        }),
        createTask({
          id: 'task-3',
          start_date: '2024-01-15',
          recurring_series_id: 'series-1',
          created_at: '2024-01-01T10:00:02Z',
        }),
      ];

      const result = deduplicateRecurringTasks(tasks);

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].id).toBe('task-1'); // Oldest kept
      expect(result.duplicatesFound).toHaveLength(2);
    });

    it('should handle mixed scenario', () => {
      const tasks = [
        // Duplicates on 2024-01-15 for series-1
        createTask({
          id: 'dup-1',
          start_date: '2024-01-15',
          recurring_series_id: 'series-1',
          created_at: '2024-01-01T10:00:00Z',
        }),
        createTask({
          id: 'dup-2',
          start_date: '2024-01-15',
          recurring_series_id: 'series-1',
          created_at: '2024-01-01T10:00:01Z',
        }),
        // Different date, same series
        createTask({
          id: 'different-date',
          start_date: '2024-01-16',
          recurring_series_id: 'series-1',
        }),
        // Same date, different series
        createTask({
          id: 'different-series',
          start_date: '2024-01-15',
          recurring_series_id: 'series-2',
        }),
        // No series ID
        createTask({
          id: 'no-series',
          start_date: '2024-01-15',
          recurring_series_id: null,
        }),
      ];

      const result = deduplicateRecurringTasks(tasks);

      expect(result.tasks).toHaveLength(4);
      expect(result.duplicatesFound).toHaveLength(1);

      const ids = result.tasks.map(t => t.id);
      expect(ids).toContain('dup-1'); // Older duplicate kept
      expect(ids).not.toContain('dup-2'); // Newer duplicate removed
      expect(ids).toContain('different-date');
      expect(ids).toContain('different-series');
      expect(ids).toContain('no-series');
    });

    it('should return empty arrays for empty input', () => {
      const result = deduplicateRecurringTasks([]);

      expect(result.tasks).toHaveLength(0);
      expect(result.duplicatesFound).toHaveLength(0);
    });

    it('should provide descriptive duplicate messages', () => {
      const tasks = [
        createTask({
          id: 'task-1',
          title: 'Daily Standup',
          start_date: '2024-01-15',
          recurring_series_id: 'series-1',
          created_at: '2024-01-01T10:00:00Z',
        }),
        createTask({
          id: 'task-2',
          title: 'Daily Standup',
          start_date: '2024-01-15',
          recurring_series_id: 'series-1',
          created_at: '2024-01-01T10:00:01Z',
        }),
      ];

      const result = deduplicateRecurringTasks(tasks);

      expect(result.duplicatesFound[0]).toContain('Daily Standup');
      expect(result.duplicatesFound[0]).toContain('2024-01-15');
    });
  });
});
