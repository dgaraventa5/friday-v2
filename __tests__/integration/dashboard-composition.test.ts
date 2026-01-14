/**
 * Integration tests for dashboard hook composition
 * Tests that useTasks, useReminders, and useDialogState work together correctly
 */

import { renderHook, act } from '@testing-library/react';
import { useTasks } from '@/hooks/use-tasks';
import { useReminders } from '@/hooks/use-reminders';
import { useDialogState } from '@/hooks/use-dialog-state';
import { Task, Profile, Reminder } from '@/lib/types';

// Mock dependencies
const mockToast = jest.fn();
const mockTasksService = {
  getTasksByUserId: jest.fn(),
  createTask: jest.fn(),
  createTasks: jest.fn(),
  updateTask: jest.fn(),
  updateTasks: jest.fn(),
  deleteTask: jest.fn(),
  toggleTaskCompletion: jest.fn(),
};
const mockRemindersService = {
  getRemindersByUserId: jest.fn(),
  createReminder: jest.fn(),
  updateReminder: jest.fn(),
  deleteReminder: jest.fn(),
  getReminderCompletionsByUserId: jest.fn(),
  completeReminder: jest.fn(),
  skipReminder: jest.fn(),
  undoSkipReminder: jest.fn(),
};

const mockProfile: Profile = {
  id: 'user-1',
  email: 'test@example.com',
  full_name: 'Test User',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  timezone: 'America/New_York',
  current_streak: 0,
  longest_streak: 0,
  last_completion_date: null,
  notification_enabled: true,
  notification_time: '09:00',
  start_of_week: 1,
  daily_max_hours: 8,
  daily_max_tasks: 10,
  look_ahead_days: 14,
  skip_auto_schedule: false,
  category_limits: {},
};

// Mock task-prioritization module
const mockAssignStartDates = jest.fn((tasks) => ({
  tasks,
  warnings: [],
  rescheduledTasks: [],
}));

jest.mock('@/lib/utils/task-prioritization', () => ({
  assignStartDates: (...args: any[]) => mockAssignStartDates(...args),
}));

describe('Dashboard Hook Composition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.mockClear();
    mockAssignStartDates.mockImplementation((tasks) => ({
      tasks,
      warnings: [],
      rescheduledTasks: [],
    }));
  });

  describe('Dialog State Independence', () => {
    it('should manage task and reminder dialogs independently', () => {
      const { result } = renderHook(() => useDialogState());

      // Initially both closed
      expect(result.current.showAddTaskDialog).toBe(false);
      expect(result.current.showAddReminderDialog).toBe(false);

      // Open task dialog
      act(() => {
        result.current.openAddTaskDialog();
      });
      expect(result.current.showAddTaskDialog).toBe(true);
      expect(result.current.showAddReminderDialog).toBe(false);

      // Open reminder dialog (both can be open)
      act(() => {
        result.current.openAddReminderDialog();
      });
      expect(result.current.showAddTaskDialog).toBe(true);
      expect(result.current.showAddReminderDialog).toBe(true);

      // Close task dialog
      act(() => {
        result.current.closeAddTaskDialog();
      });
      expect(result.current.showAddTaskDialog).toBe(false);
      expect(result.current.showAddReminderDialog).toBe(true);

      // Close reminder dialog
      act(() => {
        result.current.closeAddReminderDialog();
      });
      expect(result.current.showAddTaskDialog).toBe(false);
      expect(result.current.showAddReminderDialog).toBe(false);
    });
  });

  describe('Hook Initialization', () => {
    it('should initialize useTasks without errors', () => {
      const { result } = renderHook(() =>
        useTasks({
          initialTasks: [],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToast,
        })
      );

      expect(result.current.tasks).toEqual([]);
      expect(result.current.isPulling).toBe(false);
      expect(typeof result.current.addTask).toBe('function');
      expect(typeof result.current.updateTask).toBe('function');
      expect(typeof result.current.deleteTask).toBe('function');
      expect(typeof result.current.toggleComplete).toBe('function');
    });

    it('should initialize useReminders without errors', () => {
      const { result } = renderHook(() =>
        useReminders({
          initialReminders: [],
          initialReminderCompletions: [],
          remindersService: mockRemindersService,
          toast: mockToast,
        })
      );

      expect(result.current.reminders).toEqual([]);
      expect(result.current.reminderCompletions).toEqual([]);
      expect(result.current.todaysReminders).toEqual([]);
      expect(typeof result.current.addReminder).toBe('function');
      expect(typeof result.current.completeReminder).toBe('function');
      expect(typeof result.current.skipReminder).toBe('function');
    });

    it('should initialize useDialogState without errors', () => {
      const { result } = renderHook(() => useDialogState());

      expect(result.current.showAddTaskDialog).toBe(false);
      expect(result.current.showAddReminderDialog).toBe(false);
      expect(typeof result.current.openAddTaskDialog).toBe('function');
      expect(typeof result.current.closeAddTaskDialog).toBe('function');
      expect(typeof result.current.openAddReminderDialog).toBe('function');
      expect(typeof result.current.closeAddReminderDialog).toBe('function');
    });
  });

  describe('Multiple Hooks Together', () => {
    it('should initialize all hooks together without conflicts', () => {
      const dialogHook = renderHook(() => useDialogState());
      const tasksHook = renderHook(() =>
        useTasks({
          initialTasks: [],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToast,
        })
      );
      const remindersHook = renderHook(() =>
        useReminders({
          initialReminders: [],
          initialReminderCompletions: [],
          remindersService: mockRemindersService,
          toast: mockToast,
        })
      );

      // Verify all hooks initialized successfully
      expect(dialogHook.result.current).toBeDefined();
      expect(tasksHook.result.current).toBeDefined();
      expect(remindersHook.result.current).toBeDefined();

      // Verify hooks maintain independent state
      expect(tasksHook.result.current.tasks).toEqual([]);
      expect(remindersHook.result.current.reminders).toEqual([]);
      expect(dialogHook.result.current.showAddTaskDialog).toBe(false);
    });

    it('should handle dialog state changes without affecting data hooks', () => {
      const dialogHook = renderHook(() => useDialogState());
      const tasksHook = renderHook(() =>
        useTasks({
          initialTasks: [{
            id: 'task-1',
            user_id: 'user-1',
            title: 'Test Task',
            is_completed: false,
          } as Task],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToast,
        })
      );

      // Open dialog
      act(() => {
        dialogHook.result.current.openAddTaskDialog();
      });

      // Verify dialog state changed but task state unchanged
      expect(dialogHook.result.current.showAddTaskDialog).toBe(true);
      expect(tasksHook.result.current.tasks).toHaveLength(1);
      expect(tasksHook.result.current.tasks[0].id).toBe('task-1');
    });
  });

  describe('Hook Edit State Management', () => {
    it('should manage task editing state independently from reminders', () => {
      const mockTask: Task = {
        id: 'task-1',
        user_id: 'user-1',
        title: 'Test Task',
        is_completed: false,
      } as Task;

      const mockReminder: Reminder = {
        id: 'reminder-1',
        user_id: 'user-1',
        title: 'Test Reminder',
        frequency: 'daily',
        time_of_day: '09:00',
        days_of_week: [1, 2, 3, 4, 5],
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const tasksHook = renderHook(() =>
        useTasks({
          initialTasks: [mockTask],
          tasksService: mockTasksService,
          profile: mockProfile,
          toast: mockToast,
        })
      );

      const remindersHook = renderHook(() =>
        useReminders({
          initialReminders: [mockReminder],
          initialReminderCompletions: [],
          remindersService: mockRemindersService,
          toast: mockToast,
        })
      );

      // Start editing task
      act(() => {
        tasksHook.result.current.editTask(mockTask);
      });

      expect(tasksHook.result.current.editingTask).toEqual(mockTask);
      expect(tasksHook.result.current.showEditDialog).toBe(true);
      expect(remindersHook.result.current.editingReminder).toBeNull();

      // Start editing reminder
      act(() => {
        remindersHook.result.current.editReminder({
          ...mockReminder,
          status: 'active',
        });
      });

      // editingReminder stores the base Reminder properties
      expect(remindersHook.result.current.editingReminder).toMatchObject(mockReminder);
      expect(remindersHook.result.current.showEditReminderDialog).toBe(true);
      // Task editing state should remain unchanged
      expect(tasksHook.result.current.editingTask).toEqual(mockTask);
      expect(tasksHook.result.current.showEditDialog).toBe(true);
    });
  });
});
