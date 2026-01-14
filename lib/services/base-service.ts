import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Base service class that all services extend
 * Provides common functionality like error handling
 */
export abstract class BaseService {
  constructor(protected supabase: SupabaseClient) {}

  /**
   * Standardizes error handling across all services
   * Converts various error types into a consistent Error object
   */
  protected handleError(error: any, context?: string): Error {
    // If it's already an Error with a message, use it
    if (error?.message) {
      const errorMessage = context
        ? `${context}: ${error.message}`
        : error.message;
      return new Error(errorMessage);
    }

    // If it's a Supabase error object
    if (error?.error_description) {
      return new Error(error.error_description);
    }

    // If it's a string
    if (typeof error === 'string') {
      return new Error(context ? `${context}: ${error}` : error);
    }

    // Fallback for unknown error types
    return new Error(context || 'An unexpected error occurred');
  }

  /**
   * Logs error for debugging (can be extended to use proper logging service)
   */
  protected logError(error: Error, context?: string): void {
    console.error(`[Service Error]${context ? ` ${context}` : ''}:`, error);
  }
}
