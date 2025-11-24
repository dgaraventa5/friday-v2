import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CategoryLimits, DailyMaxHours, DailyMaxTasks } from "@/lib/types";

interface SettingsUpdateRequest {
  category_limits: CategoryLimits;
  daily_max_hours: DailyMaxHours;
  daily_max_tasks: DailyMaxTasks;
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

export async function POST(request: Request) {
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

    // Update profile in database
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        category_limits: body.category_limits,
        daily_max_hours: body.daily_max_hours,
        daily_max_tasks: body.daily_max_tasks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
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

