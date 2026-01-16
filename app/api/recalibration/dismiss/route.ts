import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProfileService } from "@/lib/services";
import { getTodayLocal } from "@/lib/utils/date-utils";

/**
 * POST /api/recalibration/dismiss
 * Marks the recalibration modal as dismissed for today (cross-device)
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = getTodayLocal();

    // Update profile with today's date
    const profileService = createProfileService(supabase);
    const result = await profileService.updateProfile(user.id, {
      recalibration_last_dismissed_date: today,
      updated_at: new Date().toISOString(),
    });

    if (result.error) {
      console.error("Error updating recalibration dismissed date:", result.error);
      return NextResponse.json(
        { error: "Failed to update dismissal date" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, dismissed_date: today },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in recalibration dismiss API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
