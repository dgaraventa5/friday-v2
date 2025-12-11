import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { validateStreak } from "@/lib/utils/streak-tracking";
import { getTodayLocal } from "@/lib/utils/date-utils";

export const dynamic = 'force-dynamic'; // Disable caching for this page

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { updated?: string };
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Validate and fetch profile - this ensures streak is reset if user missed a day
  const profile = await validateStreak(data.user.id);

  // If profile fetch failed, redirect to login
  if (!profile) {
    redirect("/auth/login");
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false });

  // Fetch reminders
  const { data: reminders } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", data.user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Fetch today's reminder completions
  const todayStr = getTodayLocal();
  const { data: reminderCompletions } = await supabase
    .from("reminder_completions")
    .select("*")
    .eq("completion_date", todayStr);

  // Log if we're loading after a settings update
  if (searchParams.updated) {
    console.log('[Dashboard] Loading after settings update, profile data:', {
      category_limits: profile?.category_limits,
      daily_max_hours: profile?.daily_max_hours,
      daily_max_tasks: profile?.daily_max_tasks,
    });
  }

  return (
    <DashboardClient 
      initialTasks={tasks || []} 
      initialReminders={reminders || []}
      initialReminderCompletions={reminderCompletions || []}
      profile={profile} 
      userEmail={data.user.email}
    />
  );
}
