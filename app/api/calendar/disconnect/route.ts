import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCalendarService } from '@/lib/services/calendar-service';
import { CalendarSlot } from '@/lib/types';

/**
 * DELETE /api/calendar/disconnect
 * Disconnect a calendar from a slot
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slot = searchParams.get('slot') as CalendarSlot;

    if (!slot || !['personal', 'work'].includes(slot)) {
      return NextResponse.json({ error: 'Invalid slot parameter' }, { status: 400 });
    }

    const calendarService = createCalendarService(supabase);

    // Delete the connection for this slot
    // Note: Events are cascade-deleted via FK constraints
    const result = await calendarService.deleteConnectionBySlot(user.id, slot);

    if (result.error) {
      console.error('Error disconnecting calendar:', result.error);
      return NextResponse.json(
        { error: 'Failed to disconnect calendar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
