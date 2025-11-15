import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateStreak } from '@/lib/utils/streak-tracking';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await updateStreak(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error updating streak:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
