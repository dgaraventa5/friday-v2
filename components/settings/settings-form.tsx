"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryLimits, DailyMaxHours, DailyMaxTasks } from "@/lib/types";

interface SettingsFormProps {
  initialCategoryLimits: CategoryLimits;
  initialDailyMaxHours: DailyMaxHours;
  initialDailyMaxTasks: DailyMaxTasks;
}

const OPTIONS = Array.from({ length: 11 }, (_, i) => i);

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
        [type]: Math.max(0, Math.min(10, numValue)),
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
      [type]: Math.max(0, Math.min(10, numValue)),
    }));
  };

  const handleDailyMaxTasksChange = (
    type: "weekday" | "weekend",
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    setDailyMaxTasks((prev) => ({
      ...prev,
      [type]: Math.max(0, Math.min(10, numValue)),
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

      router.refresh();
      
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
    <div className="space-y-4">
      {message && (
        <div
          className={`p-2 rounded-lg border text-sm ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Category Limits Section */}
      <div className="space-y-2">
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Category Limits (hrs)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Maximum hours per day for each category
          </p>
        </div>

        {/* Header Row */}
        <div className="grid grid-cols-3 gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div></div>
          <div>Weekday</div>
          <div>Weekend</div>
        </div>

        {/* Category Rows */}
        <div className="space-y-1.5">
          {categories.map((category) => (
            <div key={category} className="grid grid-cols-3 gap-2 items-center">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {category}
              </div>
              <Select
                value={String(categoryLimits[category].weekday)}
                onValueChange={(value) =>
                  handleCategoryLimitChange(category, "weekday", value)
                }
              >
                <SelectTrigger className="w-full h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPTIONS.map((i) => (
                    <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(categoryLimits[category].weekend)}
                onValueChange={(value) =>
                  handleCategoryLimitChange(category, "weekend", value)
                }
              >
                <SelectTrigger className="w-full h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPTIONS.map((i) => (
                    <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Max Hours Section */}
      <div className="space-y-2">
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Daily Max Hours
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Maximum total hours per day across all categories
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 items-center">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Total Limit
          </div>
          <Select
            value={String(dailyMaxHours.weekday)}
            onValueChange={(value) => handleDailyMaxChange("weekday", value)}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPTIONS.map((i) => (
                <SelectItem key={i} value={String(i)}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(dailyMaxHours.weekend)}
            onValueChange={(value) => handleDailyMaxChange("weekend", value)}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPTIONS.map((i) => (
                <SelectItem key={i} value={String(i)}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Daily Max Tasks Section */}
      <div className="space-y-2">
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Daily Max Tasks
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Maximum number of tasks per day
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 items-center">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Task Count
          </div>
          <Select
            value={String(dailyMaxTasks.weekday)}
            onValueChange={(value) => handleDailyMaxTasksChange("weekday", value)}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPTIONS.map((i) => (
                <SelectItem key={i} value={String(i)}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(dailyMaxTasks.weekend)}
            onValueChange={(value) => handleDailyMaxTasksChange("weekend", value)}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPTIONS.map((i) => (
                <SelectItem key={i} value={String(i)}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-700">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-[100px]"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
