import { TasksService } from '@/lib/services/tasks-service';
import { Task } from '@/lib/types';
import { SupabaseClient } from '@supabase/supabase-js';

// Create a properly chainable mock Supabase client
const createMockSupabaseClient = () => {
  const client = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  };

  return client;
};

describe('TasksService', () => {
  let service: TasksService;
  let mockSupabase: any;

  const mockTask: Task = {
    id: 'task-1',
    user_id: 'user-123',
    title: 'Test Task',
    description: 'Test description',
    priority: 'A',
    is_mit: true,
    completed: false,
    completed_at: null,
    due_date: '2025-12-31',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    importance: 'important',
    urgency: 'urgent',
    estimated_hours: 2,
    start_date: '2025-01-15',
    pinned_date: null,
    category: 'Work',
    recurring_series_id: null,
    is_recurring: false,
    recurring_interval: null,
    recurring_days: null,
    recurring_end_type: null,
    recurring_end_count: null,
    recurring_current_count: 1,
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create fresh mock Supabase client
    mockSupabase = createMockSupabaseClient();
    service = new TasksService(mockSupabase as unknown as SupabaseClient);
  });

  describe('getTasksByUserId', () => {
    it('should successfully fetch tasks for a user', async () => {
      const mockTasks = [mockTask, { ...mockTask, id: 'task-2', title: 'Task 2' }];

      // Set up the final return value
      mockSupabase.order.mockResolvedValueOnce({ data: mockTasks, error: null });

      const result = await service.getTasksByUserId('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });

      expect(result.data).toEqual(mockTasks);
      expect(result.error).toBeNull();
    });

    it('should handle errors when fetching tasks', async () => {
      const mockError = { message: 'Database error' };

      mockSupabase.order.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.getTasksByUserId('user-123');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to fetch tasks');
    });
  });

  describe('getTaskById', () => {
    it('should successfully fetch a single task', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: mockTask, error: null });

      const result = await service.getTaskById('task-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'task-1');
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result.data).toEqual(mockTask);
      expect(result.error).toBeNull();
    });

    it('should handle task not found', async () => {
      const mockError = { message: 'Task not found' };

      mockSupabase.single.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.getTaskById('nonexistent');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('createTask', () => {
    it('should successfully create a task', async () => {
      const newTaskData: Partial<Task> = {
        user_id: 'user-123',
        title: 'New Task',
        importance: 'important',
        urgency: 'urgent',
        estimated_hours: 1,
        category: 'Work',
      };

      mockSupabase.single.mockResolvedValueOnce({ data: mockTask, error: null });

      const result = await service.createTask(newTaskData);

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(mockSupabase.insert).toHaveBeenCalledWith(newTaskData);
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result.data).toEqual(mockTask);
      expect(result.error).toBeNull();
    });

    it('should handle creation errors', async () => {
      const mockError = { message: 'Validation error' };

      mockSupabase.single.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.createTask({});

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to create task');
    });
  });

  describe('createTasks', () => {
    it('should successfully create multiple tasks', async () => {
      const newTasks: Partial<Task>[] = [
        { user_id: 'user-123', title: 'Task 1', importance: 'important', urgency: 'urgent', estimated_hours: 1, category: 'Work' },
        { user_id: 'user-123', title: 'Task 2', importance: 'not-important', urgency: 'urgent', estimated_hours: 2, category: 'Home' },
      ];

      const createdTasks = [mockTask, { ...mockTask, id: 'task-2', title: 'Task 2' }];

      mockSupabase.select.mockResolvedValueOnce({ data: createdTasks, error: null });

      const result = await service.createTasks(newTasks);

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(mockSupabase.insert).toHaveBeenCalledWith(newTasks);
      expect(mockSupabase.select).toHaveBeenCalled();

      expect(result.data).toEqual(createdTasks);
      expect(result.error).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('should successfully update a task', async () => {
      const updates: Partial<Task> = {
        title: 'Updated Title',
        completed: true,
      };

      const updatedTask = { ...mockTask, ...updates };

      mockSupabase.single.mockResolvedValueOnce({ data: updatedTask, error: null });

      const result = await service.updateTask('task-1', updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(mockSupabase.update).toHaveBeenCalledWith(updates);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'task-1');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result.data).toEqual(updatedTask);
      expect(result.error).toBeNull();
    });

    it('should handle update errors', async () => {
      const mockError = { message: 'Update failed' };

      mockSupabase.single.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.updateTask('task-1', { title: 'New Title' });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('updateTasks', () => {
    it('should successfully update multiple tasks', async () => {
      const updates = [
        { id: 'task-1', data: { title: 'Updated 1' } },
        { id: 'task-2', data: { title: 'Updated 2' } },
      ];

      mockSupabase.eq.mockResolvedValue({ data: null, error: null });

      const result = await service.updateTasks(updates);

      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeNull();
    });

    it('should handle errors in bulk updates', async () => {
      const updates = [
        { id: 'task-1', data: { title: 'Updated 1' } },
      ];

      const mockError = { message: 'Bulk update failed' };

      mockSupabase.eq.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.updateTasks(updates);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('deleteTask', () => {
    it('should successfully delete a task', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });

      const result = await service.deleteTask('task-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'task-1');

      expect(result.data).toBeUndefined();
      expect(result.error).toBeNull();
    });

    it('should handle deletion errors', async () => {
      const mockError = { message: 'Delete failed' };

      mockSupabase.eq.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.deleteTask('task-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('toggleTaskCompletion', () => {
    it('should successfully mark task as completed', async () => {
      const completedTask = {
        ...mockTask,
        completed: true,
        completed_at: '2025-01-15T12:00:00Z',
      };

      mockSupabase.single.mockResolvedValueOnce({ data: completedTask, error: null });

      const result = await service.toggleTaskCompletion('task-1', true);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: true,
          completed_at: expect.any(String),
        })
      );

      expect(result.data).toEqual(completedTask);
      expect(result.error).toBeNull();
    });

    it('should successfully mark task as incomplete', async () => {
      const incompletedTask = {
        ...mockTask,
        completed: false,
        completed_at: null,
      };

      mockSupabase.single.mockResolvedValueOnce({ data: incompletedTask, error: null });

      const result = await service.toggleTaskCompletion('task-1', false);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: false,
          completed_at: null,
        })
      );

      expect(result.data).toEqual(incompletedTask);
      expect(result.error).toBeNull();
    });

    it('should handle toggle errors', async () => {
      const mockError = { message: 'Toggle failed' };

      mockSupabase.single.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.toggleTaskCompletion('task-1', true);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });
});
