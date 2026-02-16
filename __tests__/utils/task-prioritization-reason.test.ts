import { getPriorityReason, getScoreBreakdown } from '@/lib/utils/task-prioritization';
import { Task } from '@/lib/types';

// Mock date utilities to ensure consistent test results
// "Today" is 2025-11-25 (a Monday)
jest.mock('@/lib/utils/date-utils', () => ({
  getTodayLocal: jest.fn(() => '2025-11-25'),
  parseDateLocal: jest.fn((dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }),
  formatDateLocal: jest.fn((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }),
  addDaysToDateString: jest.fn((dateStr: string, days: number) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }),
  getDayOfWeek: jest.fn((dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).getDay();
  }),
  compareDateStrings: jest.fn((a: string, b: string) => a.localeCompare(b)),
}));

/**
 * Helper to create a minimal Task object with sensible defaults.
 * Override any field as needed for specific test cases.
 */
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'test-id',
    user_id: 'test-user',
    title: 'Test Task',
    description: null,
    priority: null,
    is_mit: false,
    completed: false,
    completed_at: null,
    due_date: null,
    created_at: '2025-11-25T12:00:00.000Z', // Created "today" by default (age = 0); noon UTC stays Nov 25 in all US zones
    updated_at: '2025-11-25T12:00:00.000Z',
    importance: 'not-important',
    urgency: 'not-urgent',
    estimated_hours: 1,
    start_date: null,
    pinned_date: null,
    category: 'Personal',
    recurring_series_id: null,
    is_recurring: false,
    recurring_interval: null,
    recurring_days: null,
    recurring_end_type: null,
    recurring_end_count: null,
    recurring_current_count: 1,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────
// getPriorityReason tests
// ─────────────────────────────────────────────────────────────

describe('getPriorityReason', () => {
  test('returns "Completed" for completed tasks', () => {
    const task = makeTask({ completed: true, completed_at: '2025-11-25T10:00:00Z' });
    const reason = getPriorityReason(task);
    expect(reason).toBe('Completed');
  });

  test('returns string containing "Overdue" for past-due tasks', () => {
    // Due 2 days ago (2025-11-23), today is 2025-11-25
    const task = makeTask({ due_date: '2025-11-23' });
    const reason = getPriorityReason(task);
    expect(reason).toContain('Overdue');
    expect(reason).toContain('2');
    expect(reason).toContain('day');
  });

  test('returns "Overdue by 1 day" for task due yesterday (singular)', () => {
    const task = makeTask({ due_date: '2025-11-24' });
    const reason = getPriorityReason(task);
    expect(reason).toBe('Overdue by 1 day');
  });

  test('returns "Due today" for tasks due today', () => {
    const task = makeTask({ due_date: '2025-11-25' });
    const reason = getPriorityReason(task);
    expect(reason).toBe('Due today');
  });

  test('returns "Due tomorrow" for tasks due in 1 day', () => {
    const task = makeTask({ due_date: '2025-11-26' });
    const reason = getPriorityReason(task);
    expect(reason).toBe('Due tomorrow');
  });

  test('returns duration info for large tasks (>=4h) due tomorrow', () => {
    const task = makeTask({ due_date: '2025-11-26', estimated_hours: 8 });
    const reason = getPriorityReason(task);
    expect(reason).toBe('8h task, due tomorrow');
  });

  test('returns deadline info for tasks due within 3 days', () => {
    // Due in 2 days (2025-11-27)
    const task = makeTask({ due_date: '2025-11-27' });
    const reason = getPriorityReason(task);
    expect(reason).toBe('Due in 2 days');
  });

  test('returns duration info for large tasks (>=4h) due within 3 days', () => {
    const task = makeTask({ due_date: '2025-11-27', estimated_hours: 6 });
    const reason = getPriorityReason(task);
    expect(reason).toBe('6h task, due in 2 days');
  });

  test('returns "Due in X days" for tasks due within 7 days', () => {
    // Due in 5 days (2025-11-30)
    const task = makeTask({ due_date: '2025-11-30' });
    const reason = getPriorityReason(task);
    expect(reason).toBe('Due in 5 days');
  });

  test('returns quadrant-based reason "Urgent + Important" when no deadline pressure', () => {
    const task = makeTask({ importance: 'important', urgency: 'urgent' });
    const reason = getPriorityReason(task);
    expect(reason).toBe('Urgent + Important');
  });

  test('returns quadrant-based reason "High impact" for not-urgent + important', () => {
    const task = makeTask({ importance: 'important', urgency: 'not-urgent' });
    const reason = getPriorityReason(task);
    expect(reason).toBe('High impact');
  });

  test('returns quadrant-based reason "Urgent" for urgent + not-important', () => {
    const task = makeTask({ importance: 'not-important', urgency: 'urgent' });
    const reason = getPriorityReason(task);
    expect(reason).toBe('Urgent');
  });

  test('returns "Aging X days" for old tasks with no deadline and low quadrant', () => {
    // Task created 5 days ago: 2025-11-20
    const task = makeTask({
      importance: 'not-important',
      urgency: 'not-urgent',
      created_at: '2025-11-20T12:00:00.000Z',
    });
    const reason = getPriorityReason(task);
    expect(reason).toBe('Aging 5 days');
  });

  test('returns "Scheduled today" as default for new Q4 tasks', () => {
    // Not-urgent, not-important, created today, no due date
    const task = makeTask({
      importance: 'not-important',
      urgency: 'not-urgent',
    });
    const reason = getPriorityReason(task);
    expect(reason).toBe('Scheduled today');
  });

  test('overdue takes priority over quadrant', () => {
    // Overdue Q1 task: should say "Overdue" not "Urgent + Important"
    const task = makeTask({
      importance: 'important',
      urgency: 'urgent',
      due_date: '2025-11-23',
    });
    const reason = getPriorityReason(task);
    expect(reason).toContain('Overdue');
  });

  test('completed takes priority over everything', () => {
    const task = makeTask({
      completed: true,
      completed_at: '2025-11-25T10:00:00Z',
      due_date: '2025-11-23', // overdue
      importance: 'important',
      urgency: 'urgent',
    });
    const reason = getPriorityReason(task);
    expect(reason).toBe('Completed');
  });
});

// ─────────────────────────────────────────────────────────────
// getScoreBreakdown tests
// ─────────────────────────────────────────────────────────────

describe('getScoreBreakdown', () => {
  test('returns object with base, deadline, duration, age, total properties', () => {
    const task = makeTask();
    const breakdown = getScoreBreakdown(task);
    expect(breakdown).toHaveProperty('base');
    expect(breakdown).toHaveProperty('deadline');
    expect(breakdown).toHaveProperty('duration');
    expect(breakdown).toHaveProperty('age');
    expect(breakdown).toHaveProperty('total');
  });

  test('base is 100 for urgent + important', () => {
    const task = makeTask({ importance: 'important', urgency: 'urgent' });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.base).toBe(100);
  });

  test('base is 80 for not-urgent + important', () => {
    const task = makeTask({ importance: 'important', urgency: 'not-urgent' });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.base).toBe(80);
  });

  test('base is 60 for urgent + not-important', () => {
    const task = makeTask({ importance: 'not-important', urgency: 'urgent' });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.base).toBe(60);
  });

  test('base is 40 for not-urgent + not-important', () => {
    const task = makeTask({ importance: 'not-important', urgency: 'not-urgent' });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.base).toBe(40);
  });

  test('total equals sum of all components', () => {
    const task = makeTask({
      importance: 'important',
      urgency: 'urgent',
      due_date: '2025-11-26', // due tomorrow
      estimated_hours: 4,
      created_at: '2025-11-22T12:00:00.000Z', // 3 days old
    });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.total).toBe(
      breakdown.base + breakdown.deadline + breakdown.duration + breakdown.age
    );
  });

  test('deadline is 0 when no due_date', () => {
    const task = makeTask({ due_date: null });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.deadline).toBe(0);
  });

  test('deadline is 0 for completed tasks', () => {
    const task = makeTask({
      completed: true,
      completed_at: '2025-11-25T10:00:00Z',
      due_date: '2025-11-23', // would be overdue if not completed
    });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.deadline).toBe(0);
  });

  test('duration is 0 when no due_date', () => {
    const task = makeTask({ due_date: null, estimated_hours: 8 });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.duration).toBe(0);
  });

  test('duration reflects large tasks near deadline', () => {
    // 8h task due tomorrow: (8 / 1) * 15 = 120
    const task = makeTask({
      due_date: '2025-11-26', // tomorrow
      estimated_hours: 8,
    });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.duration).toBe(120);
  });

  test('age is capped at 10', () => {
    // Task created 20 days ago
    const task = makeTask({
      created_at: '2025-11-05T12:00:00.000Z',
    });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.age).toBe(10);
  });

  test('age is 0 for task created today', () => {
    const task = makeTask({
      created_at: '2025-11-25T12:00:00.000Z',
    });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.age).toBe(0);
  });

  test('deadline score for overdue task is 200 + 25 per day', () => {
    // 3 days overdue (due 2025-11-22, today 2025-11-25)
    const task = makeTask({ due_date: '2025-11-22' });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.deadline).toBe(200 + 3 * 25); // 275
  });

  test('deadline score for task due today is 150', () => {
    const task = makeTask({ due_date: '2025-11-25' });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.deadline).toBe(150);
  });

  test('total matches calculatePriorityScore for the same task', () => {
    // Import calculatePriorityScore for cross-check
    const { calculatePriorityScore } = require('@/lib/utils/task-prioritization');
    const task = makeTask({
      importance: 'important',
      urgency: 'urgent',
      due_date: '2025-11-27',
      estimated_hours: 4,
      created_at: '2025-11-22T12:00:00.000Z',
    });
    const breakdown = getScoreBreakdown(task);
    const score = calculatePriorityScore(task);
    expect(breakdown.total).toBe(score);
  });
});
