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
}

export interface ReminderCompletion {
  id: string;
  reminder_id: string;
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
