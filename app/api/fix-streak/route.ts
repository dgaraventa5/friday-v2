import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update profile with correct streak data
    const { data, error } = await supabase
      .from('profiles')
      .update({
        last_completion_date: '2026-01-13',
        current_streak: 2,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[fix-streak] Updated profile:', data);

    return NextResponse.json({
      success: true,
      profile: data,
    });
  } catch (error) {
    console.error('[fix-streak] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fix streak' },
      { status: 500 }
    );
  }
}
