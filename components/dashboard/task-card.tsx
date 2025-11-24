"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Task } from "@/lib/types";
import { formatDateStringForDisplay } from "@/lib/utils/date-utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { EditTaskDialog } from "./edit-task-dialog";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const supabase = createClient();

  const handleToggleComplete = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      })
      .eq("id", task.id)
      .select()
      .single();

    if (!error && data) {
      onUpdate(data);
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);

    if (!error) {
      onDelete(task.id);
    }
  };

  const priorityColors = {
    A: "border-l-orange-500 border-l-4",
    B: "border-l-blue-500 border-l-4",
    C: "border-l-green-500 border-l-4",
  };

  const priorityColor = task.is_mit
    ? "border-l-red-500 border-l-4"
    : task.priority
    ? priorityColors[task.priority]
    : "border-l-slate-300 border-l-4";

  return (
    <>
      <Card
        className={cn(
          "p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm transition-all duration-[250ms] ease-out hover:shadow-md hover:-translate-y-0.5",
          priorityColor,
          task.completed && "opacity-50"
        )}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            className="mt-1 h-5 w-5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3
                  className={cn(
                    "text-base font-semibold leading-snug text-slate-800 dark:text-slate-100",
                    task.completed && "line-through text-slate-500"
                  )}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {task.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {task.is_mit && (
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                      MIT
                    </span>
                  )}
                  {task.priority && (
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        task.priority === "A" &&
                          "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
                        task.priority === "B" && "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                        task.priority === "C" && "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      )}
                    >
                      Priority {task.priority}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Due: {formatDateStringForDisplay(task.due_date)}
                    </span>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>

      <EditTaskDialog
        task={task}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onUpdate={onUpdate}
      />
    </>
  );
}
