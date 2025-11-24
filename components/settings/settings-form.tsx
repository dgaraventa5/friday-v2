"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryLimits, DailyMaxHours, DailyMaxTasks } from "@/lib/types";

interface SettingsFormProps {
  initialCategoryLimits: CategoryLimits;
  initialDailyMaxHours: DailyMaxHours;
  initialDailyMaxTasks: DailyMaxTasks;
}

export function SettingsForm({
  initialCategoryLimits,
  initialDailyMaxHours,
  initialDailyMaxTasks,
}: SettingsFormProps) {
  const router = useRouter();
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimits>(
    initialCategoryLimits
  );
  const [dailyMaxHours, setDailyMaxHours] = useState<DailyMaxHours>(
    initialDailyMaxHours
  );
  const [dailyMaxTasks, setDailyMaxTasks] = useState<DailyMaxTasks>(
    initialDailyMaxTasks
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleCategoryLimitChange = (
    category: keyof CategoryLimits,
    type: "weekday" | "weekend",
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setCategoryLimits((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: Math.max(0, Math.min(24, numValue)),
      },
    }));
  };

  const handleDailyMaxChange = (
    type: "weekday" | "weekend",
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setDailyMaxHours((prev) => ({
      ...prev,
      [type]: Math.max(0, Math.min(24, numValue)),
    }));
  };

  const handleDailyMaxTasksChange = (
    type: "weekday" | "weekend",
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    setDailyMaxTasks((prev) => ({
      ...prev,
      [type]: Math.max(1, Math.min(20, numValue)),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_limits: categoryLimits,
          daily_max_hours: dailyMaxHours,
          daily_max_tasks: dailyMaxTasks,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      setMessage({
        type: "success",
        text: "Settings saved successfully! Redirecting...",
      });

      // Refresh the page data and navigate back to dashboard
      router.refresh();
      
      // Navigate back to dashboard with a timestamp to force refresh
      setTimeout(() => {
        router.push(`/dashboard?updated=${Date.now()}`);
      }, 1000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({
        type: "error",
        text: "Failed to save settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const categories: Array<keyof CategoryLimits> = [
    "Work",
    "Home",
    "Health",
    "Personal",
  ];

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Category Limits Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Category Limits (hrs)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Set maximum hours per day for each task category
          </p>
        </div>

        <div className="space-y-6">
          {categories.map((category) => (
            <div
              key={category}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start"
            >
              <div className="font-medium text-slate-700 dark:text-slate-300 md:pt-3">
                {category}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${category}-weekday`}>Weekday</Label>
                <Input
                  id={`${category}-weekday`}
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={categoryLimits[category].weekday}
                  onChange={(e) =>
                    handleCategoryLimitChange(
                      category,
                      "weekday",
                      e.target.value
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${category}-weekend`}>Weekend</Label>
                <Input
                  id={`${category}-weekend`}
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={categoryLimits[category].weekend}
                  onChange={(e) =>
                    handleCategoryLimitChange(
                      category,
                      "weekend",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Max Hours Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Daily Max Hours
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Set maximum total hours per day across all categories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div className="font-medium text-slate-700 dark:text-slate-300 md:pt-3">
            Total Limit
          </div>
          <div className="space-y-2">
            <Label htmlFor="daily-weekday">Weekday</Label>
            <Input
              id="daily-weekday"
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={dailyMaxHours.weekday}
              onChange={(e) =>
                handleDailyMaxChange("weekday", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="daily-weekend">Weekend</Label>
            <Input
              id="daily-weekend"
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={dailyMaxHours.weekend}
              onChange={(e) =>
                handleDailyMaxChange("weekend", e.target.value)
              }
            />
          </div>
        </div>
      </div>

      {/* Daily Max Tasks Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Daily Max Tasks
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Set maximum number of tasks per day (prevents overload)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div className="font-medium text-slate-700 dark:text-slate-300 md:pt-3">
            Task Count Limit
          </div>
          <div className="space-y-2">
            <Label htmlFor="tasks-weekday">Weekday</Label>
            <Input
              id="tasks-weekday"
              type="number"
              min="1"
              max="20"
              step="1"
              value={dailyMaxTasks.weekday}
              onChange={(e) =>
                handleDailyMaxTasksChange("weekday", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tasks-weekend">Weekend</Label>
            <Input
              id="tasks-weekend"
              type="number"
              min="1"
              max="20"
              step="1"
              value={dailyMaxTasks.weekend}
              onChange={(e) =>
                handleDailyMaxTasksChange("weekend", e.target.value)
              }
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

