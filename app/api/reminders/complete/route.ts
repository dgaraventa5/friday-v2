import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { verifyOrigin } from '@/lib/utils/security';

/**
 * POST /api/reminders/complete
 * Complete or uncomplete a reminder
 */
export async function POST(request: Request) {
  // Verify origin to prevent CSRF
  const originError = verifyOrigin(request);
  if (originError) return originError;

  try {
    const body = await request.json();
    const { reminderId, completionDate, action } = body;

    if (!reminderId || !completionDate || !action) {
      return NextResponse.json(
        { error: 'reminderId, completionDate, and action are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Log action for debugging (omit userId in production)

    if (action === 'complete') {
      // Upsert completion
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
        console.error('[API] Complete error:', error);
        return NextResponse.json({ error: 'Failed to complete reminder' }, { status: 500 });
      }

      // Update reminder count
      const { data: reminder } = await supabase
        .from('reminders')
        .select('current_count')
        .eq('id', reminderId)
        .single();

      if (reminder) {
        await supabase
          .from('reminders')
          .update({ current_count: (reminder.current_count || 0) + 1 })
          .eq('id', reminderId);
      }

      revalidatePath('/dashboard');
      return NextResponse.json({ success: true, data });

    } else if (action === 'uncomplete') {
      const { completionId } = body;
      if (!completionId) {
        return NextResponse.json({ error: 'completionId required for uncomplete' }, { status: 400 });
      }

      const { error } = await supabase
        .from('reminder_completions')
        .delete()
        .eq('id', completionId);

      if (error) {
        console.error('[API] Uncomplete error:', error);
        return NextResponse.json({ error: 'Failed to uncomplete reminder' }, { status: 500 });
      }

      // Decrement reminder count
      const { data: reminder } = await supabase
        .from('reminders')
        .select('current_count')
        .eq('id', reminderId)
        .single();

      if (reminder && reminder.current_count > 0) {
        await supabase
          .from('reminders')
          .update({ current_count: reminder.current_count - 1 })
          .eq('id', reminderId);
      }

      revalidatePath('/dashboard');
      return NextResponse.json({ success: true });

    } else if (action === 'skip') {
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
        console.error('[API] Skip error:', error);
        return NextResponse.json({ error: 'Failed to skip reminder' }, { status: 500 });
      }

      revalidatePath('/dashboard');
      return NextResponse.json({ success: true, data });

    } else if (action === 'unskip') {
      const { completionId } = body;
      if (!completionId) {
        return NextResponse.json({ error: 'completionId required for unskip' }, { status: 400 });
      }

      const { error } = await supabase
        .from('reminder_completions')
        .delete()
        .eq('id', completionId);

      if (error) {
        console.error('[API] Unskip error:', error);
        return NextResponse.json({ error: 'Failed to unskip reminder' }, { status: 500 });
      }

      revalidatePath('/dashboard');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
