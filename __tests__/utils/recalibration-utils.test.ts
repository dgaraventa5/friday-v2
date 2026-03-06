import {
  shouldShowRecalibration,
  parseTriggerHour,
} from '@/lib/utils/recalibration-utils';
import { Task } from '@/lib/types';

// Mock date utilities
jest.mock('@/lib/utils/date-utils', () => ({
  getTodayLocal: jest.fn(() => '2026-03-05'),
  parseDateLocal: jest.fn((dateStr: string) => new Date(dateStr + 'T00:00:00')),
  addDaysToDateString: jest.fn((dateStr: string, days: number) => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }),
}));

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: Math.random().toString(),
  user_id: 'test-user',
  title: 'Test Task',
  description: null,
  priority: null,
  is_mit: false,
  completed: false,
  completed_at: null,
  due_date: '2026-03-05',
  created_at: '2026-03-01T10:00:00Z',
  updated_at: '2026-03-01T10:00:00Z',
  importance: 'important',
  urgency: 'urgent',
  estimated_hours: 1,
  start_date: '2026-03-05',
  pinned_date: null,
  category: 'Work',
  recurring_series_id: null,
  is_recurring: false,
  recurring_interval: null,
  recurring_days: null,
  recurring_end_type: null,
  recurring_end_count: null,
  recurring_current_count: 0,
  ...overrides,
});

describe('shouldShowRecalibration', () => {
  const tasksWithDueToday = [createMockTask({ due_date: '2026-03-05', start_date: '2026-03-05' })];

  beforeEach(() => {
    // Default: set current time to 6 PM (after 5 PM trigger)
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-05T18:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns true when after trigger hour, not dismissed, and tasks exist', () => {
    expect(shouldShowRecalibration(tasksWithDueToday, 17, null, true)).toBe(true);
  });

  it('returns false when feature is disabled', () => {
    expect(shouldShowRecalibration(tasksWithDueToday, 17, null, false)).toBe(false);
  });

  it('returns false before trigger hour', () => {
    jest.setSystemTime(new Date('2026-03-05T14:00:00'));
    expect(shouldShowRecalibration(tasksWithDueToday, 17, null, true)).toBe(false);
  });

  it('returns false when already dismissed today', () => {
    expect(shouldShowRecalibration(tasksWithDueToday, 17, '2026-03-05', true)).toBe(false);
  });

  it('returns true when dismissed on a different day', () => {
    expect(shouldShowRecalibration(tasksWithDueToday, 17, '2026-03-04', true)).toBe(true);
  });

  it('returns false when no tasks need attention', () => {
    const noTasks: Task[] = [];
    expect(shouldShowRecalibration(noTasks, 17, null, true)).toBe(false);
  });

  it('returns false when all tasks are completed', () => {
    const completedTasks = [createMockTask({ completed: true, due_date: '2026-03-05' })];
    expect(shouldShowRecalibration(completedTasks, 17, null, true)).toBe(false);
  });

  it('returns true with overdue tasks', () => {
    const overdueTasks = [createMockTask({ due_date: '2026-03-03', start_date: '2026-03-03' })];
    expect(shouldShowRecalibration(overdueTasks, 17, null, true)).toBe(true);
  });
});

describe('parseTriggerHour', () => {
  it('parses standard time string', () => {
    expect(parseTriggerHour('17:00:00')).toBe(17);
  });

  it('parses morning time', () => {
    expect(parseTriggerHour('09:30:00')).toBe(9);
  });

  it('defaults to 17 on invalid input', () => {
    expect(parseTriggerHour('invalid')).toBe(17);
  });
});
