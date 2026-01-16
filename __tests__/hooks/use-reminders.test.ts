import { renderHook, act, waitFor } from '@testing-library/react';
import { useReminders } from '@/hooks/use-reminders';
import { Reminder, ReminderCompletion } from '@/lib/types';
import { RemindersService } from '@/lib/services/reminders-service';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock('@/lib/supabase/client', () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'user-1' } },
        error: null,
      })),
    },
  })),
}));

// Mock date-utils to return a consistent date for testing
jest.mock('@/lib/utils/date-utils', () => ({
  ...jest.requireActual('@/lib/utils/date-utils'),
  getTodayLocal: jest.fn(() => '2026-01-13'),
}));

// Mock fetch for streak API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({}),
  })
) as jest.Mock;

describe('useReminders', () => {
  let mockRemindersService: jest.Mocked<RemindersService>;
  let mockToastFn: jest.Mock;

  const mockReminder: Reminder = {
    id: 'reminder-1',
    user_id: 'user-1',
    title: 'Test Reminder',
    time_label: 'Morning',
    recurrence_type: 'daily',
    recurrence_interval: 1,
    recurrence_days: null,
    monthly_type: null,
    monthly_week_position: null,
    start_date: '2026-01-13',
    end_type: 'never',
    end_count: null,
    end_date: null,
    current_count: 0,
    is_active: true,
    created_at: '2026-01-13T00:00:00Z',
    updated_at: '2026-01-13T00:00:00Z',
  };

  const mockCompletion: ReminderCompletion = {
    id: 'completion-1',
    reminder_id: 'reminder-1',
    completion_date: '2026-01-13',
    status: 'completed',
    completed_at: '2026-01-13T12:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockToastFn = jest.fn();

    mockRemindersService = {
      createReminder: jest.fn(),
      updateReminder: jest.fn(),
      deleteReminder: jest.fn(),
      getReminder: jest.fn(),
      getRemindersByUserId: jest.fn(),
      upsertCompletion: jest.fn(),
      deleteCompletion: jest.fn(),
      getReminderCompletions: jest.fn(),
    } as any;

    (global.fetch as jest.Mock).mockClear();
  });

  describe('Initial State', () => {
    it('should initialize with provided reminders and completions', () => {
      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [mockReminder],
          initialReminderCompletions: [mockCompletion],
          remindersService: mockRemindersService,
          toast: mockToastFn,
        })
      );

      expect(result.current.reminders).toEqual([mockReminder]);
      expect(result.current.reminderCompletions).toEqual([mockCompletion]);
      expect(result.current.todaysReminders).toHaveLength(1);
    });

    it('should initialize with empty editing state', () => {
      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [],
          initialReminderCompletions: [],
          remindersService: mockRemindersService,
          toast: mockToastFn,
        })
      );

      expect(result.current.editingReminder).toBeNull();
      expect(result.current.showEditReminderDialog).toBe(false);
    });
  });

  describe('addReminder', () => {
    it('should add a new reminder', async () => {
      const newReminder = { ...mockReminder, id: 'reminder-2', title: 'New Reminder' };
      mockRemindersService.createReminder.mockResolvedValue({
        data: newReminder,
        error: null,
      });

      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [],
          initialReminderCompletions: [],
          remindersService: mockRemindersService,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.addReminder({ title: 'New Reminder', time_label: 'Morning' });
      });

      expect(mockRemindersService.createReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Reminder',
          time_label: 'Morning',
          user_id: 'user-1',
        })
      );
      expect(result.current.reminders).toHaveLength(1);
      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Reminder Added',
        })
      );
    });

    it('should handle errors when adding reminder', async () => {
      mockRemindersService.createReminder.mockResolvedValue({
        data: null,
        error: new Error('Create failed'),
      });

      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [],
          initialReminderCompletions: [],
          remindersService: mockRemindersService,
          toast: mockToastFn,
        })
      );

      await expect(async () => {
        await act(async () => {
          await result.current.addReminder({ title: 'New Reminder' });
        });
      }).rejects.toThrow();

      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive',
        })
      );
    });
  });

  describe('completeReminder', () => {
    it('should complete a reminder and update streak', async () => {
      mockRemindersService.upsertCompletion.mockResolvedValue({
        data: mockCompletion,
        error: null,
      });

      mockRemindersService.updateReminder.mockResolvedValue({
        data: { ...mockReminder, current_count: 1 },
        error: null,
      });

      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [mockReminder],
          initialReminderCompletions: [],
          remindersService: mockRemindersService,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.completeReminder(mockReminder.id);
      });

      expect(mockRemindersService.upsertCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          reminder_id: mockReminder.id,
          status: 'completed',
        })
      );

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/streak',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'update' }),
        })
      );

      expect(mockRemindersService.updateReminder).toHaveBeenCalledWith(
        mockReminder.id,
        expect.objectContaining({
          current_count: 1,
        })
      );
    });

    it('should undo completion when already completed', async () => {
      const completedReminder = { ...mockReminder, current_count: 1 };

      mockRemindersService.deleteCompletion.mockResolvedValue({
        data: null,
        error: null,
      });

      mockRemindersService.updateReminder.mockResolvedValue({
        data: mockReminder,
        error: null,
      });

      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [completedReminder],
          initialReminderCompletions: [mockCompletion],
          remindersService: mockRemindersService,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.completeReminder(mockReminder.id);
      });

      expect(mockRemindersService.deleteCompletion).toHaveBeenCalledWith(mockCompletion.id);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/streak',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'recalculate' }),
        })
      );

      expect(mockRemindersService.updateReminder).toHaveBeenCalledWith(
        mockReminder.id,
        expect.objectContaining({
          current_count: 0,
        })
      );
    });
  });

  describe('skipReminder', () => {
    it('should skip a reminder', async () => {
      const skippedCompletion = { ...mockCompletion, status: 'skipped' as const };
      mockRemindersService.upsertCompletion.mockResolvedValue({
        data: skippedCompletion,
        error: null,
      });

      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [mockReminder],
          initialReminderCompletions: [],
          remindersService: mockRemindersService,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.skipReminder(mockReminder.id);
      });

      expect(mockRemindersService.upsertCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          reminder_id: mockReminder.id,
          status: 'skipped',
        })
      );

      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Reminder Skipped',
        })
      );
    });
  });

  describe('undoSkipReminder', () => {
    it('should undo a skipped reminder', async () => {
      const skippedCompletion = { ...mockCompletion, status: 'skipped' as const };

      mockRemindersService.deleteCompletion.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [mockReminder],
          initialReminderCompletions: [skippedCompletion],
          remindersService: mockRemindersService,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.undoSkipReminder(mockReminder.id);
      });

      expect(mockRemindersService.deleteCompletion).toHaveBeenCalledWith(skippedCompletion.id);
      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Skip Undone',
        })
      );
    });

    it('should do nothing if no skipped completion exists', async () => {
      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [mockReminder],
          initialReminderCompletions: [],
          remindersService: mockRemindersService,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.undoSkipReminder(mockReminder.id);
      });

      expect(mockRemindersService.deleteCompletion).not.toHaveBeenCalled();
    });
  });

  describe('editReminder', () => {
    it('should set editing reminder and open dialog', () => {
      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [mockReminder],
          initialReminderCompletions: [],
          remindersService: mockRemindersService,
          toast: mockToastFn,
        })
      );

      act(() => {
        result.current.editReminder(mockReminder as any);
      });

      expect(result.current.editingReminder).toEqual(mockReminder);
      expect(result.current.showEditReminderDialog).toBe(true);
    });
  });

  describe('updateReminder', () => {
    it('should update a reminder', async () => {
      const updatedReminder = { ...mockReminder, title: 'Updated Reminder' };

      mockRemindersService.updateReminder.mockResolvedValue({
        data: updatedReminder,
        error: null,
      });

      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [mockReminder],
          initialReminderCompletions: [],
          remindersService: mockRemindersService,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.updateReminder(updatedReminder);
      });

      expect(mockRemindersService.updateReminder).toHaveBeenCalledWith(
        mockReminder.id,
        expect.objectContaining({
          title: 'Updated Reminder',
        })
      );

      expect(result.current.reminders[0].title).toBe('Updated Reminder');
      expect(result.current.showEditReminderDialog).toBe(false);
      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Reminder Updated',
        })
      );
    });
  });

  describe('deleteReminder', () => {
    it('should delete a reminder after confirmation', async () => {
      global.confirm = jest.fn(() => true);

      mockRemindersService.deleteReminder.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [mockReminder],
          initialReminderCompletions: [mockCompletion],
          remindersService: mockRemindersService,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.deleteReminder(mockReminder.id);
      });

      expect(mockRemindersService.deleteReminder).toHaveBeenCalledWith(mockReminder.id);
      expect(result.current.reminders).toHaveLength(0);
      expect(result.current.reminderCompletions).toHaveLength(0);
      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Reminder Deleted',
        })
      );
    });

    it('should not delete if user cancels', async () => {
      global.confirm = jest.fn(() => false);

      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [mockReminder],
          initialReminderCompletions: [],
          remindersService: mockRemindersService,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.deleteReminder(mockReminder.id);
      });

      expect(mockRemindersService.deleteReminder).not.toHaveBeenCalled();
      expect(result.current.reminders).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle complete reminder errors gracefully', async () => {
      mockRemindersService.upsertCompletion.mockResolvedValue({
        data: null,
        error: new Error('Completion failed'),
      });

      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [mockReminder],
          initialReminderCompletions: [],
          remindersService: mockRemindersService,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.completeReminder(mockReminder.id);
      });

      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive',
        })
      );
    });
  });
});
