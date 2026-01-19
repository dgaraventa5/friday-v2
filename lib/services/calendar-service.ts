import { SupabaseClient } from '@supabase/supabase-js';
import { BaseService } from './base-service';
import { ServiceResult, createSuccessResult, createErrorResult } from './types';
import { ConnectedCalendar, CalendarSlot } from '../types';

/**
 * Interface defining all calendar connection operations
 */
export interface ICalendarService {
  getConnectionsByUserId(userId: string): Promise<ServiceResult<ConnectedCalendar[]>>;
  getConnectionBySlot(userId: string, slot: CalendarSlot): Promise<ServiceResult<ConnectedCalendar | null>>;
  getConnectionById(connectionId: string): Promise<ServiceResult<ConnectedCalendar>>;
  createConnection(data: Partial<ConnectedCalendar>): Promise<ServiceResult<ConnectedCalendar>>;
  updateConnection(connectionId: string, updates: Partial<ConnectedCalendar>): Promise<ServiceResult<ConnectedCalendar>>;
  deleteConnection(connectionId: string): Promise<ServiceResult<void>>;
  deleteConnectionBySlot(userId: string, slot: CalendarSlot): Promise<ServiceResult<void>>;
  getActiveConnections(): Promise<ServiceResult<ConnectedCalendar[]>>;
}

/**
 * Service for managing calendar connection operations
 * Encapsulates all Supabase interactions for connected_calendars
 */
export class CalendarService extends BaseService implements ICalendarService {
  private readonly TABLE = 'connected_calendars';

  /**
   * Get all calendar connections for a user
   */
  async getConnectionsByUserId(userId: string): Promise<ServiceResult<ConnectedCalendar[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('slot', { ascending: true });

      if (error) {
        const err = this.handleError(error, 'Failed to fetch calendar connections');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as ConnectedCalendar[]);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error fetching calendar connections');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Get a specific calendar connection by slot
   */
  async getConnectionBySlot(userId: string, slot: CalendarSlot): Promise<ServiceResult<ConnectedCalendar | null>> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('slot', slot)
        .maybeSingle();

      if (error) {
        const err = this.handleError(error, 'Failed to fetch calendar connection');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as ConnectedCalendar | null);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error fetching calendar connection');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Get a calendar connection by ID
   */
  async getConnectionById(connectionId: string): Promise<ServiceResult<ConnectedCalendar>> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE)
        .select('*')
        .eq('id', connectionId)
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to fetch calendar connection');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as ConnectedCalendar);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error fetching calendar connection');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Create a new calendar connection
   */
  async createConnection(data: Partial<ConnectedCalendar>): Promise<ServiceResult<ConnectedCalendar>> {
    try {
      const { data: connection, error } = await this.supabase
        .from(this.TABLE)
        .insert(data)
        .select()
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to create calendar connection');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(connection as ConnectedCalendar);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error creating calendar connection');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Update a calendar connection
   */
  async updateConnection(connectionId: string, updates: Partial<ConnectedCalendar>): Promise<ServiceResult<ConnectedCalendar>> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', connectionId)
        .select()
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to update calendar connection');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as ConnectedCalendar);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error updating calendar connection');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Delete a calendar connection by ID
   * Note: Events are automatically cascade-deleted via FK constraint
   */
  async deleteConnection(connectionId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase
        .from(this.TABLE)
        .delete()
        .eq('id', connectionId);

      if (error) {
        const err = this.handleError(error, 'Failed to delete calendar connection');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(undefined as void);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error deleting calendar connection');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Delete a calendar connection by user and slot
   */
  async deleteConnectionBySlot(userId: string, slot: CalendarSlot): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase
        .from(this.TABLE)
        .delete()
        .eq('user_id', userId)
        .eq('slot', slot);

      if (error) {
        const err = this.handleError(error, 'Failed to delete calendar connection');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(undefined as void);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error deleting calendar connection');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Get all active connections (for background sync)
   * Note: This requires admin/service role for cross-user access
   */
  async getActiveConnections(): Promise<ServiceResult<ConnectedCalendar[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE)
        .select('*')
        .eq('is_active', true);

      if (error) {
        const err = this.handleError(error, 'Failed to fetch active calendar connections');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as ConnectedCalendar[]);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error fetching active calendar connections');
      this.logError(err);
      return createErrorResult(err);
    }
  }
}

/**
 * Factory function to create a CalendarService instance
 */
export function createCalendarService(supabase: SupabaseClient): CalendarService {
  return new CalendarService(supabase);
}
