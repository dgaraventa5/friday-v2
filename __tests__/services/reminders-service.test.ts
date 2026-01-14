import { RemindersService } from '@/lib/services/reminders-service';
import { Reminder, ReminderCompletion } from '@/lib/types';
import { SupabaseClient } from '@supabase/supabase-js';

// Create a properly chainable mock Supabase client
const createMockSupabaseClient = () => {
  const client = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  };

  return client;
};

describe('RemindersService', () => {
  let service: RemindersService;
  let mockSupabase: any;

  const mockReminder: Reminder = {
    id: 'reminder-1',
    user_id: 'user-123',
    title: 'Morning Exercise',
    time_label: '08:00:00',
    recurrence_type: 'daily',
    recurrence_interval: 1,
    recurrence_days: null,
    monthly_type: null,
    monthly_week_position: null,
    end_type: 'never',
    end_count: null,
    current_count: 0,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  const mockCompletion: ReminderCompletion = {
    id: 'completion-1',
    reminder_id: 'reminder-1',
    completion_date: '2025-01-15',
    status: 'completed',
    completed_at: '2025-01-15T08:30:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    service = new RemindersService(mockSupabase as unknown as SupabaseClient);
  });

  describe('getRemindersByUserId', () => {
    it('should successfully fetch reminders for a user', async () => {
      const mockReminders = [mockReminder, { ...mockReminder, id: 'reminder-2', title: 'Evening Walk' }];

      mockSupabase.order.mockResolvedValueOnce({ data: mockReminders, error: null });

      const result = await service.getRemindersByUserId('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('reminders');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });

      expect(result.data).toEqual(mockReminders);
      expect(result.error).toBeNull();
    });

    it('should handle errors when fetching reminders', async () => {
      const mockError = { message: 'Database error' };

      mockSupabase.order.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.getRemindersByUserId('user-123');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to fetch reminders');
    });
  });

  describe('getReminderById', () => {
    it('should successfully fetch a single reminder', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: mockReminder, error: null });

      const result = await service.getReminderById('reminder-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('reminders');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'reminder-1');
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result.data).toEqual(mockReminder);
      expect(result.error).toBeNull();
    });

    it('should handle reminder not found', async () => {
      const mockError = { message: 'Reminder not found' };

      mockSupabase.single.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.getReminderById('nonexistent');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('createReminder', () => {
    it('should successfully create a reminder', async () => {
      const newReminderData: Partial<Reminder> = {
        user_id: 'user-123',
        title: 'Daily Standup',
        time_label: '09:00:00',
        recurrence_type: 'daily',
        recurrence_interval: 1,
        end_type: 'never',
        is_active: true,
      };

      mockSupabase.single.mockResolvedValueOnce({ data: mockReminder, error: null });

      const result = await service.createReminder(newReminderData);

      expect(mockSupabase.from).toHaveBeenCalledWith('reminders');
      expect(mockSupabase.insert).toHaveBeenCalledWith(newReminderData);
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result.data).toEqual(mockReminder);
      expect(result.error).toBeNull();
    });

    it('should handle creation errors', async () => {
      const mockError = { message: 'Validation error' };

      mockSupabase.single.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.createReminder({});

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to create reminder');
    });
  });

  describe('updateReminder', () => {
    it('should successfully update a reminder', async () => {
      const updates: Partial<Reminder> = {
        title: 'Updated Exercise',
        time_label: '07:00:00',
      };

      const updatedReminder = { ...mockReminder, ...updates };

      mockSupabase.single.mockResolvedValueOnce({ data: updatedReminder, error: null });

      const result = await service.updateReminder('reminder-1', updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('reminders');
      expect(mockSupabase.update).toHaveBeenCalledWith(updates);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'reminder-1');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result.data).toEqual(updatedReminder);
      expect(result.error).toBeNull();
    });

    it('should handle update errors', async () => {
      const mockError = { message: 'Update failed' };

      mockSupabase.single.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.updateReminder('reminder-1', { title: 'New Title' });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('deleteReminder', () => {
    it('should successfully delete a reminder', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });

      const result = await service.deleteReminder('reminder-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('reminders');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'reminder-1');

      expect(result.data).toBeUndefined();
      expect(result.error).toBeNull();
    });

    it('should handle deletion errors', async () => {
      const mockError = { message: 'Delete failed' };

      mockSupabase.eq.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.deleteReminder('reminder-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('getReminderCompletions', () => {
    it('should successfully fetch completions for a date', async () => {
      const mockCompletions = [mockCompletion, { ...mockCompletion, id: 'completion-2' }];

      mockSupabase.eq.mockResolvedValueOnce({ data: mockCompletions, error: null });

      const result = await service.getReminderCompletions('2025-01-15');

      expect(mockSupabase.from).toHaveBeenCalledWith('reminder_completions');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('completion_date', '2025-01-15');

      expect(result.data).toEqual(mockCompletions);
      expect(result.error).toBeNull();
    });

    it('should handle errors fetching completions', async () => {
      const mockError = { message: 'Database error' };

      mockSupabase.eq.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.getReminderCompletions('2025-01-15');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('getReminderCompletionsByReminderId', () => {
    it('should successfully fetch completions for a reminder', async () => {
      const mockCompletions = [mockCompletion];

      mockSupabase.order.mockResolvedValueOnce({ data: mockCompletions, error: null });

      const result = await service.getReminderCompletionsByReminderId('reminder-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('reminder_completions');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('reminder_id', 'reminder-1');
      expect(mockSupabase.order).toHaveBeenCalledWith('completion_date', { ascending: false });

      expect(result.data).toEqual(mockCompletions);
      expect(result.error).toBeNull();
    });
  });

  describe('createCompletion', () => {
    it('should successfully create a completion', async () => {
      const completionData: Partial<ReminderCompletion> = {
        reminder_id: 'reminder-1',
        completion_date: '2025-01-15',
        status: 'completed',
        completed_at: '2025-01-15T08:30:00Z',
      };

      mockSupabase.single.mockResolvedValueOnce({ data: mockCompletion, error: null });

      const result = await service.createCompletion(completionData);

      expect(mockSupabase.from).toHaveBeenCalledWith('reminder_completions');
      expect(mockSupabase.insert).toHaveBeenCalledWith(completionData);
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result.data).toEqual(mockCompletion);
      expect(result.error).toBeNull();
    });

    it('should handle creation errors', async () => {
      const mockError = { message: 'Creation failed' };

      mockSupabase.single.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.createCompletion({});

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('upsertCompletion', () => {
    it('should successfully upsert a completion', async () => {
      const completionData: Partial<ReminderCompletion> = {
        reminder_id: 'reminder-1',
        completion_date: '2025-01-15',
        status: 'completed',
        completed_at: '2025-01-15T08:30:00Z',
      };

      mockSupabase.single.mockResolvedValueOnce({ data: mockCompletion, error: null });

      const result = await service.upsertCompletion(completionData);

      expect(mockSupabase.from).toHaveBeenCalledWith('reminder_completions');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        completionData,
        { onConflict: 'reminder_id,completion_date' }
      );
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result.data).toEqual(mockCompletion);
      expect(result.error).toBeNull();
    });

    it('should handle upsert errors', async () => {
      const mockError = { message: 'Upsert failed' };

      mockSupabase.single.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.upsertCompletion({});

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('deleteCompletion', () => {
    it('should successfully delete a completion', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });

      const result = await service.deleteCompletion('completion-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('reminder_completions');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'completion-1');

      expect(result.data).toBeUndefined();
      expect(result.error).toBeNull();
    });

    it('should handle deletion errors', async () => {
      const mockError = { message: 'Delete failed' };

      mockSupabase.eq.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.deleteCompletion('completion-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('deleteCompletionByReminderAndDate', () => {
    it('should successfully delete completion by reminder and date', async () => {
      // Mock the chained eq calls
      const secondEq = jest.fn().mockResolvedValueOnce({ data: null, error: null });
      mockSupabase.eq.mockReturnValueOnce({ eq: secondEq });

      const result = await service.deleteCompletionByReminderAndDate('reminder-1', '2025-01-15');

      expect(mockSupabase.from).toHaveBeenCalledWith('reminder_completions');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('reminder_id', 'reminder-1');
      expect(secondEq).toHaveBeenCalledWith('completion_date', '2025-01-15');

      expect(result.data).toBeUndefined();
      expect(result.error).toBeNull();
    });

    it('should handle deletion errors', async () => {
      const mockError = { message: 'Delete failed' };
      const secondEq = jest.fn().mockResolvedValueOnce({ data: null, error: mockError });
      mockSupabase.eq.mockReturnValueOnce({ eq: secondEq });

      const result = await service.deleteCompletionByReminderAndDate('reminder-1', '2025-01-15');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });
});
