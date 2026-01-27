import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateStreak, recalculateStreak } from '@/lib/utils/streak-tracking';
import { verifyOrigin } from '@/lib/utils/security';

export async function POST(request: Request) {
  // Verify origin to prevent CSRF
  const originError = verifyOrigin(request);
  if (originError) return originError;

  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this is a recalculation request (for unchecking tasks)
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'update';

    if (action === 'recalculate') {
      await recalculateStreak(user.id);
    } else {
      await updateStreak(user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error updating streak:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
