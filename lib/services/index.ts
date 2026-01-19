/**
 * Service Factory and Exports
 *
 * This module provides a centralized way to create and access all services.
 * It ensures consistent service initialization and provides a single import point.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { TasksService } from './tasks-service';
import { RemindersService } from './reminders-service';
import { ProfileService } from './profile-service';
import { CalendarService } from './calendar-service';
import { CalendarEventsService } from './calendar-events-service';

/**
 * Interface defining all available services
 */
export interface Services {
  tasks: TasksService;
  reminders: RemindersService;
  profile: ProfileService;
  calendar: CalendarService;
  calendarEvents: CalendarEventsService;
}

/**
 * Factory function to create all services with a shared Supabase client
 *
 * @param supabase - The Supabase client to use for all services
 * @returns An object containing all initialized services
 *
 * @example
 * ```typescript
 * const supabase = createBrowserClient();
 * const services = createServices(supabase);
 *
 * // Use the services
 * const tasks = await services.tasks.getTasksByUserId(userId);
 * const profile = await services.profile.getProfile(userId);
 * ```
 */
export function createServices(supabase: SupabaseClient): Services {
  return {
    tasks: new TasksService(supabase),
    reminders: new RemindersService(supabase),
    profile: new ProfileService(supabase),
    calendar: new CalendarService(supabase),
    calendarEvents: new CalendarEventsService(supabase),
  };
}

// Re-export all service classes for direct instantiation if needed
export { TasksService } from './tasks-service';
export { RemindersService } from './reminders-service';
export { ProfileService } from './profile-service';
export { CalendarService } from './calendar-service';
export { CalendarEventsService } from './calendar-events-service';

// Re-export factory functions for individual services
export { createTasksService } from './tasks-service';
export { createRemindersService } from './reminders-service';
export { createProfileService } from './profile-service';
export { createCalendarService } from './calendar-service';
export { createCalendarEventsService } from './calendar-events-service';

// Re-export service interfaces for type checking
export type { ITasksService } from './tasks-service';
export type { IRemindersService } from './reminders-service';
export type { IProfileService } from './profile-service';
export type { ICalendarService } from './calendar-service';
export type { ICalendarEventsService } from './calendar-events-service';

// Re-export common types
export type { ServiceResult, PaginationOptions, SortOptions } from './types';
export { createSuccessResult, createErrorResult } from './types';
