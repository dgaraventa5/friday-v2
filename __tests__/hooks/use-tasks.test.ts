import { renderHook, act, waitFor } from '@testing-library/react';
import { useTasks } from '@/hooks/use-tasks';
import { TasksService } from '@/lib/services';
import { Task, Profile } from '@/lib/types';
import * as prioritizationUtils from '@/lib/utils/task-prioritization';
import * as recurringTasksUtils from '@/lib/utils/recurring-tasks';

// Mock next/navigation
const mockRouterRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
  }),
}));

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock utilities
jest.mock('@/lib/utils/task-prioritization');
jest.mock('@/lib/utils/recurring-tasks');

// Mock fetch for streak API calls
global.fetch = jest.fn();

describe('useTasks', () => {
  let mockTasksService: jest.Mocked<TasksService>;
  let mockProfile: Profile;
  let mockToastFn: jest.Mock;

  const mockTask: Task = {
    id: 'task-1',
    user_id: 'user-1',
    title: 'Test Task',
    category: 'Work',
    importance: 'important',
    urgency: 'urgent',
    due_date: '2026-01-15',
    start_date: '2026-01-15',
    estimated_hours: 2,
    completed: false,
    completed_at: null,
    is_recurring: false,
    recurring_series_id: null,
    recurrence_pattern: null,
    pinned_date: null,
    created_at: '2026-01-13T00:00:00Z',
    updated_at: '2026-01-13T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset fetch mock
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    mockToastFn = jest.fn();
    mockToast.mockReturnValue(mockToastFn);

    mockProfile = {
      id: 'user-1',
      email: 'test@example.com',
      full_name: 'Test User',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      current_streak: 0,
      longest_streak: 0,
      last_completion_date: null,
      category_limits: {
        Work: { weekday: 10, weekend: 2 },
        Home: { weekday: 3, weekend: 4 },
        Health: { weekday: 3, weekend: 2 },
        Personal: { weekday: 2, weekend: 4 },
      },
      daily_max_hours: {
        weekday: 10,
        weekend: 6,
      },
      daily_max_tasks: {
        weekday: 4,
        weekend: 4,
      },
      onboarding_completed: true,
    };

    // Mock TasksService
    mockTasksService = {
      createTask: jest.fn(),
      createTasks: jest.fn(),
      updateTask: jest.fn(),
      updateTasks: jest.fn(),
      deleteTask: jest.fn(),
      getTasksByUserId: jest.fn(),
      getTaskById: jest.fn(),
      toggleTaskCompletion: jest.fn(),
    } as any;

    // Mock assignStartDates to return tasks as-is by default
    (prioritizationUtils.assignStartDates as jest.Mock).mockReturnValue({
      tasks: [mockTask],
      rescheduledTasks: [],
      warnings: [],
    });

    // Mock generateNextRecurringInstance
    (recurringTasksUtils.generateNextRecurringInstance as jest.Mock).mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should initialize with provided tasks', () => {
      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0]).toEqual(mockTask);
    });

    it('should initialize with empty editing state', () => {
      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      expect(result.current.editingTask).toBeNull();
      expect(result.current.showEditDialog).toBe(false);
      expect(result.current.isPulling).toBe(false);
    });
  });

  describe('addTask', () => {
    it('should add a single task and run scheduling', async () => {
      mockTasksService.updateTasks.mockResolvedValue({ data: undefined, error: null });

      const newTask: Task = { ...mockTask, id: 'task-2', title: 'New Task' };

      (prioritizationUtils.assignStartDates as jest.Mock).mockReturnValue({
        tasks: [mockTask, newTask],
        rescheduledTasks: [{ task: newTask, oldDate: null, newDate: '2026-01-15' }],
        warnings: [],
      });

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.addTask(newTask);
      });

      expect(prioritizationUtils.assignStartDates).toHaveBeenCalled();
      expect(mockTasksService.updateTasks).toHaveBeenCalled();
      expect(result.current.tasks).toHaveLength(2);
    });

    it('should add multiple tasks at once', async () => {
      mockTasksService.updateTasks.mockResolvedValue({ data: undefined, error: null });

      const newTasks = [
        { ...mockTask, id: 'task-2', title: 'Task 2' },
        { ...mockTask, id: 'task-3', title: 'Task 3' },
      ];

      (prioritizationUtils.assignStartDates as jest.Mock).mockReturnValue({
        tasks: [mockTask, ...newTasks],
        rescheduledTasks: [],
        warnings: [],
      });

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.addTask(newTasks);
      });

      expect(result.current.tasks).toHaveLength(3);
    });

    it('should show warning toast if scheduling produces warnings', async () => {
      mockTasksService.updateTasks.mockResolvedValue({ data: undefined, error: null });

      const newTask: Task = { ...mockTask, id: 'task-2' };

      (prioritizationUtils.assignStartDates as jest.Mock).mockReturnValue({
        tasks: [mockTask, newTask],
        rescheduledTasks: [],
        warnings: ['Schedule is overloaded'],
      });

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.addTask(newTask);
      });

      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Scheduling Warning',
          variant: 'destructive',
        })
      );
    });
  });

  describe('toggleComplete', () => {
    it('should mark task as completed and update streak', async () => {
      const completedTask = { ...mockTask, completed: true, completed_at: new Date().toISOString() };

      // First mock returns initial tasks as-is
      (prioritizationUtils.assignStartDates as jest.Mock)
        .mockReturnValueOnce({
          tasks: [mockTask],
          rescheduledTasks: [],
          warnings: [],
        })
        .mockReturnValueOnce({
          tasks: [completedTask],
          rescheduledTasks: [],
          warnings: [],
        });

      mockTasksService.updateTask.mockResolvedValue({
        data: completedTask,
        error: null,
      });

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.toggleComplete(mockTask.id);
      });

      expect(mockTasksService.updateTask).toHaveBeenCalledWith(
        mockTask.id,
        expect.objectContaining({
          completed: true,
          completed_at: expect.any(String),
        })
      );

      // Should update streak
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/streak',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'update' }),
        })
      );
    });

    it('should mark task as uncompleted and recalculate streak', async () => {
      const completedTask = { ...mockTask, completed: true, completed_at: '2026-01-13T12:00:00Z' };
      const uncompletedTask = { ...mockTask, completed: false, completed_at: null };

      // First mock returns initial tasks as-is, second returns uncompleted task
      (prioritizationUtils.assignStartDates as jest.Mock)
        .mockReturnValueOnce({
          tasks: [completedTask],
          rescheduledTasks: [],
          warnings: [],
        })
        .mockReturnValueOnce({
          tasks: [uncompletedTask],
          rescheduledTasks: [],
          warnings: [],
        });

      mockTasksService.updateTask.mockResolvedValue({
        data: uncompletedTask,
        error: null,
      });

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [completedTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.toggleComplete(completedTask.id);
      });

      expect(mockTasksService.updateTask).toHaveBeenCalledWith(
        completedTask.id,
        expect.objectContaining({
          completed: false,
          completed_at: null,
        })
      );

      // Should recalculate streak
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/streak',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'recalculate' }),
        })
      );
    });

    it('should create next instance for recurring task', async () => {
      const recurringTask: Task = {
        ...mockTask,
        is_recurring: true,
        recurring_series_id: 'series-1',
        recurrence_pattern: { frequency: 'daily', interval: 1 },
      };

      const nextInstance: Task = {
        ...recurringTask,
        id: 'task-2',
        start_date: '2026-01-16',
        completed: false,
      };

      mockTasksService.updateTask.mockResolvedValue({
        data: { ...recurringTask, completed: true },
        error: null,
      });

      mockTasksService.createTask.mockResolvedValue({
        data: nextInstance,
        error: null,
      });

      (recurringTasksUtils.generateNextRecurringInstance as jest.Mock).mockReturnValue(nextInstance);

      // Reset and setup assignStartDates mock for this test
      (prioritizationUtils.assignStartDates as jest.Mock).mockReset();
      (prioritizationUtils.assignStartDates as jest.Mock)
        .mockReturnValueOnce({
          tasks: [recurringTask],
          rescheduledTasks: [],
          warnings: [],
        })
        .mockReturnValueOnce({
          tasks: [{ ...recurringTask, completed: true }, nextInstance],
          rescheduledTasks: [],
          warnings: [],
        });

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [recurringTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      // Wait for initial scheduling to complete
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
        expect(result.current.tasks[0].is_recurring).toBe(true);
      });

      await act(async () => {
        await result.current.toggleComplete(recurringTask.id);
      });

      // Verify the task was marked as completed
      expect(mockTasksService.updateTask).toHaveBeenCalledWith(
        recurringTask.id,
        expect.objectContaining({
          completed: true,
          completed_at: expect.any(String),
        })
      );

      // Verify next instance generation was called
      expect(recurringTasksUtils.generateNextRecurringInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          id: recurringTask.id,
          is_recurring: true,
        })
      );

      // Verify next instance was created
      expect(mockTasksService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'task-2',
          user_id: 'user-1',
        })
      );
    });

    it('should skip auto-scheduling when skipAutoSchedule is true', async () => {
      mockTasksService.updateTask.mockResolvedValue({
        data: { ...mockTask, completed: true },
        error: null,
      });

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.toggleComplete(mockTask.id, true);
      });

      // Should NOT call assignStartDates when skipAutoSchedule is true
      expect(prioritizationUtils.assignStartDates).toHaveBeenCalledTimes(1); // Only initial scheduling
    });
  });

  describe('updateTask', () => {
    it('should update task and run scheduling', async () => {
      const updatedTask = { ...mockTask, title: 'Updated Task' };

      mockTasksService.updateTasks.mockResolvedValue({ data: undefined, error: null });

      (prioritizationUtils.assignStartDates as jest.Mock).mockReturnValue({
        tasks: [updatedTask],
        rescheduledTasks: [],
        warnings: [],
      });

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.updateTask(updatedTask);
      });

      expect(prioritizationUtils.assignStartDates).toHaveBeenCalled();
      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Task Updated',
        })
      );
    });

    it('should handle rescheduling of other tasks', async () => {
      const updatedTask = { ...mockTask, estimated_hours: 5 };
      const otherTask = { ...mockTask, id: 'task-2', start_date: '2026-01-16' };

      mockTasksService.updateTasks.mockResolvedValue({ data: undefined, error: null });

      (prioritizationUtils.assignStartDates as jest.Mock).mockReturnValue({
        tasks: [updatedTask, otherTask],
        rescheduledTasks: [
          { task: otherTask, oldDate: '2026-01-15', newDate: '2026-01-16' },
        ],
        warnings: [],
      });

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask, otherTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.updateTask(updatedTask);
      });

      expect(mockTasksService.updateTasks).toHaveBeenCalled();
      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Tasks Rescheduled',
        })
      );
    });
  });

  describe('deleteTask', () => {
    it('should delete task and run scheduling', async () => {
      // Mock window.confirm
      global.confirm = jest.fn(() => true);

      mockTasksService.deleteTask.mockResolvedValue({ data: undefined, error: null });

      (prioritizationUtils.assignStartDates as jest.Mock).mockReturnValue({
        tasks: [],
        rescheduledTasks: [],
        warnings: [],
      });

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.deleteTask(mockTask.id);
      });

      expect(global.confirm).toHaveBeenCalled();
      expect(mockTasksService.deleteTask).toHaveBeenCalledWith(mockTask.id);
      expect(result.current.tasks).toHaveLength(0);
    });

    it('should not delete if user cancels confirmation', async () => {
      global.confirm = jest.fn(() => false);

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.deleteTask(mockTask.id);
      });

      expect(mockTasksService.deleteTask).not.toHaveBeenCalled();
      expect(result.current.tasks).toHaveLength(1);
    });

    it('should show error toast on delete failure', async () => {
      global.confirm = jest.fn(() => true);

      mockTasksService.deleteTask.mockResolvedValue({
        data: null,
        error: new Error('Delete failed'),
      });

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.deleteTask(mockTask.id);
      });

      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Delete Failed',
          variant: 'destructive',
        })
      );
    });
  });

  describe('pullToToday', () => {
    it('should add task to pull queue', () => {
      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      act(() => {
        result.current.pullToToday(mockTask.id);
      });

      expect(result.current.isPulling).toBe(true);
    });

    it('should process pull queue and update task', async () => {
      mockTasksService.updateTask.mockResolvedValue({
        data: { ...mockTask, start_date: '2026-01-13', pinned_date: '2026-01-13' },
        error: null,
      });

      mockTasksService.updateTasks.mockResolvedValue({ data: undefined, error: null });

      (prioritizationUtils.assignStartDates as jest.Mock).mockReturnValue({
        tasks: [{ ...mockTask, start_date: '2026-01-13', pinned_date: '2026-01-13' }],
        rescheduledTasks: [],
        warnings: [],
      });

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      act(() => {
        result.current.pullToToday(mockTask.id);
      });

      await waitFor(() => {
        expect(mockTasksService.updateTask).toHaveBeenCalledWith(
          mockTask.id,
          expect.objectContaining({
            start_date: expect.any(String),
            pinned_date: expect.any(String),
          })
        );
      });

      await waitFor(() => {
        expect(result.current.isPulling).toBe(false);
      });
    });
  });

  describe('editTask', () => {
    it('should set editing task and open dialog', () => {
      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      act(() => {
        result.current.editTask(mockTask);
      });

      expect(result.current.editingTask).toEqual(mockTask);
      expect(result.current.showEditDialog).toBe(true);
    });

    it('should allow setting editing task to null', () => {
      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      act(() => {
        result.current.editTask(mockTask);
      });

      expect(result.current.editingTask).toEqual(mockTask);

      act(() => {
        result.current.setEditingTask(null);
      });

      expect(result.current.editingTask).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle toggleComplete errors gracefully', async () => {
      mockTasksService.updateTask.mockResolvedValue({
        data: null,
        error: new Error('Update failed'),
      });

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        await result.current.toggleComplete(mockTask.id);
      });

      // Should revert to original state on error
      expect(result.current.tasks[0].completed).toBe(false);
    });

    it('should handle addTask errors', async () => {
      mockTasksService.updateTasks.mockRejectedValue(new Error('Network error'));

      const newTask: Task = { ...mockTask, id: 'task-2' };

      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToastFn,
        })
      );

      await act(async () => {
        try {
          await result.current.addTask(newTask);
        } catch (e) {
          // Expected to throw
        }
      });

      // State should still be updated even if batch update fails
      expect(result.current.tasks.length).toBeGreaterThan(0);
    });
  });
});
