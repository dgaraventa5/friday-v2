'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ReminderCompletion } from '@/lib/types';

interface ActionResult<T> {
  data?: T;
  error?: string;
}

/**
 * Complete a reminder for a specific date
 * Uses server-side Supabase client to ensure consistent auth with page loads
 */
export async function completeReminderAction(
  reminderId: string,
  completionDate: string
): Promise<ActionResult<ReminderCompletion>> {
  const supabase = await createClient();

  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Not authenticated. Please refresh the page.' };
  }

  // Upsert completion (insert or update if exists)
  const { data, error } = await supabase
    .from('reminder_completions')
    .upsert({
      reminder_id: reminderId,
      completion_date: completionDate,
      status: 'completed',
      completed_at: new Date().toISOString(),
    }, {
      onConflict: 'reminder_id,completion_date',
    })
    .select()
    .single();

  if (error) {
    console.error('[Server Action] completeReminderAction error:', error);
    return { error: error.message };
  }

  if (!data) {
    return { error: 'Failed to save completion - no data returned' };
  }

  revalidatePath('/dashboard');
  return { data: data as ReminderCompletion };
}

/**
 * Uncomplete a reminder (delete completion record)
 */
export async function uncompleteReminderAction(
  completionId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Not authenticated. Please refresh the page.' };
  }

  const { error } = await supabase
    .from('reminder_completions')
    .delete()
    .eq('id', completionId);

  if (error) {
    console.error('[Server Action] uncompleteReminderAction error:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return {};
}

/**
 * Skip a reminder for a specific date
 */
export async function skipReminderAction(
  reminderId: string,
  completionDate: string
): Promise<ActionResult<ReminderCompletion>> {
  const supabase = await createClient();

  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Not authenticated. Please refresh the page.' };
  }

  const { data, error } = await supabase
    .from('reminder_completions')
    .upsert({
      reminder_id: reminderId,
      completion_date: completionDate,
      status: 'skipped',
    }, {
      onConflict: 'reminder_id,completion_date',
    })
    .select()
    .single();

  if (error) {
    console.error('[Server Action] skipReminderAction error:', error);
    return { error: error.message };
  }

  if (!data) {
    return { error: 'Failed to skip reminder - no data returned' };
  }

  revalidatePath('/dashboard');
  return { data: data as ReminderCompletion };
}

/**
 * Undo skip (delete the skipped completion record)
 */
export async function undoSkipReminderAction(
  completionId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Not authenticated. Please refresh the page.' };
  }

  const { error } = await supabase
    .from('reminder_completions')
    .delete()
    .eq('id', completionId);

  if (error) {
    console.error('[Server Action] undoSkipReminderAction error:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return {};
}

/**
 * Update reminder's current_count
 */
export async function updateReminderCountAction(
  reminderId: string,
  increment: boolean
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Not authenticated. Please refresh the page.' };
  }

  // Get current count
  const { data: reminder, error: fetchError } = await supabase
    .from('reminders')
    .select('current_count')
    .eq('id', reminderId)
    .single();

  if (fetchError || !reminder) {
    return { error: 'Failed to fetch reminder' };
  }

  const newCount = increment
    ? (reminder.current_count || 0) + 1
    : Math.max(0, (reminder.current_count || 0) - 1);

  const { error } = await supabase
    .from('reminders')
    .update({ current_count: newCount })
    .eq('id', reminderId);

  if (error) {
    console.error('[Server Action] updateReminderCountAction error:', error);
    return { error: error.message };
  }

  return {};
}
