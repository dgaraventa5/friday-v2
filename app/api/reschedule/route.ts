import { createClient } from '@/lib/supabase/server';
import { assignStartDates } from '@/lib/utils/task-prioritization';
import { verifyOrigin } from '@/lib/utils/security';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Verify origin to prevent CSRF
  const originError = verifyOrigin(request);
  if (originError) return originError;

  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('category_limits, daily_max_hours, daily_max_tasks')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get all tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (tasksError) {
      console.error('[reschedule] Error fetching tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    if (!tasks) {
      return NextResponse.json({ tasks: [], warnings: [] });
    }

    // Run scheduling algorithm
    const result = assignStartDates(
      tasks,
      profile.category_limits,
      profile.daily_max_hours,
      profile.daily_max_tasks || { weekday: 4, weekend: 4 }
    );

    // Update only tasks that were rescheduled
    console.log('[reschedule] Updating', result.rescheduledTasks.length, 'tasks in database');

    const updatePromises = result.rescheduledTasks.map(({ task }) => {
      console.log(`[reschedule] Updating "${task.title}": ${task.start_date}`);
      return supabase
        .from('tasks')
        .update({ start_date: task.start_date })
        .eq('id', task.id);
    });

    const updateResults = await Promise.all(updatePromises);

    // Check for update errors
    const errors = updateResults.filter(r => r.error);
    if (errors.length > 0) {
      console.error('[reschedule] Update errors:', errors);
      return NextResponse.json({
        error: 'Some tasks failed to update',
      }, { status: 500 });
    }

    console.log('[reschedule] Successfully updated', result.rescheduledTasks.length, 'tasks');

    return NextResponse.json({
      success: true,
      rescheduled: result.rescheduledTasks.length,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('[reschedule] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reschedule tasks' },
      { status: 500 }
    );
  }
}
