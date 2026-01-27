import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CategoryLimits, DailyMaxHours, DailyMaxTasks } from "@/lib/types";
import { createProfileService } from "@/lib/services";
import { verifyOrigin } from "@/lib/utils/security";

interface SettingsUpdateRequest {
  category_limits: CategoryLimits;
  daily_max_hours: DailyMaxHours;
  daily_max_tasks: DailyMaxTasks;
  recalibration_enabled?: boolean;
  recalibration_time?: string;
  recalibration_include_tomorrow?: boolean;
}

// Validate category limits
function validateCategoryLimits(limits: any): limits is CategoryLimits {
  if (!limits || typeof limits !== "object") return false;

  const categories = ["Work", "Home", "Health", "Personal"];
  for (const category of categories) {
    if (!limits[category]) return false;
    if (
      typeof limits[category].weekday !== "number" ||
      typeof limits[category].weekend !== "number"
    )
      return false;
    if (
      limits[category].weekday < 0 ||
      limits[category].weekday > 24 ||
      limits[category].weekend < 0 ||
      limits[category].weekend > 24
    )
      return false;
  }

  return true;
}

// Validate daily max hours
function validateDailyMaxHours(hours: any): hours is DailyMaxHours {
  if (!hours || typeof hours !== "object") return false;

  if (
    typeof hours.weekday !== "number" ||
    typeof hours.weekend !== "number"
  )
    return false;

  if (
    hours.weekday < 0 ||
    hours.weekday > 24 ||
    hours.weekend < 0 ||
    hours.weekend > 24
  )
    return false;

  return true;
}

// Validate daily max tasks
function validateDailyMaxTasks(tasks: any): tasks is DailyMaxTasks {
  if (!tasks || typeof tasks !== "object") return false;

  if (
    typeof tasks.weekday !== "number" ||
    typeof tasks.weekend !== "number"
  )
    return false;

  if (
    tasks.weekday < 1 ||
    tasks.weekday > 20 ||
    tasks.weekend < 1 ||
    tasks.weekend > 20
  )
    return false;

  return true;
}

// Validate recalibration time (HH:MM format)
function validateRecalibrationTime(time: any): boolean {
  if (typeof time !== "string") return false;
  // Accept HH:MM format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// PATCH - Partial updates (e.g., timezone)
export async function PATCH(request: Request) {
  // Verify origin to prevent CSRF
  const originError = verifyOrigin(request);
  if (originError) return originError;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Handle timezone update
    if (body.timezone !== undefined) {
      if (typeof body.timezone !== "string" || body.timezone.length === 0) {
        return NextResponse.json(
          { error: "Invalid timezone" },
          { status: 400 }
        );
      }
      updates.timezone = body.timezone;
    }

    // If no valid updates, return early
    if (Object.keys(updates).length === 1) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update profile
    const profileService = createProfileService(supabase);
    const result = await profileService.updateProfile(user.id, updates);

    if (result.error) {
      console.error("Error updating profile:", result.error);
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Settings updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in settings PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Full settings update
export async function POST(request: Request) {
  // Verify origin to prevent CSRF
  const originError = verifyOrigin(request);
  if (originError) return originError;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body: SettingsUpdateRequest = await request.json();

    // Validate category limits
    if (!validateCategoryLimits(body.category_limits)) {
      return NextResponse.json(
        { error: "Invalid category limits" },
        { status: 400 }
      );
    }

    // Validate daily max hours
    if (!validateDailyMaxHours(body.daily_max_hours)) {
      return NextResponse.json(
        { error: "Invalid daily max hours" },
        { status: 400 }
      );
    }

    // Validate daily max tasks
    if (!validateDailyMaxTasks(body.daily_max_tasks)) {
      return NextResponse.json(
        { error: "Invalid daily max tasks" },
        { status: 400 }
      );
    }

    // Validate recalibration time if provided
    if (body.recalibration_time !== undefined && !validateRecalibrationTime(body.recalibration_time)) {
      return NextResponse.json(
        { error: "Invalid recalibration time format (expected HH:MM)" },
        { status: 400 }
      );
    }

    // Update profile using ProfileService
    const profileService = createProfileService(supabase);
    const result = await profileService.updateProfile(user.id, {
      category_limits: body.category_limits,
      daily_max_hours: body.daily_max_hours,
      daily_max_tasks: body.daily_max_tasks,
      ...(body.recalibration_enabled !== undefined && {
        recalibration_enabled: body.recalibration_enabled,
      }),
      ...(body.recalibration_time !== undefined && {
        recalibration_time: body.recalibration_time,
      }),
      ...(body.recalibration_include_tomorrow !== undefined && {
        recalibration_include_tomorrow: body.recalibration_include_tomorrow,
      }),
      updated_at: new Date().toISOString(),
    });

    if (result.error) {
      console.error("Error updating profile:", result.error);
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Settings updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in settings API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

