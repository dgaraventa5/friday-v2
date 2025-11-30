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
