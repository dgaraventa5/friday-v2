import { renderHook, act } from '@testing-library/react';
import { useRecalibration } from '@/hooks/use-recalibration';
import { Task } from '@/lib/types';

// Mock recalibration-utils so we can control shouldShowRecalibration
jest.mock('@/lib/utils/recalibration-utils', () => ({
  getTasksForRecalibration: jest.fn(() => ({
    overdue: [],
    dueToday: [],
    dueTomorrow: [],
  })),
  shouldShowRecalibration: jest.fn(() => false),
  parseTriggerHour: jest.fn(() => 17),
}));

import {
  shouldShowRecalibration,
} from '@/lib/utils/recalibration-utils';

const mockShouldShow = shouldShowRecalibration as jest.MockedFunction<typeof shouldShowRecalibration>;

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
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

describe('useRecalibration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const tasks = [createMockTask()];

  // Helper: render and trigger the auto-open by advancing past the 1s delay
  function renderAndTrigger(
    hookTasks: Task[],
    options: Parameters<typeof useRecalibration>[1] = {}
  ) {
    const hookResult = renderHook(
      ({ t, opts }) => useRecalibration(t, opts),
      { initialProps: { t: hookTasks, opts: { enabled: true, ...options } } }
    );
    // The useEffect schedules a setTimeout(1000). Flush it.
    act(() => { jest.runAllTimers(); });
    return hookResult;
  }

  describe('auto-trigger only fires once', () => {
    it('opens modal when shouldShowRecalibration returns true', () => {
      mockShouldShow.mockReturnValue(true);

      const { result } = renderAndTrigger(tasks);

      expect(result.current.isOpen).toBe(true);
    });

    it('does NOT re-open modal after tasks change (hasCheckedTrigger guards re-trigger)', () => {
      mockShouldShow.mockReturnValue(true);

      const { result, rerender } = renderAndTrigger(tasks);
      expect(result.current.isOpen).toBe(true);

      // Close the modal (simulating user clicking X)
      act(() => { result.current.setIsOpen(false); });
      expect(result.current.isOpen).toBe(false);

      // Re-render with new tasks (simulating data refresh)
      rerender({ t: [createMockTask({ id: 'task-2' })], opts: { enabled: true } });
      act(() => { jest.runAllTimers(); });

      // Modal should NOT re-open
      expect(result.current.isOpen).toBe(false);

      // shouldShowRecalibration should only have been called once
      expect(mockShouldShow).toHaveBeenCalledTimes(1);
    });
  });

  describe('close persists dismissal', () => {
    it('calls onDismiss when close() is called', async () => {
      mockShouldShow.mockReturnValue(true);
      const onDismiss = jest.fn().mockResolvedValue(undefined);

      const { result } = renderAndTrigger(tasks, { onDismiss });
      expect(result.current.isOpen).toBe(true);

      await act(async () => { await result.current.close(); });

      expect(result.current.isOpen).toBe(false);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('calls onDismiss when skipToday() is called', async () => {
      mockShouldShow.mockReturnValue(true);
      const onDismiss = jest.fn().mockResolvedValue(undefined);

      const { result } = renderAndTrigger(tasks, { onDismiss });
      expect(result.current.isOpen).toBe(true);

      await act(async () => { await result.current.skipToday(); });

      expect(result.current.isOpen).toBe(false);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('manual open bypasses checks', () => {
    it('can open manually even after auto-trigger was checked', () => {
      mockShouldShow.mockReturnValue(false);

      const { result } = renderAndTrigger(tasks);

      // Auto-trigger check runs but doesn't open (shouldShow is false)
      expect(result.current.isOpen).toBe(false);

      // Manual open should still work
      act(() => { result.current.openManually(); });
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('does not auto-trigger when disabled', () => {
    it('stays closed when enabled is false', () => {
      mockShouldShow.mockReturnValue(true);

      const { result } = renderAndTrigger(tasks, { enabled: false });

      expect(result.current.isOpen).toBe(false);
      expect(mockShouldShow).not.toHaveBeenCalled();
    });
  });
});
