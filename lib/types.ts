export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: 'A' | 'B' | 'C' | null;
  is_mit: boolean;
  completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  importance: 'important' | 'not-important';
  urgency: 'urgent' | 'not-urgent';
  estimated_hours: number;
  start_date: string | null;
  pinned_date: string | null;
  category: 'Work' | 'Home' | 'Health' | 'Personal';
  recurring_series_id: string | null;
  is_recurring: boolean;
  recurring_interval: 'daily' | 'weekly' | 'monthly' | null;
  recurring_days: number[] | null;
  recurring_end_type: 'never' | 'after' | null;
  recurring_end_count: number | null;
  recurring_current_count: number;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  current_streak: number;
  longest_streak: number;
  last_completion_date: string | null;
  category_limits: CategoryLimits;
  daily_max_hours: DailyMaxHours;
  daily_max_tasks: DailyMaxTasks;
  onboarding_completed: boolean;
  // Recalibration settings
  recalibration_enabled: boolean;
  recalibration_time: string;  // "HH:MM:SS" format from database
  recalibration_include_tomorrow: boolean;
  recalibration_last_dismissed_date: string | null;  // "YYYY-MM-DD" format, synced across devices
  timezone: string | null;  // User's timezone (e.g., "America/Los_Angeles")
}

export interface CategoryLimits {
  Work: { weekday: number; weekend: number };
  Home: { weekday: number; weekend: number };
  Health: { weekday: number; weekend: number };
  Personal: { weekday: number; weekend: number };
}

export interface DailyMaxHours {
  weekday: number;
  weekend: number;
}

export interface DailyMaxTasks {
  weekday: number;
  weekend: number;
}

export type EisenhowerQuadrant = 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';

export interface TaskWithScore extends Task {
  priorityScore: number;
  quadrant: EisenhowerQuadrant;
}

// Reminder types
export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  time_label: string | null; // Format: "HH:MM:SS"
  recurrence_type: 'daily' | 'weekly' | 'monthly';
  recurrence_interval: number;
  recurrence_days: number[] | null; // For weekly: days of week (0-6). For monthly: day of month
  monthly_type: 'day_of_month' | 'nth_weekday' | null;
  monthly_week_position: number | null; // 1-4 or -1 for last
  end_type: 'never' | 'after';
  end_count: number | null;
  current_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Calendar source fields
  source: ReminderSource;
  source_event_id: string | null;
}

export interface ReminderCompletion {
  id: string;
  reminder_id: string;
  user_id: string;
  completion_date: string; // Format: "YYYY-MM-DD"
  status: 'completed' | 'skipped';
  completed_at: string;
}

export interface ReminderWithStatus extends Reminder {
  todayStatus: 'incomplete' | 'completed' | 'skipped';
}

// Recalibration types
export interface RecalibrationTask extends Task {
  daysOverdue: number;           // Positive = overdue, negative = due in future, 0 = today
  originalDueDate: string;       // For display purposes
  pendingChanges: PendingTaskChanges | null;
}

export interface PendingTaskChanges {
  due_date?: string;
  importance?: 'important' | 'not-important';
  urgency?: 'urgent' | 'not-urgent';
  completed?: boolean;
}

export interface RecalibrationState {
  isOpen: boolean;
  tasks: RecalibrationTask[];
  pendingChanges: Map<string, PendingTaskChanges>;  // taskId -> changes
  hiddenTaskIds: Set<string>;    // Tasks removed from current session
  reviewedTaskIds: Set<string>;  // Tasks explicitly reviewed (keep-as-is or modified)
}

export interface RecalibrationLocalStorage {
  lastDismissedDate: string | null;  // "YYYY-MM-DD" format
  snoozedUntil: string | null;       // ISO timestamp
}

export type DatePreset = 'tomorrow' | 'plus2' | 'plus7' | 'custom';

export interface RecalibrationSettings {
  recalibration_enabled: boolean;
  recalibration_time: string;  // "HH:MM" format
  recalibration_include_tomorrow: boolean;
}

// Calendar integration types
export type CalendarSlot = 'personal' | 'work';
export type CalendarConnectionType = 'google' | 'ical_url';
export type EventStatus = 'busy' | 'free' | 'tentative';
export type ReminderSource = 'user' | 'calendar';

export interface ConnectedCalendar {
  id: string;
  user_id: string;
  slot: CalendarSlot;
  connection_type: CalendarConnectionType;
  name: string;
  color: string;
  // Google OAuth fields
  google_account_id: string | null;
  google_account_email: string | null;
  google_calendar_id: string | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: string | null;
  // iCal URL fields
  ical_url: string | null;
  // Sync status
  last_synced_at: string | null;
  sync_error: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  calendar_id: string;
  external_id: string;
  title: string;
  description: string | null;
  start_time: string; // ISO timestamp
  end_time: string; // ISO timestamp
  is_all_day: boolean;
  status: EventStatus;
  location: string | null;
  event_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventWithCalendar extends CalendarEvent {
  calendar: Pick<ConnectedCalendar, 'id' | 'name' | 'color' | 'slot'>;
}

export interface TodayCalendarData {
  events: CalendarEventWithCalendar[];
  connections: ConnectedCalendar[];
  lastSyncedAt: string | null;
  syncError: string | null;
}

// ============================================
// Onboarding Types
// ============================================

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export type OnboardingStep =
  | 'welcome'
  | 'signup'
  | 'personalize'
  | 'first_task_title'
  | 'first_task_due_date'
  | 'first_task_importance'
  | 'first_task_urgency'
  | 'matrix_reveal'
  | 'dashboard';

export type PersonalizationOption =
  | 'work_organization'
  | 'stop_procrastinating'
  | 'better_prioritization'
  | 'adhd_focus';

export interface ChecklistItemStatus {
  id: string;
  completed: boolean;
  completed_at?: string;
}

export interface OnboardingProgress {
  id: string;
  user_id: string;
  status: OnboardingStatus;
  current_step: OnboardingStep;
  personalization_responses: PersonalizationOption[];
  checklist_items: ChecklistItemStatus[];
  prompts_shown: string[];
  started_at: string | null;
  completed_at: string | null;
  skipped_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskWizardState {
  title: string;
  dueDate: string | null;
  dueDatePreset: 'today' | 'tomorrow' | 'this_week' | 'someday' | 'custom' | null;
  importance: 'important' | 'not-important' | null;
  urgency: 'urgent' | 'not-urgent' | null;
}

export interface OnboardingChecklistItem {
  id: string;
  label: string;
  description?: string;
  estimatedTime?: string;
  preCompleted?: boolean;
  ctaLabel?: string;
  ctaRoute?: string;
  contextTrigger?: string;
}

export interface PersonalizationOptionConfig {
  id: PersonalizationOption;
  emoji: string;
  label: string;
  description?: string;
}

export interface ContextualPromptConfig {
  id: string;
  scheduledDay?: number;
  actionTrigger?: 'create_reminder' | 'connect_calendar';
  type: 'modal' | 'inline' | 'system_task';
  title: string;
  description: string;
  ctaLabel?: string;
  ctaAction?: string;
}

export interface QuadrantExplanation {
  name: string;
  color: string;
  headline: string;
  description: string;
  emoji: string;
}
