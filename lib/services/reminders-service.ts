import { SupabaseClient } from '@supabase/supabase-js';
import { BaseService } from './base-service';
import { ServiceResult, createSuccessResult, createErrorResult } from './types';
import { Reminder, ReminderCompletion } from '../types';

/**
 * Interface defining all reminder-related operations
 */
export interface IRemindersService {
  // Reminder operations
  getRemindersByUserId(userId: string): Promise<ServiceResult<Reminder[]>>;
  getReminderById(reminderId: string): Promise<ServiceResult<Reminder>>;
  createReminder(reminderData: Partial<Reminder>): Promise<ServiceResult<Reminder>>;
  updateReminder(reminderId: string, updates: Partial<Reminder>): Promise<ServiceResult<Reminder>>;
  deleteReminder(reminderId: string): Promise<ServiceResult<void>>;

  // Completion operations
  getReminderCompletions(completionDate: string): Promise<ServiceResult<ReminderCompletion[]>>;
  getReminderCompletionsByReminderId(reminderId: string): Promise<ServiceResult<ReminderCompletion[]>>;
  createCompletion(completionData: Partial<ReminderCompletion>): Promise<ServiceResult<ReminderCompletion>>;
  upsertCompletion(completionData: Partial<ReminderCompletion>): Promise<ServiceResult<ReminderCompletion>>;
  deleteCompletion(completionId: string): Promise<ServiceResult<void>>;
  deleteCompletionByReminderAndDate(reminderId: string, completionDate: string): Promise<ServiceResult<void>>;
}

/**
 * Service for managing reminder and reminder completion operations
 * Encapsulates all Supabase interactions for reminders
 */
export class RemindersService extends BaseService implements IRemindersService {
  private readonly REMINDERS_TABLE = 'reminders';
  private readonly COMPLETIONS_TABLE = 'reminder_completions';

  /**
   * Get all reminders for a specific user
   */
  async getRemindersByUserId(userId: string): Promise<ServiceResult<Reminder[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.REMINDERS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        const err = this.handleError(error, 'Failed to fetch reminders');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as Reminder[]);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error fetching reminders');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Get a single reminder by ID
   */
  async getReminderById(reminderId: string): Promise<ServiceResult<Reminder>> {
    try {
      const { data, error } = await this.supabase
        .from(this.REMINDERS_TABLE)
        .select('*')
        .eq('id', reminderId)
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to fetch reminder');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as Reminder);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error fetching reminder');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Create a new reminder
   */
  async createReminder(reminderData: Partial<Reminder>): Promise<ServiceResult<Reminder>> {
    try {
      const { data, error } = await this.supabase
        .from(this.REMINDERS_TABLE)
        .insert(reminderData)
        .select()
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to create reminder');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as Reminder);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error creating reminder');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Update a reminder
   */
  async updateReminder(reminderId: string, updates: Partial<Reminder>): Promise<ServiceResult<Reminder>> {
    try {
      const { data, error } = await this.supabase
        .from(this.REMINDERS_TABLE)
        .update(updates)
        .eq('id', reminderId)
        .select()
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to update reminder');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as Reminder);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error updating reminder');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(reminderId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase
        .from(this.REMINDERS_TABLE)
        .delete()
        .eq('id', reminderId);

      if (error) {
        const err = this.handleError(error, 'Failed to delete reminder');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(undefined as void);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error deleting reminder');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Get reminder completions for a specific date
   */
  async getReminderCompletions(completionDate: string): Promise<ServiceResult<ReminderCompletion[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.COMPLETIONS_TABLE)
        .select('*')
        .eq('completion_date', completionDate);

      if (error) {
        const err = this.handleError(error, 'Failed to fetch reminder completions');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as ReminderCompletion[]);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error fetching reminder completions');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Get all completions for a specific reminder
   */
  async getReminderCompletionsByReminderId(reminderId: string): Promise<ServiceResult<ReminderCompletion[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.COMPLETIONS_TABLE)
        .select('*')
        .eq('reminder_id', reminderId)
        .order('completion_date', { ascending: false });

      if (error) {
        const err = this.handleError(error, 'Failed to fetch reminder completions');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as ReminderCompletion[]);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error fetching reminder completions');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Create a reminder completion
   */
  async createCompletion(completionData: Partial<ReminderCompletion>): Promise<ServiceResult<ReminderCompletion>> {
    try {
      const { data, error } = await this.supabase
        .from(this.COMPLETIONS_TABLE)
        .insert(completionData)
        .select()
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to create reminder completion');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as ReminderCompletion);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error creating reminder completion');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Upsert (insert or update) a reminder completion
   * Useful for ensuring a completion exists with specific data
   */
  async upsertCompletion(completionData: Partial<ReminderCompletion>): Promise<ServiceResult<ReminderCompletion>> {
    try {
      const { data, error } = await this.supabase
        .from(this.COMPLETIONS_TABLE)
        .upsert(completionData, {
          onConflict: 'reminder_id,completion_date',
        })
        .select()
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to upsert reminder completion');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as ReminderCompletion);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error upserting reminder completion');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Delete a reminder completion by ID
   */
  async deleteCompletion(completionId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase
        .from(this.COMPLETIONS_TABLE)
        .delete()
        .eq('id', completionId);

      if (error) {
        const err = this.handleError(error, 'Failed to delete reminder completion');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(undefined as void);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error deleting reminder completion');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Delete a reminder completion by reminder ID and date
   * Useful for removing completions without knowing the completion ID
   */
  async deleteCompletionByReminderAndDate(
    reminderId: string,
    completionDate: string
  ): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase
        .from(this.COMPLETIONS_TABLE)
        .delete()
        .eq('reminder_id', reminderId)
        .eq('completion_date', completionDate);

      if (error) {
        const err = this.handleError(error, 'Failed to delete reminder completion');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(undefined as void);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error deleting reminder completion');
      this.logError(err);
      return createErrorResult(err);
    }
  }
}

/**
 * Factory function to create a RemindersService instance
 */
export function createRemindersService(supabase: SupabaseClient): RemindersService {
  return new RemindersService(supabase);
}
