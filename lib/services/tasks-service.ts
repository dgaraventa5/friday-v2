import { SupabaseClient } from '@supabase/supabase-js';
import { BaseService } from './base-service';
import { ServiceResult, createSuccessResult, createErrorResult } from './types';
import { Task } from '../types';

/**
 * Interface defining all task-related operations
 */
export interface ITasksService {
  // Read operations
  getTasksByUserId(userId: string): Promise<ServiceResult<Task[]>>;
  getTaskById(taskId: string): Promise<ServiceResult<Task>>;

  // Write operations
  createTask(taskData: Partial<Task>): Promise<ServiceResult<Task>>;
  createTasks(tasks: Partial<Task>[]): Promise<ServiceResult<Task[]>>;
  updateTask(taskId: string, updates: Partial<Task>): Promise<ServiceResult<Task>>;
  updateTasks(updates: Array<{ id: string; data: Partial<Task> }>): Promise<ServiceResult<void>>;
  deleteTask(taskId: string): Promise<ServiceResult<void>>;

  // Completion operations
  toggleTaskCompletion(taskId: string, completed: boolean): Promise<ServiceResult<Task>>;
}

/**
 * Service for managing task operations
 * Encapsulates all Supabase interactions for tasks
 */
export class TasksService extends BaseService implements ITasksService {
  private readonly TABLE_NAME = 'tasks';

  private readonly VALID_IMPORTANCE = ['important', 'not-important'];
  private readonly VALID_URGENCY = ['urgent', 'not-urgent'];
  private readonly VALID_CATEGORIES = ['Work', 'Home', 'Health', 'Personal'];

  /**
   * Validate task data before insert/update
   */
  private validateTaskData(taskData: Partial<Task>): string | null {
    if (taskData.importance && !this.VALID_IMPORTANCE.includes(taskData.importance)) {
      return `Invalid importance value: ${taskData.importance}`;
    }
    if (taskData.urgency && !this.VALID_URGENCY.includes(taskData.urgency)) {
      return `Invalid urgency value: ${taskData.urgency}`;
    }
    if (taskData.category && !this.VALID_CATEGORIES.includes(taskData.category)) {
      return `Invalid category value: ${taskData.category}`;
    }
    if (taskData.estimated_hours !== undefined && taskData.estimated_hours !== null) {
      if (typeof taskData.estimated_hours !== 'number' || taskData.estimated_hours < 0 || taskData.estimated_hours > 100) {
        return 'estimated_hours must be a number between 0 and 100';
      }
    }
    return null;
  }

  /**
   * Get all tasks for a specific user
   */
  async getTasksByUserId(userId: string): Promise<ServiceResult<Task[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        const err = this.handleError(error, 'Failed to fetch tasks');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as Task[]);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error fetching tasks');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(taskId: string): Promise<ServiceResult<Task>> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to fetch task');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as Task);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error fetching task');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskData: Partial<Task>): Promise<ServiceResult<Task>> {
    const validationError = this.validateTaskData(taskData);
    if (validationError) {
      return createErrorResult({ message: validationError, code: 'VALIDATION_ERROR' });
    }

    try {
      const { data, error } = await this.supabase
        .from(this.TABLE_NAME)
        .insert(taskData)
        .select()
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to create task');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as Task);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error creating task');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Create multiple tasks in bulk
   */
  async createTasks(tasks: Partial<Task>[]): Promise<ServiceResult<Task[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE_NAME)
        .insert(tasks)
        .select();

      if (error) {
        const err = this.handleError(error, 'Failed to create tasks');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as Task[]);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error creating tasks');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Update a single task
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<ServiceResult<Task>> {
    const validationError = this.validateTaskData(updates);
    if (validationError) {
      return createErrorResult({ message: validationError, code: 'VALIDATION_ERROR' });
    }

    try {
      const { data, error } = await this.supabase
        .from(this.TABLE_NAME)
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to update task');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as Task);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error updating task');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Update multiple tasks in bulk
   * Note: Supabase doesn't support updating multiple rows with different values in one query,
   * so we execute updates sequentially. For better performance, consider using a stored procedure.
   */
  async updateTasks(updates: Array<{ id: string; data: Partial<Task> }>): Promise<ServiceResult<void>> {
    try {
      // Execute all updates
      const updatePromises = updates.map(({ id, data }) =>
        this.supabase
          .from(this.TABLE_NAME)
          .update(data)
          .eq('id', id)
      );

      const results = await Promise.all(updatePromises);

      // Check if any update failed
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        const err = this.handleError(errors[0].error, 'Failed to update some tasks');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(undefined as void);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error updating tasks');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', taskId);

      if (error) {
        const err = this.handleError(error, 'Failed to delete task');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(undefined as void);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error deleting task');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Toggle task completion status
   */
  async toggleTaskCompletion(taskId: string, completed: boolean): Promise<ServiceResult<Task>> {
    try {
      const updates: Partial<Task> = {
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      };

      const { data, error } = await this.supabase
        .from(this.TABLE_NAME)
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to toggle task completion');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as Task);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error toggling task completion');
      this.logError(err);
      return createErrorResult(err);
    }
  }
}

/**
 * Factory function to create a TasksService instance
 */
export function createTasksService(supabase: SupabaseClient): TasksService {
  return new TasksService(supabase);
}
