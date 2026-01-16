import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { validateStreak } from "@/lib/utils/streak-tracking";
import { getTodayForTimezone } from "@/lib/utils/date-utils";
import { createServices } from "@/lib/services";

export const dynamic = 'force-dynamic'; // Disable caching for this page

export default async function DashboardPage() {
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

  // Create services using the factory
  const services = createServices(supabase);

  // Fetch tasks using TasksService
  const tasksResult = await services.tasks.getTasksByUserId(data.user.id);
  const tasks = tasksResult.data || [];

  // Fetch reminders using RemindersService
  const remindersResult = await services.reminders.getRemindersByUserId(data.user.id);
  // Filter for active reminders only
  const reminders = (remindersResult.data || []).filter(r => r.is_active);

  // Fetch today's reminder completions using user's timezone
  // Default to America/Los_Angeles if not set (PST/PDT)
  const userTimezone = profile?.timezone || 'America/Los_Angeles';
  const todayStr = getTodayForTimezone(userTimezone);
  const completionsResult = await services.reminders.getReminderCompletions(todayStr);
  const reminderCompletions = completionsResult.data || [];

  return (
    <DashboardClient
      initialTasks={tasks}
      initialReminders={reminders}
      initialReminderCompletions={reminderCompletions}
      profile={profile}
      userEmail={data.user.email}
    />
  );
}
