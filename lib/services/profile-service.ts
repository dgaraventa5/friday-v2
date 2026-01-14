import { SupabaseClient } from '@supabase/supabase-js';
import { BaseService } from './base-service';
import { ServiceResult, createSuccessResult, createErrorResult } from './types';
import { Profile } from '../types';

/**
 * Interface defining all profile-related operations
 */
export interface IProfileService {
  // Profile operations
  getProfile(userId: string): Promise<ServiceResult<Profile>>;
  updateProfile(userId: string, updates: Partial<Profile>): Promise<ServiceResult<Profile>>;

  // Streak-specific operations
  updateStreakFields(
    userId: string,
    fields: {
      current_streak?: number;
      longest_streak?: number;
      last_completion_date?: string | null;
    }
  ): Promise<ServiceResult<Profile>>;
}

/**
 * Service for managing user profile operations
 * Encapsulates all Supabase interactions for profiles
 */
export class ProfileService extends BaseService implements IProfileService {
  private readonly TABLE_NAME = 'profiles';

  /**
   * Get a user's profile
   */
  async getProfile(userId: string): Promise<ServiceResult<Profile>> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to fetch profile');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as Profile);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error fetching profile');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Update a user's profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<ServiceResult<Profile>> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE_NAME)
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to update profile');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as Profile);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error updating profile');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Update streak-related fields on a user's profile
   * This is a convenience method for streak tracking operations
   */
  async updateStreakFields(
    userId: string,
    fields: {
      current_streak?: number;
      longest_streak?: number;
      last_completion_date?: string | null;
    }
  ): Promise<ServiceResult<Profile>> {
    try {
      // Build the update object with only provided fields
      const updates: Partial<Profile> = {};

      if (fields.current_streak !== undefined) {
        updates.current_streak = fields.current_streak;
      }

      if (fields.longest_streak !== undefined) {
        updates.longest_streak = fields.longest_streak;
      }

      if (fields.last_completion_date !== undefined) {
        updates.last_completion_date = fields.last_completion_date;
      }

      const { data, error } = await this.supabase
        .from(this.TABLE_NAME)
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        const err = this.handleError(error, 'Failed to update streak fields');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as Profile);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error updating streak fields');
      this.logError(err);
      return createErrorResult(err);
    }
  }
}

/**
 * Factory function to create a ProfileService instance
 */
export function createProfileService(supabase: SupabaseClient): ProfileService {
  return new ProfileService(supabase);
}
