/**
 * Common service types and interfaces
 */

/**
 * Standard service result wrapper
 * Provides consistent error handling across all services
 */
export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Sort options for ordered queries
 */
export interface SortOptions {
  column: string;
  ascending?: boolean;
}

/**
 * Helper to create a success result
 */
export function createSuccessResult<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}

/**
 * Helper to create an error result
 */
export function createErrorResult<T>(error: Error): ServiceResult<T> {
  return { data: null, error };
}
