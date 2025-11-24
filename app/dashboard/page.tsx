import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

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

  // Always fetch fresh profile data (not cached)
  // This is especially important when returning from settings
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false });

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
      profile={profile} 
      userEmail={data.user.email}
    />
  );
}
