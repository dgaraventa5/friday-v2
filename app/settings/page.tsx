import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/settings-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-2">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Settings
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Task scheduling preferences
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-lg border border-border shadow-sm p-4">
            <SettingsForm
              initialCategoryLimits={profile.category_limits}
              initialDailyMaxHours={profile.daily_max_hours}
              initialDailyMaxTasks={profile.daily_max_tasks || { weekday: 4, weekend: 4 }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

